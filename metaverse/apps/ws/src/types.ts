import z from "zod"

export type OutgoingMessage = any;

export type element = {
    id: string,
    name: string,
    width: string,
    height: string,
    elementImg: string,
    static: boolean,
}

export type SpaceElements = {
    id: string,
    x: number,
    y: number,
    
}

export type Space = {
    id: string,
    name: string
}