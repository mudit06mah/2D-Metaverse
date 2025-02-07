import React from "react";
import { useEffect, useRef, useState } from 'react'
import "./styles/Game.css"

type GameProps = {}

const Game: React.FC<GameProps> = () => {
    const wsRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [users,setUsers] = useState(new Map());
    const [currentUser,setCurrentUser] = useState({x:0,y:0,userId:""});

    //connect and configure ws:
    useEffect(()=>{  
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || '';
        const spaceId = urlParams.get('spaceId') || '';

        wsRef.current = new WebSocket('ws://localhost:3001');
        wsRef.current.onopen = ()=>{
            wsRef.current.send(JSON.stringify({
                type: "join",
                payload: {
                    token,
                    spaceId
                }
            }));
        }

        wsRef.current.onmessage = (event: any)=>{
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        }

        return () => {
            if(wsRef.current){
                wsRef.current.close();
            }
        }

    },[]);

    const handleWebSocketMessage = (message: any) => {
        switch(message.type){
            case "space-joined":
                setCurrentUser({
                    x: message.payload.spawn.x,
                    y: message.payload.spawn.y,
                    userId: message.payload.userId
                });

                const userMap = new Map();

                message.payload.users.forEach((user: any)=>{
                    userMap.set(user.userId,user);
                })

                console.log(userMap);
                setUsers(userMap);

                break;
            
            case "user-joined":
                setUsers(prev => {
                    const newUsers = new Map(prev);
                    newUsers.set(message.payload.userId,{
                        x: message.payload.coords.x,
                        y: message.payload.coords.y,
                        userId: message.payload.userId
                    });
                    console.log(message.payload);
                    console.log(newUsers);
                    return newUsers;
                })
                break;

            case "user-moved":

                setUsers(prev => {
                    const newUsers = new Map(prev);
                    const userId = newUsers.get(message.payload.userId);
                    if(userId){
                        newUsers.set(message.payload.userId,{
                            x: message.payload.coords.x,
                            y: message.payload.coords.y,
                            userId: message.payload.userId
                        });
                    }
                    return newUsers;
                })

                break;

            case "movement-rejected":
                setCurrentUser((prev) => (
                    {
                        ...prev,
                        x: message.payload.coords.x,
                        y: message.payload.coords.y
                    }
                ));

                break;
            
            case "user-left":
                setUsers(prev => {
                    const newUsers = new Map(prev);
                    newUsers.delete(message.payload.userId);
                    console.log(newUsers);
                    return newUsers;
                });

                break; 
        }
    }

    //Create Canvas:
    useEffect(()=> {
        const canvas = canvasRef.current;
        if(!canvas)
            return;

        const ctx = canvas.getContext('2d');
        if(!ctx)
            return;
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw grid:
        ctx.strokeStyle = "#000";
        for(let i=0;i<canvas.width;i+=50){
            ctx.beginPath();
            ctx.moveTo(i,0);
            ctx.lineTo(i,canvas.height);
            ctx.stroke();
        }
        for(let i=0;i<canvas.height;i+=50){
            ctx.beginPath();
            ctx.moveTo(0,i);
            ctx.lineTo(canvas.width,i);
            ctx.stroke();
        }

        //draw current user:
        if(currentUser && currentUser.x){
            ctx.beginPath();
            ctx.fillStyle = "#FF6B6B";
            ctx.arc(currentUser.x*50,currentUser.y*50,20,0,Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('You', currentUser.x * 50, currentUser.y * 50 + 40);
        }

        //draw other users:
        users.forEach(user => {
            if (!user.x) {
                return
            }
            ctx.beginPath();
            ctx.fillStyle = '#4ECDC4';
            ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`User ${user.userId}`, user.x * 50, user.y * 50 + 40);
        });
    },[currentUser,users]);

    const handleMove = (newX: number, newY: number) => {

        if(currentUser.userId === "")    return;
        setCurrentUser(prev => (
            {
                ...prev,
                x: newX,
                y: newY
            }
        ));

        wsRef.current.send(JSON.stringify({
            "type":"move",
            "payload": {
                "userId": currentUser.userId,
                "coords": {
                    x: newX,
                    y: newY
                }
            }
        }))
    }

    const handleKeyDown = (e: any) => {
        if(!currentUser) return;
        const {x,y} = currentUser;
        switch(e.key){
            case 'ArrowUp':
                e.preventDefault();
                handleMove(x,y-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                handleMove(x,y+1);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                handleMove(x-1,y);
                break;

            case 'ArrowRight':
                e.preventDefault();
                handleMove(x+1,y);
                break;
        }
    };

    return (
        <div className="game-container" onKeyDown={handleKeyDown} tabIndex={0}>
          <h1 className="game-title">Arena</h1>
          <div className="game-canvas-container">
            <canvas ref={canvasRef} width={2000} height={2000} className="game-canvas" />
          </div>
          <p className="game-instructions">Use arrow keys to move your avatar</p>
        </div>
    );

};

export default Game