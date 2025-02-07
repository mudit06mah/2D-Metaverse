import { Router } from "express";
import {
    getUserMetadata,
    updateUserMetadata
} from "../controllers/user.controller";
import { userMiddleWare } from "../middlewares/user";

export const userRouter = Router();

//Update User Metadata:
userRouter.post("/metadata",userMiddleWare,updateUserMetadata);

//Get Other Users Metadata:
userRouter.get("/metadata/bulk",userMiddleWare,getUserMetadata);