import { Request,Response,NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest } from "../types";

export const reqHandler = (requestHandler: CallableFunction) => {
    return (req: Request,res: Response,next: NextFunction) => {
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((error)=>{
            next(error);
        })
        
    }
}

export const authReqHandler = (requestHandler: CallableFunction) => {
    return (req: AuthenticatedRequest,res: Response,next: NextFunction) => {
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((error)=>{
            next(error);
        })
        
    }
}