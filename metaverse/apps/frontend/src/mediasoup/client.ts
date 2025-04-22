import * as mediasoupClient from "mediasoup-client"
import { Consumer,Producer } from "mediasoup-client/lib/types";


export class MediasoupClient{
    private device: mediasoupClient.Device;
    private ws: WebSocket;
    private roomId: string;
    private peerId: string | null = null;
    private userId?: string
    private producerTransport: mediasoupClient.types.Transport | null = null;
    private consumerTransport: mediasoupClient.types.Transport | null = null;
    private consumers: Map<string,Consumer[]> = new Map();
    private producers = new Map();
    private onNewConsumer: ((consumer:Consumer, producerId: string) => void) | null = null;
    private onConsumerClosed: ((consumerId: string) => void) | null = null;
    private onProducerTransportCreated?: (client: MediasoupClient) => void;
    private producerIdToUsername: Map<string,string> = new Map();

    constructor(ws: WebSocket, roomId: string, token: string, onProducerTransportCreated: (client: MediasoupClient) => void){
        this.device = new mediasoupClient.Device;
        this.ws = ws;
        this.roomId = roomId;
        this.onProducerTransportCreated = onProducerTransportCreated;

        this.ws.onopen = () => {
            console.log("ws opened joining mediasoup");            
        }
        
        this.joinRoom(this.roomId,token);
        
        this.ws.addEventListener("message",(event)=>{
            const data = JSON.parse(event.data);
            this.handleRecievedMessage(data);
        })
        
    }

    private joinRoom(roomId: string,userId: string){
        this.send({
            class: "mediasoup",
            type: "join-room",
            payload:{
                roomId,
                userId,
            }
        });
    }

    private async handleRecievedMessage(data: any){
        const {type, payload} = data;
        switch(type){
            case "joined-room":
                console.log("joined room recieved");
                const {peerId,userId} = payload;
                this.peerId = peerId;
                this.userId = userId;
                this.send({
                    class: "mediasoup",
                    type: "get-router-rtp-capabilities",
                    payload: {}
                });

                break;
            
            case "router-rtp-capabilities":
                console.log("getting router rtp");
                await this.initDevice(payload);
                break;
            
            case "transport-created":
                console.log("transport created");
                await this.initTransport(payload);
                break;
            
            case "transport-connected":
                console.log("Tranposrt Connected", payload.transportId)
                break;

            case "produced":
                this.handleProduced(payload);
                break;
            
            case "consumed":
                this.handleConsumed(payload.params,payload.username);
                break;
            
            case "new-producer":
                await this.consumeProducer(payload.username,payload.producerId,payload.producerPeerId);
                break;
            
            case "consumer-closed":
                this.removeConsumer(payload.producerId);
                break;
            
            case "peer-left":
                console.log("peer left", payload.peerId);
                break;
        }
    }

    private async initDevice(payload: any){
        const routerRtpCapabilities = payload.rtpCapabilities;
        await this.device.load({routerRtpCapabilities});

        //create producer transport:
        this.send({
            class: "mediasoup",
            type: "create-transport",
            payload: {
                sending: true
            }
        });

        //create consumer transport:
        this.send({
            class: "mediasoup",
            type: "create-transport",
            payload: {
                sending:false
            }
        });
    } 
    
    private async initTransport(payload: any){
        const {id,iceParameters,iceCandidates,dtlsParameters,sending} = payload;

        const transport = sending? 
        this.device.createSendTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
        }):
        this.device.createRecvTransport({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters
        });

        if(sending){
            this.producerTransport = transport;

            if(this.onProducerTransportCreated){
                this.onProducerTransportCreated(this);
            }
            
            console.log("connecting transport");
            transport.on("connect",async ({dtlsParameters},callback,errback)=>{
                console.log("transport connected");
                try {
                    this.send({
                        class: "mediasoup",
                        type: "connect-transport",
                        payload: {
                            transportId: transport.id,
                            dtlsParameters
                        }
                    });

                    callback();
                } catch (error: any) {
                    errback(error);
                }   
            });

            transport.on("produce", async ({kind, rtpParameters}, callback, errback) => {
                console.log("produce request sent");
                try {
                    // Send the request to the server
                    this.send({
                        class: "mediasoup",
                        type: "produce",
                        payload: {
                            producerTransportId: transport.id,
                            rtpParameters,
                            kind
                        }
                    });
                    
                    const tempId = Date.now().toString();
                    callback({ id: tempId });
                } catch (error) {
                    console.error("Error in produce event:", error);
                    //if (errback) errback(error);
                }
            });
        }
        else{
            this.consumerTransport= transport;

            transport.on("connect",async ({dtlsParameters},callback,errback)=>{
                try {
                    this.send({
                        class: "mediasoup",
                        type: "connect-transport",
                        payload: {
                            transportId: transport.id,
                            dtlsParameters
                        }
                    });

                    callback();
                } catch (error: any) {
                    errback(error);
                }   
            })

        }
    }

    private handleProduced(payload: any){
        console.log("user started producing");
        const {producerId}= payload;

        if(this.producers.size> 0){
            const lastProducer = Array.from(this.producers.values())[this.producers.size-1];
            this.producers.delete(lastProducer.id);
            this.producers.set(producerId,lastProducer);
        }
    }

    private async handleConsumed(params: any, username:string){
        const {id,kind,producerId,rtpParameters} = params;

        if(!this.consumerTransport) return;

        const consumer = await this.consumerTransport.consume({
            id: id,
            producerId: producerId,
            kind: kind,
            rtpParameters: rtpParameters
        });

        this.consumers.set(username,[...(this.consumers.get(username)??[]),consumer]);
        this.producerIdToUsername.set(producerId,username);

        if(this.onNewConsumer){
            this.onNewConsumer(consumer,username) 
        }
    }

    private async consumeProducer(username:string,producerId: string, producerPeerId: string){
        if(!this.device.loaded || !this.consumerTransport || this.peerId === producerPeerId)
            return;

        this.send({
            class: "mediasoup",
            type:"consume",
            payload: {
                username,
                transportId: this.consumerTransport.id,
                producerId: producerId,
                rtpCapabilities: this.device.rtpCapabilities
            }
        });
    }

    private removeConsumer(producerId: string){
        const username = this.producerIdToUsername.get(producerId);
        if(!username)   return;
        const consumers:Consumer[] = this.consumers.get(username) ?? [];
        
        consumers.forEach((consumer) => {
            if(consumer){
                consumer.close();
                this.consumers.delete(username);
            }
    
            if(this.onConsumerClosed && username){
                this.onConsumerClosed(username) 
            }
        })
        
    }

    private send(message: any){
        this.ws.send(JSON.stringify(message));
    }

    //public api:

    async produceAudio(track: MediaStreamTrack){
        if(!this.producerTransport){
            throw new Error("Producer Transport not created");
        }
        console.log("produce Audio called");

        let producer: Producer;

        producer = await this.producerTransport.produce({
            track:track,
            codecOptions:{
                opusStereo: true,
                opusDtx: true
            }
        });
        console.log(producer);

        this.producers.set(producer.id,producer);
        console.log(producer.id);
        
        return producer;
    }

    async produceVideo(track: MediaStreamTrack){
        if(!this.producerTransport){
            throw new Error("Producer Transport not created");
        }
        
        console.log("produce Video Called");
        
        const producer = await this.producerTransport.produce({
            track,
            encodings: [
                {maxBitrate: 100000},
                {maxBitrate: 300000},
                {maxBitrate: 900000}
            ],
            codecOptions:{
                videoGoogleMaxBitrate: 1000
            }
        })

        this.producers.set(producer.id,producer);
        console.log(producer.id);

        return producer;
    }

    setOnNewConsumer(callback: ((consumer: Consumer,peerId: string) => void) | null ){
        this.onNewConsumer = callback;
    }

    setOnConsumerClosed(callback: ((producerId: string) => void) | null){
        this.onConsumerClosed = callback;
    }

    getConsumers(){
        return this.consumers;
    }

    private close(){
        console.log("closing client side");
        this.producers.forEach((producer)=> producer.close());
        this.consumers.forEach((c)=> c.forEach((consumer) => consumer.close()));

        if(this.producerTransport){
            this.producerTransport.close();
        }

        if(this.consumerTransport){
            this.consumerTransport.close();
        }

        this.send({
            class: "mediasoup",
            type: "leave-room",
            payload: {}
        });
    }
    
    
}