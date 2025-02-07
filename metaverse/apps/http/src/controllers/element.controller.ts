import { Request,Response } from "express";
import client from "@repo/db"
import { authReqHandler } from "../utils/asyncHandler";

const getAllElements = authReqHandler(
    async(req: Request,res: Response) => {
        try {
            const elements = await client.elements.findMany();
    
            return res
            .status(200)
            .json({
                elements,
                message: "Succesfully got all elements!"
            });
        } catch (error) {
            console.log(error);
            return res
            .status(200)
            .json({
                message: "Could not get elements!"
            });
        }
        
    }
);

export {getAllElements}