import { Router } from "express";
import {
    addElementInSpace,
    createSpace,
    deleteElementInSpace,
    deleteSpace,
    getExistingSpaces,
    getSpaceInfo
} from "../controllers/space.controller";
import { userMiddleWare } from "../middlewares/user";

export const spaceRouter = Router();

//Create a Space:
spaceRouter.post("/",userMiddleWare,createSpace);

//Delete a Space:
spaceRouter.delete("/:spaceId",userMiddleWare,deleteSpace);

//Get existing Space:
spaceRouter.get("/all",userMiddleWare,getExistingSpaces);

//Get a Space:
spaceRouter.get("/:spaceId",userMiddleWare,getSpaceInfo);

//Add an Element:
spaceRouter.post("/elements",userMiddleWare,addElementInSpace);

//Delete an Element:
spaceRouter.post("/elements/delete",userMiddleWare,deleteElementInSpace);

