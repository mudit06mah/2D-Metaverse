import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "../types";
import jwt,{JwtPayload} from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import client from "@repo/db"

function getRandomString(length:number){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv1234567890!@#$%^&*";
    let randomString = "";
    for(let i=0;i<length;i++){
        randomString += chars[Math.floor(Math.random() * chars.length)];
    }

    return randomString;
}

export class User{
    public id:string;
    public userId?:string;
    public username?: string;
    private spaceId?:string;
    private x: number;
    private y: number;
    private ws: WebSocket;
    constructor(ws: WebSocket){
        this.id = getRandomString(10);
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.initHandlers();
    }
    
    initHandlers(){
        this.ws.on("message",async(data)=>{
            const parseData = JSON.parse(data.toString());
            
            switch (parseData.type){
                case "join":
                    const token = parseData.payload.token;
                    const spaceId = parseData.payload.spaceId;
                    //verify token:
                    const userId = (jwt.verify(token,JWT_PASSWORD) as JwtPayload).userId;
                    if(!userId){
                        this.ws.close();
                        return;
                    }
                    this.userId = userId;

                    //verify spaceId:
                    const space = await client.space.findUnique({
                        where: {
                            id: spaceId
                        },
                        include: {
                            spaceElements: {
                                include: {
                                    element: true
                                }
                            },
                        }
                    });

                    if(!space){
                        this.ws.close();
                        return;
                    }
                    
                    this.spaceId = spaceId;

                    //set spawn coords:
                    RoomManager.getInstance().addUser(spaceId,this);
                    this.x = Math.floor(Math.random()*space.height);
                    this.y = Math.floor(Math.random()*space.width);

                    //sendspace joined message to user:
                    this.send({
                        type: "space-joined",
                        payload: {
                            userId: this.userId,
                            spawn:{
                                x: this.x,
                                y: this.y
                            },
                            users: RoomManager.getInstance().rooms.get(spaceId)?.filter((x)=>(x.id!==this.id))
                        }
                    });

                    //broadcast to other users:
                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.userId,
                            coords: {
                                x: this.x,
                                y: this.y
                            } 
                        }
                    }, this ,this.spaceId!)

                    break;
                
                case "move":
                    const moveX = parseInt(parseData.payload.coords.x);
                    const moveY = parseInt(parseData.payload.coords.y);
                    
                    const xDisplacement = Math.abs(this.x-moveX);
                    const yDisplacement = Math.abs(this.y-moveY);
                    

                   if((xDisplacement < 5 && yDisplacement == 0) || (xDisplacement == 0 && yDisplacement < 5)){
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast({
                            type: "user-moved",
                            payload:{
                                userId: this.userId,
                                coords: {
                                    x: this.x,
                                    y: this.y
                                }
                            }
                        }, this, this.spaceId!)
                   }
                    
                    this.send({
                        type: "movement-rejected",
                        payload: {
                            coords: {
                                x: this.x,
                                y: this.y
                            }
                        }
                    })
                    
                    break;
            }     
        });
    }

    destroy(){
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        },this,this.spaceId!);
        RoomManager.getInstance().removeUser(this.spaceId!,this);
    }

    send(payload: OutgoingMessage){
        this.ws.send(JSON.stringify(payload));
    }

}