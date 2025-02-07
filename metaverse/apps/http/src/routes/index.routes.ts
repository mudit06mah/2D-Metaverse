import { Router } from "express";
import { userRouter } from "./user.routes";
import { adminRouter } from "./admin.routes";
import { spaceRouter } from "./space.routes";
import { signupUser, signinUser } from "../controllers/authentication.controller";
import { getAllAvatars } from "../controllers/avatar.controller";
import { getAllElements } from "../controllers/element.controller";

export const router = Router();

//Signup:
router.post("/signup",signupUser);

//Signin:
router.post("/signin",signinUser);

//Get All Available Avatars:
router.get("/avatars",getAllAvatars);

//Get All Available Elements:
router.get("/elements",getAllElements);

//User Router:
router.use("/user",userRouter);

//Admin Router:
router.use("/admin",adminRouter);

//Space Router:
router.use("/spaces",spaceRouter);