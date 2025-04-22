import * as mediasoup from "mediasoup";
import WebSocket from "ws";
import { DtlsParameters, Transport,MediaKind, RtpParameters, Producer, Consumer, RtpCapabilities, WebRtcTransport } from "mediasoup/node/lib/types";
import { OutgoingMessage } from "../types";


function getRandomString(length:number){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv1234567890!@#$%^&*";
    let randomString = "";
    for(let i=0;i<length;i++){
        randomString += chars[Math.floor(Math.random() * chars.length)];
    }

    return randomString;
}

export class Peer{
    public id:string;
    private userId: string;
    private ws: WebSocket;
    private transports: Map<string,Transport>;
    private consumers: Map<string,Consumer>;
    private producers: Map<string,Producer>;

    constructor(userId: string , ws:WebSocket){
        this.id = getRandomString(10);
        this.userId = userId;
        this.ws = ws;
        this.transports = new Map();
        this.consumers = new Map();
        this.producers = new Map();
    }

    addTransport(transport: WebRtcTransport){
        this.transports.set(transport.id,transport);
    }

    async connectTransport(
        transportId: string,
        dtlsParameters: DtlsParameters
    ){
        if(!this.transports.has(transportId)){
            console.log("Transport Id Doesn't exist!");
            return;
        }

        const transport = this.transports.get(transportId);
        await transport?.connect({
            dtlsParameters
        })
    }

    async createProducer(
        peerId: string,
        producerTransportId: string,
        rtpParameters: RtpParameters,
        kind: MediaKind
    ){
        const producerTransport = this.transports.get(producerTransportId);
        const producer = await producerTransport?.produce({
            kind,
            rtpParameters
        })
        if(!producer){
            console.log("producer failure");
            return;
        }
        
        //add producer to producers list:
        this.producers.set(peerId,producer);

        //cleanup
        producer.on("transportclose", () => {
            producer.close();
            this.producers.delete(producer.id);
        });
        
        return producer;
    }

    async createConsumer(
        consumerTransportId: string,
        producerId: string,
        rtpCapabilities: RtpCapabilities
    ){
        const consumerTrasport = this.transports.get(consumerTransportId);
        const consumer = await consumerTrasport?.consume({
            producerId,
            rtpCapabilities,
            paused: false
        });
        if(!consumer){
            console.log("Consumer failure");
            return;
        }

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
              spatialLayer: 2,
              temporalLayer: 2
            })
        }

        //add consumer to consumer list:
        this.consumers.set(producerId,consumer);

        //cleanup:
        consumer.on("transportclose",()=>{
            consumer.close();
            this.consumers.delete(producerId);
        });

        return{
            consumer: consumer,
            params:{
                producerId: producerId,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        };
    }

    removeProducer(producerId: string){
        this.producers.delete(producerId);
    }

    removeConsumer(producerId: string) {
        const consumer = this.consumers.get(producerId);
        if (consumer) {
            consumer.close();
            this.consumers.delete(producerId);
        }
    }
    

    send(payload: OutgoingMessage){
        this.ws.send(JSON.stringify(payload));
    }

    getProducers(){
        return Array.from(this.producers.values());
    }

    close(){
        console.log("closing peer");
        this.transports.forEach((t) =>  t.close());
    }
}