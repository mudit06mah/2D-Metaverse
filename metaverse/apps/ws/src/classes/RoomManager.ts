import { OutgoingMessage } from "../types";
import { User } from "./User";


export class RoomManager{
    public rooms:Map<string,User[]> = new Map();
    static instance: RoomManager;

    private constructor(){
        this.rooms = new Map();
    }
    
    static getInstance(){
        if(!this.instance){
            this.instance = new RoomManager();
        }
        return this.instance;
    }
    
    public addUser(spaceId: string,user: User){
        if(!this.rooms.has(spaceId)){
            this.rooms.set(spaceId,[user]);
        }
        else{
            this.rooms.set(spaceId,[...(this.rooms.get(spaceId) ?? []),user]);
        }
    }

    public removeUser(spaceId: string,user: User){
        if(!this.rooms.has(spaceId)){
            return;
        }
        this.rooms.set(spaceId,(this.rooms.get(spaceId)?.filter((u)=>u.id!==user.id)) ?? []);
    }

    public broadcast(message: OutgoingMessage,user: User,roomId: string){
        if(!this.rooms.has(roomId)){
            return;
        }
        
        this.rooms.get(roomId)?.forEach((u)=>{
            if(u.userId !== user.userId){
                u.send(message);
            }
        });
        
    }
}