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
        res.status(500).json({error:error,  message:"server crashed in createPassword Staff endpoint"})
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
        res.status(500).json({error:error,message:"server crash in staff forgotUsername endpoint"})
    }
})


staffRouter.post("/signin", async(req,res) => {
    try{
        const {username, email, password} = req.body;
        if(!username && !email){
            res.status(403).json({message:"enter your email or password please"});
            return
        }
        const userCheck = await client.staff.findFirst({where: {OR: [{username}, {email}]}});
        if(!userCheck){
            res.status(403).json({message:"user does not exist"});
            return
        }

        const passwordDecrypt = await bcrypt.compare(password, userCheck.password);
        if(!passwordDecrypt){
            res.status(403).json({message:"invalid password"});
            return
        }

        const token = jwt.sign({id: userCheck.id}, JWT_SECRET);
        res.cookie("token", token, {httpOnly: true});
        res.json({message:"signed in successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({error:error,message:"Server crashed in staff signin endpoint"})
    }
})

// staffRouter.get("/profile", async(req,res) => {
//     try{
//         //@ts-ignore

//     }
//     catch(error){
//         res.status(500).json({error:error, message: "server crashed in get staff profile endpoint"})
//     }
// })