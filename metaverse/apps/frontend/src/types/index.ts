export interface Player {
    userId: string
    username: string
    avatar: Avatar
    x: number
    y: number
  }
  
  export interface GameElement {
    x: number
    y: number
    elementImg: string
    width: number
    height: number
    static: boolean
  }
  
  export interface Space {
    id: string
    width: number
    height: number
    bgImg: string
    spaceElements: GameElement[]
  }
  
  export interface WebSocketMessage {
    type: string
    payload: any
  }

  export interface Avatar{
    avatarIdle: string
    avatarRun: string
  }
  
  export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    DOWN = "down",
    UP = "up",
    NONE = "none"
  }
  