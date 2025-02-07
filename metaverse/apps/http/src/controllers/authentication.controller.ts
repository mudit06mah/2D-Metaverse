import { Request,Response } from "express";
import bcrypt from "bcrypt";
import {
    SignupSchema,
    SigninSchema
} from "../types";
import client from "@repo/db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { reqHandler } from "../utils/asyncHandler";

const signupUser = reqHandler(
    async(req: Request,res: Response) => {
        const {username,password,type} = req.body;
    
        //check request
        const parseData = SignupSchema.safeParse(req.body);
        if(!parseData.success){
            return res.status(400).json({
                message: "Bad Request"
            });
        }
    
        //check if username exists:
        const user = await client.user.findUnique({
            where:{
                username
            }
        });
    
        if(user){
            return res
            .status(400)
            .json({
                message: "Username is taken!"
            });
        }
    
        //encrypt password;
        const hashedPassword = await bcrypt.hash(password,10);
    
        //create user
        try {
            const user = await client.user.create({
                data:{
                    username,
                    password: hashedPassword,
                    role: type === "admin" ? "ADMIN" : "USER",
                }
            });
    
            return res
            .status(200)
            .json({
                message: "User was created succesfully",
                userId: user.id
            });
    
        } catch (error) {
            return res
            .status(400)
            .json({
                message: "User Could not be created"
            });
        }
    
    }
);

const signinUser = reqHandler(
    async(req: Request,res: Response) => {
        const {username,password} = req.body;
    
        //checking request
        const parseData = SigninSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Bad Request"
            });
        }
    
        try {
            const user = await client.user.findUnique({
                where: {
                    username
                }
            });
    
            if(!user){
                return res
                .status(400)
                .json({
                    message: "User Does not exist"
                });
            }
    
            const isValid = await bcrypt.compare(password,user.password)
            if(!isValid){
                return res
                .status(400)
                .json({
                    message: "Invalid Password"
                });
            }
    
            const token = jwt.sign({
                userId: user.id,
                role: user.role
            },JWT_PASSWORD);
            
    
            return res
            .status(200)
            .json({
                token,
                message: "Login was succesful!"
            });
    
        } catch (error) {
            return res
            .status(400)
            .json({
                message: "Login was insuccessful"
            });
        }
    
    }
);


export {
    signupUser,
    signinUser
};