import { DtlsParameters, MediaKind, Producer, Router, RtpCapabilities, RtpParameters, Worker } from "mediasoup/node/lib/types";
import config from "./config";
import { Peer } from "./Peer";

export class Room{
    private id:string;
    private router?: Router
    private peers: Map<string,Peer>;
    private userPeerMap: Map<string,string> = new Map();

    constructor(roomId:string, worker:Worker){
        this.id = roomId;
        const mediaCodecs = config.mediasoup.router.mediaCodecs
        worker.createRouter({
            mediaCodecs
        })
        .then((router:Router) => {
            this.router = router
        })

        this.peers = new Map();
    }

    addPeer(peer: Peer,userId:string){
        this.peers.set(peer.id,peer);
        this.userPeerMap.set(userId,peer.id);
    }

    getPeer(peerId: string){
        return this.peers.get(peerId);
    }

    getProducers(peerId: string){
        const peer = this.peers.get(peerId);
        const producerList = peer?.getProducers;
        
        return producerList;
    }

    broadcast(peerId:String, type:String, data: any){
        this.peers.forEach((peer: Peer,key: string)=>{
            if(key != peerId){
                peer.send({
                    type: type,
                    payload: data
                });
            }
        })
    }

    getRouterRtpCapabilities(){
        return this.router?.rtpCapabilities;
    }

    async createWebRtcTrasport(peerId: string){
        const {maxIncomingBitrate,initialAvailableOutgoingBitrate, listenIps} = config.mediasoup.webRtcTransport;
        
        const transport = await this.router?.createWebRtcTransport({
            listenIps: listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate
        })

        if(maxIncomingBitrate){
            await transport?.setMaxIncomingBitrate(maxIncomingBitrate);
        }

        transport?.on('dtlsstatechange',(dtlsState) => {
            if(dtlsState === "closed")  transport.close();
        });

        transport?.on('@close',() => {
            console.log("Trasport closed for:", peerId);
        });

        if(!transport)  return;
        //add transport for peer:
        this.peers.get(peerId)?.addTransport(transport);

        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        }
    }

    async connectPeerTransport(
        peerId: string,
        transportId: string,
        dtlsParameters: DtlsParameters
    ){
        if(!this.peers.has(peerId)) return;
        await this.peers.get(peerId)?.connectTransport(transportId,dtlsParameters);
    }

    async produce(
        peerId: string,
        producerTransportId: string,
        rtpParameters: RtpParameters,
        kind: MediaKind
    ){
        const producer = await this.peers.get(peerId)?.createProducer(peerId,producerTransportId,rtpParameters,kind);
        if(!producer)   return;
        
        this.broadcast(peerId,'new-producer',{
            producerPeerId: peerId,
            producerId: producer.id,
        })

        return producer.id;
    }
    
    async consume(
        peerId: string,
        consumerTransportId: string,
        producerId: string,
        rtpCapabilities: RtpCapabilities
    ){
        const consumerData = await this.peers.get(peerId)?.createConsumer(consumerTransportId,producerId,rtpCapabilities);
        if(!consumerData)   return;
        const {consumer,params} = consumerData;

        consumer.on('producerclose', ()=>{
            this.peers.get(peerId)?.removeConsumer(consumer.id);
            this.broadcast(peerId,'consumer-closed',{
                consumerId: consumer.id
            })
        });

        return params;
    }

    removePeer(peerId: string){
        console.log("remove peer triggered");
        this.peers.get(peerId)?.close();
        this.peers.delete(peerId);
    }

    isEmpty(){
        return this.peers.size === 0;
    }
    
}