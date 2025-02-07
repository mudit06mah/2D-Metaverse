import { Request,Response } from "express";
import client from "@repo/db"
import { authReqHandler } from "../utils/asyncHandler";

const getAllAvatars = authReqHandler(
    async(req: Request,res: Response) => {
        try {
            const avatars = await client.avatars.findMany();
    
            return res
            .status(200)
            .json({
                avatars,
                message: "Succesfully got all avatars!"
            });
        } catch (error) {
            return res
            .status(200)
            .json({
                message: "Could not get avatars!"
            });
        }   
    }
);


export {getAllAvatars}