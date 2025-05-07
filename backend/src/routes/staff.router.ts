import express, {Router} from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import bcrypt from "bcrypt";

const app = express();
const staffRouter = Router();
const client = new PrismaClient();
const JWT_SECRET = JWT_KEY || "default-key";


app.use(express.json());

staffRouter.post("/createPassword", async(req,res) => {
    try{
        const {username, email, newPassword, passwordKey} = req.body;
        const findUser = await client.staff.findUnique({where: {username, email, passwordKey}});
        if(!findUser){
            res.status(403).json({message:"invalid details"});
            return
        }
        const hashPassword = await bcrypt.hash(newPassword, 5);
        await client.staff.update({where: {id: findUser.id}, data: {password: hashPassword}});
        res.status(201).json({message:"Password created successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crashed in createPassword Staff endpoint"})
    }
})

staffRouter.post("/forgotUsername", async(req,res) => {
    try{
        const {password, email} = req.body;
        const findUser = await client.staff.findUnique({where: {email}});
        if(!findUser){
            res.status(403).json({message:"invalid email or password"});
            return
        }
        const verifyPassword = await bcrypt.compare(password, findUser.password);
        if(!verifyPassword){
            res.status(403).json({message:"invalid email or password"})
            return
        }
        res.json({username: findUser.username});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crash in staff forgotUsername endpoint"})
    }
})


staffRouter.post("/signin", async(req,res) => {
    try{
        const {username, email, password} = req.body;
        const 
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server crashed in staff signin endpoint"})
    }
})