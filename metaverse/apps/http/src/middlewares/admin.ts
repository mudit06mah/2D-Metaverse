import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { Response,NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { authReqHandler } from "../utils/asyncHandler";

export const adminMiddleWare = authReqHandler(
    (req: AuthenticatedRequest,res: Response,next: NextFunction) => {
        const header = req.headers.authorization;
        
    
        if(!header){
            return res
            .status(401)
            .json({
                message: "Invalid Request"
            })
        }
    
        const token = header?.split(" ")[1];
        if(!token){
            return res
            .status(401)
            .json({
                message: "Unauthorized Request"
            })
        }
    
        try{
            const decodedToken = jwt.verify(token,JWT_PASSWORD) as { role: string, userId: string};
            if(decodedToken.role !== "ADMIN"){
                return res
                .status(403)
                .json({
                    message: "Forbidden Endpoint"
                })
            }
            req.userId = decodedToken.userId;
            next();
        }
        catch(error){
            return res
            .status(401)
            .json({
                message: "Incorrect Token"
            })
        }
    }
);
