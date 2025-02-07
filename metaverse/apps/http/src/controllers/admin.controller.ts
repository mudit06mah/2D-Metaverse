import { Response } from "express";
import {
    AuthenticatedRequest,
    CreateAvatarSchema,
    CreateElementSchema,
    CreateMapSchema,
    UpdateAvatarSchema,
    UpdateElementSchema
} from "../types";

import client from "@repo/db"
import { authReqHandler } from "../utils/asyncHandler";

const createElement = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) =>{
        //data validation:
        const parseData = CreateElementSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            });
        }
    
        const {width,height,elementImg,name} = req.body;
        
        try {
            const element = await client.elements.create({
                data: {
                    name,
                    width,
                    height,
                    elementImg,
                    static: req.body.static //static is a keyword
                }
            });

            return res
            .status(200)
            .json({
                elementId: element.id,
                message: "Element was created!"
            });
        } catch (error) {
            console.log(error);
            return res
            .status(400)
            .json({
                message: "Element could not be created!"
            });
        }
    }
);

const updateElement = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) =>{
        //data validation:
        const parseData = UpdateElementSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            });
        }
    
        const {elementImg}= req.body.elementImg
        const elementId = req.params.elementId;
        
        try {
            await client.elements.update({
                where: {
                    id: elementId
                },
                data: {
                    elementImg
                }
            });
    
            return res
            .status(200)
            .json({
                message: "Element was updated!"
            });
        } catch (error) {
            return res
            .status(400)
            .json({
                message: "Element could not be updated!"
            });
        }
    }
);

const createAvatar = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) =>{
        //data validation:
        const parseData = CreateAvatarSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            });
        }
    
        const {name,avatarImg} = req.body;
        
        try {
            const avatar = await client.avatars.create({
                data: {
                    name,
                    avatarImg
                }
            });
            
            return res
            .status(200)
            .json({
                avatarId: avatar.id,
                message: "Avatar was created!"
            });
        } catch (error) {
            return res
            .status(400)
            .json({
                message: "Avatar could not be created!"
            });
        }
    }
);

const updateAvatar = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) =>{
    //data validation:
    const parseData = UpdateAvatarSchema.safeParse(req.body);
    if(!parseData.success){
        return res
        .status(400)
        .json({
            message: "Data Validation Failed"
        });
    }

    const {avatarImg}= req.body
    const avatarId = req.params.avatarId;
    
    try {
        await client.avatars.update({
            where: {
                id: avatarId
            },
            data: {
                avatarImg
            }
        });

        return res
        .status(200)
        .json({
            message: "Avatar was updated!"
        });
    } catch (error) {
        return res
        .status(400)
        .json({
            message: "Avatar could not be updated!"
        });
    }
});

const createMap = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) =>{
        
        //data validation:
        const parseData = CreateMapSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            });
        }
    
        const {dimensions,thumbnail,name,defaultElements} = req.body;
        const width = parseInt(dimensions.split('x')[0]);
        const height = parseInt(dimensions.split('x')[1]);
        try {
            const map = await client.maps.create({
                data: {
                    name,
                    width,
                    height,
                    thumbnail,
                    mapElements: {
                        create:defaultElements.map((e:any) => ({
                            elementId: e.elementId,
                            x: e.x,
                            y: e.y
                        }))
                    }
                }
            });
    
            return res
            .status(200)
            .json({
                mapId: map.id,
                message: "Map was created!", 
            });
        } catch (error) {
            console.log(error);
            return res
            .status(400)
            .json({
                message: "Map could not be created!"
            });
        }
    }
);


export {
    createElement,
    updateElement,
    createAvatar,
    updateAvatar,
    createMap
}