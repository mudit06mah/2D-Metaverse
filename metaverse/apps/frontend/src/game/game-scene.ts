import * as Phaser from "phaser"
import { Scene } from "phaser"
import { Player, GameElement, Space, WebSocketMessage, Direction, Avatar } from "../types/index.ts"

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
  private elements: Phaser.GameObjects.Sprite[] = [];
  private playerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private wsClient: WebSocket | null = null;
  private space?: Space;
  private moveTimer = 0;
  private readonly MOVE_DELAY = 100 // Throttle movement updates
  private readonly TILE_SIZE = 64

  constructor() {
    super({ key: "GameScene" })
  }

  init(data: { wsClient: WebSocket; token: string; spaceId: string }) {
    this.wsClient = data.wsClient
    if(!this.wsClient)  return;
    this.setupWebSocket()
    console.log("JOINING")
    // Join the space
    this.wsClient.send(
      JSON.stringify({
        type: "join",
        payload: {
          token: data.token,
          spaceId: data.spaceId,
        },
      }),
    )
  }

  private setupWebSocket() {
    if(!this.wsClient){
      return;
    }
    
    this.wsClient.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.handleWebSocketMessage(message)
    }
    
    let interval = setInterval(()=> {
      if(this.wsClient?.readyState == 1){
        clearInterval(interval);
      }
    },5000)
    console.log(this.wsClient.readyState);
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "space-joined":
        this.handleSpaceJoined(message.payload)
        break
      case "user-joined":
        this.handleUserJoined(message.payload)
        break
      case "user-moved":
        this.handleUserMoved(message.payload)
        break
      case "user-left":
        this.handleUserLeft(message.payload)
        break
      case "movement-rejected":
        this.handleMovementRejected(message.payload)
        break
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
    }

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
    })

    /* Create static elements
    this.space.spaceElements.forEach((element) => {
      this.createStaticElement(element);
    })
    */
    /*
    if(this.space?.bgImg){
      this.loadBackgroundImage();
    }
    */
   this.loadTiledMap();
  }

  private handleUserJoined(payload: Player) {
    console.log("User Joined:",payload.userId);
    if(payload.userId !== this.currentPlayerId)
      this.createPlayer(payload.userId, payload.username, payload.x, payload.y, payload.avatar)
  }

  private handleUserMoved(payload: { userId: string; coords: { x: number; y: number }; direction: string}) {
    const player = this.players.get(payload.userId)
    if (player) {
      // Store the player's last direction
      player.setData('lastDirection', payload.direction);
      
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

  private loadBackgroundImage() {
    if (!this.space?.bgImg) return

    // Load background image
    this.load.image("background", this.space.bgImg);
    
    this.load.once("complete", () => {
      // Create background image
      const worldWidth = this.space!.width * this.TILE_SIZE
      const worldHeight = this.space!.height * this.TILE_SIZE
      this.add.image(0, 0, "background")
        .setOrigin(0 , 0)
        .setDisplaySize(worldWidth,worldHeight)
        .setDepth(-1);
    });

    this.load.start()
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

  private createStaticElement(element: GameElement) {
    const sprite = this.add.sprite(element.x * this.TILE_SIZE, element.y * this.TILE_SIZE, "default-avatar")

    // Load and set the actual element image
    this.load.image(`element-${element.x}-${element.y}`, element.elementImg)
    this.load.once(`filecomplete-image-element-${element.x}-${element.y}`, () => {
      sprite.setTexture(`element-${element.x}-${element.y}`)
    })
    this.load.start()

    sprite.setDisplaySize(element.width * this.TILE_SIZE, element.height * this.TILE_SIZE)

    this.elements.push(sprite)
    return sprite
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

  /*
  private createTiledMap(mapData: any) {
    // Create a map using the Tiled JSON data
    this.map = this.make.tilemap({ 
      data: mapData,
      tileWidth: this.space?.tileSize || this.TILE_SIZE,
      tileHeight: this.space?.tileSize || this.TILE_SIZE
    });
    
    // Add the tileset to the map
    this.tileset = this.map.addTilesetImage('tiles');
    
    if (!this.tileset) {
      console.error("Failed to create tileset");
      return;
    }
    
    // Create layers with correct depths
    this.flooringLayer = this.map.createLayer('Flooring', this.tileset, 0, 0);
    if (this.flooringLayer) {
      this.flooringLayer.setDepth(0);
    }
    
    this.interiorLayer = this.map.createLayer('Interior', this.tileset, 0, 0);
    if (this.interiorLayer) {
      this.interiorLayer.setDepth(2);
      this.interiorLayer.setCollisionByProperty({ collides: true });
      this.collisionLayers.push(this.interiorLayer);
    }
    
    this.wallsLayer = this.map.createLayer('Walls', this.tileset, 0, 0);
    if (this.wallsLayer) {
      this.wallsLayer.setDepth(3);
      this.wallsLayer.setCollisionByProperty({ collides: true });
      this.collisionLayers.push(this.wallsLayer);
    }
    
    // Set player depth between flooring and interior
    if (this.currentPlayer) {
      this.currentPlayer.setDepth(1);
    }
    
    // Add physics between player and collision layers if we have a current player
    if (this.currentPlayer && this.physics.world) {
      this.collisionLayers.forEach(layer => {
        if (layer) {
          this.physics.add.collider(this.currentPlayer!, layer);
        }
      });
    }
  }*/

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

