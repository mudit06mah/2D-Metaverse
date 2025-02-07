import { Request,Response } from "express"
import { UpdateMetadataSchema,AuthenticatedRequest } from "../types";
import client from "@repo/db"
import { authReqHandler } from "../utils/asyncHandler";

const updateUserMetadata =  authReqHandler(
    async(req: AuthenticatedRequest,res: Response) => {
        const {avatarId} = req.body;
    
        //checking request:
        const parseData = UpdateMetadataSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Bad Request"
            });
        }

        //checking avatar id:
        const avatar = await client.avatars.findUnique({
            where: {
                id: avatarId
            }
        });

        if(!avatar){
            return res
            .status(400)
            .json({
                message:"Avatar not found"
            });
        }
    
        await client.user.update({
            where:{
                id: req.userId
            },
            data: {
                avatarId: avatarId,
            }
        })
    
        res.status(200)
        .json({
            message: "Updated Succesfully"
        });
    
        return;
    }
);

const getUserMetadata = authReqHandler(
    async(req:Request,res: Response) => {
        
        const userIdString = (req.query.ids ?? "[]")as string;
        
        const userIds = (userIdString.slice(1,userIdString.length-1)).split(",");
        
        const metadata = await client.user.findMany({
            where: {
                id:{
                    in: userIds
                }
            },
            select: {
                avatar: true,
                id: true
            }
        });

        res
        .status(200)
        .json({
            avatars: metadata.map(m => ({
                userId: m.id,
                avatarUrl: m.avatar?.avatarImg
            }))
        })
        return;
    }
);

export {updateUserMetadata,getUserMetadata}