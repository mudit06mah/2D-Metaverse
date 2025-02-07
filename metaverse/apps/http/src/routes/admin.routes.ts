import { Router } from "express";
import {
    createElement,
    updateElement,
    createAvatar,
    updateAvatar,
    createMap
} from "../controllers/admin.controller";
import { adminMiddleWare } from "../middlewares/admin";
export const adminRouter = Router();

//Create an Element:
adminRouter.post("/element",adminMiddleWare,createElement);

//Update an Element:
adminRouter.put("/element/:elementId",adminMiddleWare,updateElement);

//Create an Avatar:
adminRouter.post("/avatar",adminMiddleWare,createAvatar);

//Update an Avatar:
adminRouter.put("/avatar/:avatarId",adminMiddleWare,updateAvatar);

//Create a Map:
adminRouter.post("/map",adminMiddleWare,createMap);
