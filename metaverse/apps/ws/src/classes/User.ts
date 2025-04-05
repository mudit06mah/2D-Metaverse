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
    public avatar?: {avatarIdle: string, avatarRun: string}
    private space?: {spaceId: string,height:number,width:number};
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
        this.ws.addEventListener("message",async(event)=>{
            const data = event.data;
            const parseData = JSON.parse(data.toString());
            if(parseData.class !== "game")  return;
            switch (parseData.type){

                case "join":
                    try {
                        const token = parseData.payload.token;
                        const spaceId = parseData.payload.spaceId;
                        //verify token:
                        const userId = (jwt.verify(token,JWT_PASSWORD) as JwtPayload).userId;
                        if(!userId){
                            this.ws.close();
                            throw new Error("invalid jwt token");
                        }
                        this.userId = userId;

                        //get username and avatarImg from database:
                        const user = await client.user.findUnique({
                            where:{
                                id: userId
                            }
                        })

                        this.username = user?.username;

                        const avatar = await client.avatars.findUnique({
                            where:{
                                id: user?.avatarId ?? ""
                            }
                        })
                        if(!avatar) throw new Error("avatar not found!");
                        this.avatar = {
                            avatarIdle: avatar.avatarIdle,
                            avatarRun: avatar.avatarRun
                        }

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
                            throw new Error("Space not found");
                        }
                        
                        this.space = {
                            spaceId: spaceId,
                            height: space.height,
                            width: space.width
                        }

                        //check if user has already joined this space:
                        RoomManager.getInstance().rooms.get(spaceId)?.forEach(u => {
                            if(u.userId === this.userId){
                                console.log("Same User found",u.username);
                                throw new Error("user has already joined this space");
                            }
                        });


                        //set spawn coords:
                        RoomManager.getInstance().addUser(spaceId,this);
                        this.x = Math.floor(Math.random()*space.height);
                        this.y = Math.floor(Math.random()*space.width);

                        //sendspace joined message to user:
                        this.send({
                            class: "game",
                            type: "space-joined",
                            payload: {
                                userId: this.userId,
                                spawn:{
                                    x: this.x,
                                    y: this.y
                                },
                                username: this.username,
                                avatar: this.avatar,
                                users: RoomManager.getInstance().rooms.get(spaceId)?.filter((x)=>(x.id!==this.id)),
                                space: space
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
                                },
                                username: this.username,
                                avatar: this.avatar,
                            }
                        }, this ,this.space!.spaceId)
                    } catch (error) {
                        console.log(error);
                    }

                    break;
                
                case "move":
                    const moveX = parseInt(parseData.payload.coords.x);
                    const moveY = parseInt(parseData.payload.coords.y);
                    const direction = parseData.payload.direction;
                    
                    const xDisplacement = Math.abs(this.x-moveX);
                    const yDisplacement = Math.abs(this.y-moveY);
                    
                    const outOfBounds= moveX < 0 || moveY < 0 || moveX>this.space!.width || moveY>this.space!.height;
                    const validMove = (xDisplacement <= 1 && yDisplacement == 0) || (xDisplacement == 0 && yDisplacement <= 1);
                    
                    //check if user moved two blocks at once:
                    if(validMove && !outOfBounds){
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast({
                            class: "game",
                            type: "user-moved",
                            payload:{
                                userId: this.userId,
                                coords: {
                                    x: this.x,
                                    y: this.y
                                },
                                direction: direction
                            }
                        }, this, this.space!.spaceId);

                        break;
                    }

                    console.log(parseData.payload);
                    this.send({
                        class: "game",
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
        },this,this.space!.spaceId);
        RoomManager.getInstance().removeUser(this.space!.spaceId,this);
    }

    send(payload: OutgoingMessage){
        this.ws.send(JSON.stringify(payload));
    }

}