import * as mediasoup from "mediasoup";
import { WebSocket } from "ws";
import { Producer, Worker } from "mediasoup/node/lib/types";
import config from "./config"
import { Room } from "./Room";
import { Peer } from "./Peer";
import jwt,{JwtPayload} from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";

let workers : Worker[] = [];
let nextWorkerIndex = 0;
const rooms = new Map<string,Room>

export async function runMediasoupWorker(){
    const {numWorkers} = config.mediasoup;

    for(let i = 0;i<numWorkers;i++){
        const worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.worker.logLevel,
            logTags: config.mediasoup.worker.logTags,
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort
        });

        worker.on("died", () => {
            console.error(`Worker ${i} died, exiting...`);
            setTimeout(()=>process.exit(1),2000);
        })

        workers.push(worker);
    }

}

function getNextWorker(){
    const worker = workers[nextWorkerIndex];
    nextWorkerIndex++;
    nextWorkerIndex %= workers.length;
    return worker;
}

function getOrCreateRoom(roomId: string){
    let room = rooms.get(roomId);
    if(!room){
        const worker = getNextWorker();
        room = new Room(roomId, worker);
        rooms.set(roomId,room);
        console.log("New Room Created:",roomId);
    }

    return room;
}

export function handleMediasoupMessage(ws: WebSocket){

    let roomId: string | null;
    let peerId: string | null;
    ws.addEventListener("message",async(event)=>{
        const payload = event.data;
        const parseData = JSON.parse(payload.toString());
        if(parseData.class !== "mediasoup") return;

        switch(parseData.type){

            case "join-room":{
                try {
                    const {roomId: newRoomId,userId} = parseData.payload;
                    roomId = newRoomId;

                    if(!roomId){
                        throw new Error("Room Id Not Found");
                    }
                    
                    const room = getOrCreateRoom(roomId);
                    const peer = new Peer(userId, ws);
                    peerId = peer.id;

                    room.addPeer(peer,userId);

                    peer.send({ 
                        class: "mediasoup",
                        type: "joined-room",
                        payload:{
                            userId,
                            roomId,
                            peerId: peerId
                        }
                    });

                    break;
                } catch (error) {
                    console.error("Error in join-room:",error);
                }
                
            }

            case "get-router-rtp-capabilities": {
                if(!roomId){
                    console.error("Room Id not set yet");
                    return;
                }

                const room = rooms.get(roomId);
                if(!room || ! peerId)   return;

                const rtpCapabilities = room.getRouterRtpCapabilities();

                //making sure peer is in the given room:
                const peer = room.getPeer(peerId);
                if(!peer)    return;

                peer.send({ class: "mediasoup",
                    type: "router-rtp-capabilities",
                    payload: {
                        rtpCapabilities
                    }
                })

                break;
            }

            case "create-transport":{
                if(!roomId || !peerId)  return;

                const room = rooms.get(roomId);
                if(!room)   return;

                const {sending} = parseData.payload;
                const transport = await room.createWebRtcTrasport(peerId);

                const peer = room.getPeer(peerId);
                if(!peer)   return;

            
                peer.send({ 
                    class: "mediasoup",
                    type: "transport-created",
                    payload: {
                        id: transport?.id,
                        iceParameters: transport?.iceParameters,
                        iceCandidates : transport?.iceCandidates,
                        dtlsParameters: transport?.dtlsParameters,
                        sending
                    }
                })

                break;
            }

            case "connect-transport": {
                if(!roomId || !peerId)  return;

                const room = rooms.get(roomId);
                if(!room)   return;

                const {transportId,dtlsParameters} = parseData.payload;

                const peer = room.getPeer(peerId);
                if(!peer)   return;

                await room.connectPeerTransport(peerId,transportId,dtlsParameters);

                peer.send({ 
                    class: "mediasoup",
                    type: "transport-connected",
                    payload: {transportId}
                });

                break;
            }

            case "produce": {
                console.log("produce recieved");
                if(!roomId || !peerId)  return;

                const room = rooms.get(roomId);
                if(!room)   return;

                const {producerTransportId,rtpParameters,kind} = parseData.payload;

                const producerId = await room?.produce(peerId,producerTransportId,rtpParameters,kind);

                const peer = room.getPeer(peerId);
                if(!peer)   return;

                peer.send({
                    class: "mediasoup",
                    type: 'produced',
                    payload: {producerId}
                });

                break;
            }

            case "consume":{
                if(!roomId || !peerId)  return;

                const room = rooms.get(roomId);
                if(!room)   return;

                const {transportId,producerId,rtpCapabilities,username} = parseData.payload;
                const params = await room.consume(
                    peerId,
                    transportId,
                    producerId,
                    rtpCapabilities
                );

                const peer = room.getPeer(peerId);
                if(!peer)   return;

                peer.send({ 
                    class: "mediasoup",
                    type: "consumed",
                    payload: {
                        username,
                        params
                    }
                })

                break;
            }

            case "add-producers": {
                if(!roomId || !peerId)   return;
                const room = rooms.get(roomId);
                if(!room)   return;
                
                const {addUsers} = parseData.payload;
                const peer = room.getPeer(peerId);

                addUsers.forEach(({userId,username}:{userId:string,username:string})=>{
                    const producerPeerId = room.userPeerMap.get(userId);
                    if(!producerPeerId) return;
            
                    const producers:Producer[] = room.peerToProducer.get(producerPeerId) ?? [];
                    producers?.forEach((producer)=>{
                        peer?.send({
                            class: "mediasoup",
                            type: "new-producer",
                            payload:{
                                username,
                                producerId: producer?.id,
                                producerPeerId
                            }
                        });
                    })
                    
                });

                break;
            }

            case "remove-producers": {
                if(!roomId || !peerId)   return;
                const room = rooms.get(roomId);
                if(!room)   return;

                const {removeUsers} = parseData.payload;

                const peer = room.getPeer(peerId);

                removeUsers.forEach((userId:string)=>{
                    const producerPeerId = room.userPeerMap.get(userId);
                    if(!producerPeerId) return;
                    const producers:Producer[] = room.peerToProducer.get(producerPeerId) ?? [];
                    producers.forEach((producer)=>{
                        peer?.removeConsumer(producer.id);

                        peer?.send({
                            class: "mediasoup",
                            type: "consumer-closed",
                            payload: {
                                producerId: producer.id
                            }
                        })
                    })
                    
                });

                break;
            }

            case "leave-room":{
                
                if(!roomId || !peerId)  return;

                const room = rooms.get(roomId);
                if(!room)   return;

                room.removePeer(peerId);

                room.broadcast(peerId,"peer-left",
                    {
                        peerId
                    }
                );
                
                console.log("Leave room recieved");
                
                if(room.isEmpty()){
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} is empty, removing it`);
                }

                peerId = null;
                roomId = null;

                break;
                
            }

        }
    })
}