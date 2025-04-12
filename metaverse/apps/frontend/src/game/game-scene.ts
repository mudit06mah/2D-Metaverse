import * as Phaser from "phaser"
import { Scene } from "phaser"
import { Player, GameElement, Space, WebSocketMessage, Direction, Avatar } from "../types/index.ts"
import { MediasoupClient } from "../mediasoup/client.ts"

export class GameScene extends Scene {
  private players: Map<string, Phaser.GameObjects.Sprite> = new Map()
  private currentPlayer?: Phaser.GameObjects.Sprite
  private currentPlayerText?: Phaser.GameObjects.Text
  private currentPlayerId?: string
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private avatar?: Avatar;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  private direction : Direction = Direction.NONE;
  //private elements: Phaser.GameObjects.Sprite[] = [];
  private playerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private wsClient: WebSocket | null = null;
  private token?: string;
  private spaceId?: string;
  private space?: Space;
  private moveTimer = 0;
  private readonly MOVE_DELAY = 100;// Throttle movement updates
  private readonly TILE_SIZE = 64;
  private coordMap: Map<string,string | null> = new Map();
  private proximityList: Set<string> = new Set();
  private mediasoupClient?: MediasoupClient

  constructor() {
    super({ key: "GameScene" })
  }

  init(data: { wsClient: WebSocket; token: string; spaceId: string }) {
    this.wsClient = data.wsClient;
    if(!this.wsClient)  return;

    this.token = data.token;
    this.spaceId= data.spaceId;
    this.setupWebSocket()
  }

  setMediasoupClient(client: MediasoupClient) {
    this.mediasoupClient = client
  }

  private setupWebSocket() {
    if(!this.wsClient){
      return;
    }
    this.wsClient.addEventListener("message",(event)=>{
      const message: WebSocketMessage = JSON.parse(event.data)
      this.handleWebSocketMessage(message)
    })
    
    let interval = setInterval(()=> {
      if(this.wsClient?.readyState == 1){
        clearInterval(interval);
      }
    },5000)
    console.log(this.wsClient.readyState);
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "workers-created":
        if(!this.wsClient)  return;
        this.wsClient.send(
          JSON.stringify({
            class: "game",
            type: "join",
            payload: {
              token: this.token,
              spaceId: this.spaceId,
            },
          }),
        );
        break;

      case "space-joined":
        this.handleSpaceJoined(message.payload);
        break;

      case "user-joined":
        this.handleUserJoined(message.payload);
        break;

      case "user-moved":
        this.handleUserMoved(message.payload);
        break;

      case "user-left":
        this.handleUserLeft(message.payload);
        break;

      case "movement-rejected":
        this.handleMovementRejected(message.payload);
        break;
    }
  }

  private handleSpaceJoined(payload: {
    userId: string
    spawn: { x: number; y: number }
    username: string
    avatar: Avatar
    users: Player[]
    space: Space
  }) {
    //initializing space:    
    this.space = {
      id: payload.space.id,
      width: payload.space.width,
      height :payload.space.height,
      bgImg: payload.space.bgImg,
      spaceElements: payload.space.spaceElements.map((e : any) =>({
        x:e.x,
        y:e.y,
        elementImg:e.element.elementImg,
        width:e.element.width,
        height:e.element.height,
        static: e.element.static
      })),
    };

    console.log("SPACE JOINED");
    if(!this.wsClient)  return;
    this.mediasoupClient = new MediasoupClient(this.wsClient,this.space.id,payload.userId);

    //initialize coord map:
    this.createCoordMap(payload.space.height,payload.space.width,payload.users);

    this.currentPlayerId = payload.userId
    console.log("users",payload.users);
    console.log(payload.userId);

    // Create current player
    this.createPlayer(payload.userId, payload.username, payload.spawn.x, payload.spawn.y, payload.avatar, true);
    this.avatar = payload.avatar;

    // Create other players
    payload.users.forEach((user) => {
      if(user.userId != payload.userId){
        this.createPlayer(user.userId, user.username, user.x, user.y, user.avatar);
      }  
    });

   this.loadTiledMap();
  }

  private createCoordMap(height:number,width:number,users: Player[]){
    for(let i=0;i<=height;i++){
      for(let j=0;j<=width;j++){
        this.coordMap.set(JSON.stringify([i,j]),null);
      }
    }

    users.forEach((user)=> this.coordMap.set(JSON.stringify([user.x,user.y]),user.userId));
  } 

  private handleUserJoined(payload: Player) {
    console.log("User Joined:",payload.userId);
    this.coordMap.set(JSON.stringify([payload.x,payload.y]),payload.userId);
    if(payload.userId !== this.currentPlayerId)
      this.createPlayer(payload.userId, payload.username, payload.x, payload.y, payload.avatar)
  }

  private handleUserMoved(payload: { userId: string; coords: { x: number; y: number }; direction: string}) {
    const player = this.players.get(payload.userId)
    if (player) {
      // Store the player's last direction
      player.setData('lastDirection', payload.direction);

      //Update position in coordinate map:
      const coords = [payload.coords.x,payload.coords.y];
      if(this.coordMap.get( JSON.stringify([coords[0]+1,coords[1]]) ) === payload.userId){
        this.coordMap.set( JSON.stringify([coords[0]+1,coords[1]] ), null);
      }

      else if(this.coordMap.get( JSON.stringify([coords[0],coords[1]+1]) ) === payload.userId){
        this.coordMap.set( JSON.stringify([coords[0],coords[1]+1]), null);
      }

      else if(this.coordMap.get( JSON.stringify([coords[0]-1,coords[1]]) ) === payload.userId){
        this.coordMap.set( JSON.stringify([coords[0]-1,coords[1]]) , null);
      }

      else if(this.coordMap.get( JSON.stringify([coords[0],coords[1]-1]) ) === payload.userId){
        this.coordMap.set( JSON.stringify([coords[0],coords[1]-1]) , null);
      }

      this.coordMap.set( JSON.stringify(coords),payload.userId);
      
      // Move the player to the new position
      player.setPosition(payload.coords.x * this.TILE_SIZE, payload.coords.y * this.TILE_SIZE);
      
      // Play run animation
      player.play(`${payload.userId}-run-${payload.direction}`);
      
      // Clear any existing animation timer
      if (player.getData('animTimer')) {
        this.time.removeEvent(player.getData('animTimer'));
      }
      
      // Set a timer to switch to idle animation after a short delay
      const timer = this.time.delayedCall(200, () => {
        const lastDirection = player.getData('lastDirection');
        player.play(`${payload.userId}-idle-${lastDirection}`);
      });
      
      // Store the timer reference so it can be cleared if needed
      player.setData('animTimer', timer);
      
      // Update player name position
      const text = this.playerTexts.get(payload.userId)
      if (text) {
        text.setPosition(payload.coords.x * this.TILE_SIZE, payload.coords.y * this.TILE_SIZE + 40)
      }
    }
  }

  private handleUserLeft(payload: { userId: string }) {
    const player = this.players.get(payload.userId)
    if (player) {
      player.destroy()
      this.players.delete(payload.userId)

      const text = this.playerTexts.get(payload.userId)
      if (text) {
        text.destroy()
        this.playerTexts.delete(payload.userId)
      }
    }
  }

  private handleMovementRejected(payload: { coords: { x: number; y: number } }) {
    if (this.currentPlayer) {
      this.currentPlayer.setPosition(payload.coords.x * this.TILE_SIZE, payload.coords.y * this.TILE_SIZE);
      this.currentPlayerText?.setPosition(payload.coords.x * this.TILE_SIZE,payload.coords.y * this.TILE_SIZE + 40);
    }
  }

  preload() {
  }

  create() {

    // Set up keyboard controls
    if(!this.input.keyboard)    return;
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard.addKey("W"),
      A: this.input.keyboard.addKey("A"),
      S: this.input.keyboard.addKey("S"),
      D: this.input.keyboard.addKey("D"),
    }

    // Set world bounds if we have space dimensions
    if (this.space) {
      this.physics.world.setBounds(0, 0, this.space.width * this.TILE_SIZE, this.space.height * this.TILE_SIZE);
    }    
  }

  private createPlayer(userId: string, username: string, x: number, y: number, avatar: Avatar, isCurrent = false) {

    // Check if animations already exist
    this.load.spritesheet(`${userId}-idle`, avatar.avatarIdle, {
            frameWidth: 16,
            frameHeight: 32
    });

    this.load.spritesheet(`${userId}-run`, avatar.avatarRun, {
            frameWidth: 16,
            frameHeight: 32
    });

    //create animation:
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            // Create animations only if they don't exist
            this.createPlayerAnimations(userId);

            // Now that animations are loaded, create the sprite
            const sprite = this.add.sprite(x * this.TILE_SIZE, y * this.TILE_SIZE, `${userId}-idle`);
            sprite.setScale(2);
            sprite.play(`${userId}-idle-down`);

            //add Text:
            const text = this.add.text(
              x*this.TILE_SIZE,
              y*this.TILE_SIZE+40,
              isCurrent? "You":username,
              {
                fontSize: isCurrent ? "22px" : "14px",
                color: isCurrent ? "#ebb00e" : "#000000",
              },
            );
            text.setOrigin(0.5);

            if(isCurrent){
              this.currentPlayer = sprite;
              this.currentPlayerText = text;
              this.cameras.main.startFollow(this.currentPlayer);
            }
            else{
              this.players.set(`${userId}`,sprite);
              this.playerTexts.set(`${userId}`,text);
            }
    });
        
    this.load.start();

  }

  // Separate method for creating animations
  private createPlayerAnimations(userId: string) {

    const animations = [
          { key: 'idle-right', start: 0, end: 5 },
          { key: 'idle-up', start: 6, end: 11 },
          { key: 'idle-left', start: 12, end: 17 },
          { key: 'idle-down', start: 18, end: 23 }
    ];
      
    const runAnimations = [
          { key: 'run-right', start: 0, end: 5 },
          { key: 'run-up', start: 6, end: 11 },
          { key: 'run-left', start: 12, end: 17 },
          { key: 'run-down', start: 18, end: 23 }
    ];

      animations.forEach(anim => {
          if (!this.anims.exists(`${userId}-${anim.key}`)) {
              this.anims.create({
                  key: `${userId}-${anim.key}`,
                  frames: this.anims.generateFrameNumbers(`${userId}-idle`, { start: anim.start, end: anim.end }),
                  frameRate: 10,
                  repeat: -1
              });
          }
      });

      runAnimations.forEach(anim => {
          if (!this.anims.exists(`${userId}-${anim.key}`)) {
              this.anims.create({
                  key: `${userId}-${anim.key}`,
                  frames: this.anims.generateFrameNumbers(`${userId}-run`, { start: anim.start, end: anim.end }),
                  frameRate: 12,
                  repeat: 1
              });
          }
      });

  }

  private loadTiledMap() {

    this.load.image("interior-tiles", "/assets/tiles/Interiors_free_16x16.png");
    this.load.image("room-tiles", "/assets/tiles/Room_Builder_free_16x16.png");
    this.load.tilemapTiledJSON("map","/assets/testMap.json");
    this.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      this.createTiledMap();
    }) 
  }

  private createTiledMap(){
    const map = this.make.tilemap({key: "map"});
    const interior_tileset = map.addTilesetImage("Interiors_free_16x16","interior-tiles");
    const floor_tileset = map.addTilesetImage("Room_Builder_free_16x16","room-tiles");
    const flooring  = map.createLayer("flooring",floor_tileset!);
    const interior = map.createLayer("Interior",interior_tileset!);
    const walls = map.createLayer("Walls", floor_tileset!);
  }

  checkPlayersInProximity(newX: number, newY:number ){
    const newProximityList: Set<any> = new Set();
    //check 6x6 area:
    for(let i=-3;i<=3;i++){
      for(let j=-3;j<=3;j++){
        if(this.coordMap.get( JSON.stringify([newX+i,newY+j]) )) {
          newProximityList.add( this.coordMap.get( JSON.stringify([newX+i,newY+j]) ) );
        }
      }
    }

    //add users in proximity:
    const addUsers: string[] = [];
    newProximityList.forEach((userId)=>{
      if(!this.proximityList.has(userId)){
        //consume new users:
        console.log("IN PROXIMITY:",userId);
        addUsers.push(userId);
      }
    })

    if(addUsers.length){
      this.wsClient?.send(
        JSON.stringify({
          class: "mediasoup",
          type:"add-producers",
          payload: {
            addUsers
          }
        })
      )
    }    

    //remove  users not in proximity:
    const removeUsers: string[] = [];
    this.proximityList.forEach((userId)=>{
      if(!newProximityList.has(userId)){
        //remove consumers:
        console.log("LEFT PROXIMITY:",userId);
        removeUsers.push(userId);
      }
    })

    if(removeUsers.length){
      this.wsClient?.send(
        JSON.stringify({
          class: "mediasoup",
          type:"remove-producers",
          payload: {
            removeUsers
          }
        })
      );
    }

    //update proximity List:
    this.proximityList = newProximityList;
    //console.log(this.proximityList);
  }


  update(time: number) {
    if (!this.currentPlayer || !this.currentPlayerId) return;
  
    // Handle movement
    if (time > this.moveTimer) {
      const currentX = Math.round(this.currentPlayer.x / this.TILE_SIZE);
      const currentY = Math.round(this.currentPlayer.y / this.TILE_SIZE);
      let newX = currentX;
      let newY = currentY;
      let moved = false;
      let previousDirection = this.direction;
  
      const sprite = this.currentPlayer;
      const userId = this.currentPlayerId;
  
      if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
        newX = currentX - 1;
        moved = true;
        this.direction = Direction.LEFT;
      } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
        newX = currentX + 1;
        moved = true;
        this.direction = Direction.RIGHT;
      } else if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
        newY = currentY - 1;
        moved = true;
        this.direction = Direction.UP;
      } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
        newY = currentY + 1;
        moved = true;
        this.direction = Direction.DOWN;
      }

      //check for players in proximity:
      this.checkPlayersInProximity(newX, newY);
  
      // Clear any existing animation timer
      if (sprite.getData('animTimer')) {
        this.time.removeEvent(sprite.getData('animTimer'));
      }
  
      if (moved) {
        // Play run animation
        sprite.play(`${userId}-run-${this.direction}`);
        
        // Send movement to server

        this.wsClient!.send(
          JSON.stringify({
            class: "game",
            type: "move",
            payload: {
              userId: this.currentPlayerId,
              coords: { x: newX, y: newY },
              direction: this.direction
            },
          }),
        );

        // Update local position
        sprite.setPosition(newX * this.TILE_SIZE, newY * this.TILE_SIZE);
        
        // Update username text position
        this.currentPlayerText?.setPosition(newX * this.TILE_SIZE, newY * this.TILE_SIZE + 40);
        
        // Store the last direction
        sprite.setData('lastDirection', this.direction);
        
        // Set a timer to switch to idle animation after movement stops
        const timer = this.time.delayedCall(200, () => {
          console.log("playing idle")
          sprite.play(`${userId}-idle-${this.direction}`);
        });
        
        // Store the timer reference
        sprite.setData('animTimer', timer);
        
        this.moveTimer = time + this.MOVE_DELAY;
      } else if (previousDirection !== Direction.NONE) {
        // If we were moving but now stopped, play idle animation
        sprite.play(`${userId}-idle-${this.direction}`);
      } else if (this.direction === Direction.NONE) {
        // Default idle animation if no direction set
        sprite.play(`${userId}-idle-down`);
      }
    }
  }
}

