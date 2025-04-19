import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import bcrypt from "bcrypt";
import { adminForgotUsernameSchema, adminSigninSchema, createPasswordSchema } from "../utils/zod";

const franchiseManagerRouter = Router();
const JWT_SECRET = JWT_KEY || "default-key";
const app = express();
const client = new PrismaClient();

franchiseManagerRouter.post("/setForgotPassword", async (req, res) => {
  try {
    const {username, newPassword, passwordKey} = req.body;
    const zodParse = createPasswordSchema.safeParse(req.body);
    if(!zodParse.success){
      res.status(403).json({message:"zod error", errors: zodParse.error.errors});
      return
    }
    const userCheck = await client.franchiseManager.findUnique({where:{username: username}});
    if(!userCheck){
      res.status(403).json({message: "invalid username or password"});
      return
    }
    if(passwordKey !== userCheck.passwordKey){
      res.status(403).json({message:"invalid password key"});
      return
    }
    const passwordEncrypt = await bcrypt.hash(newPassword, 5);
    await client.franchiseManager.update({where: {username: username}, data:{password: passwordEncrypt}});
    res.status(201).json({messaeg:"password updated successfully"})
  } 
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crashed in manager set password endpoint" });
  }
});


franchiseManagerRouter.post("/forgotUsername", async(req,res) => {
  try{
    const {email, password} = req.body;
    const zodParse = adminForgotUsernameSchema.safeParse(req.body);
    if(!zodParse.success){
      res.status(403).json({message:"zod error", errors: zodParse.error.errors});
      return
    }
    const findUser = await client.franchiseManager.findUnique({where: {email: email}});
    if(!findUser){
      res.status(403).json({message:"username or password is invalid"});
      return
    }
    const passwordDecrypt = await bcrypt.compare(password, findUser.password);
    if(!passwordDecrypt){
      res.status(403).json({message:"username or password is invalid"});
      return
    }
    res.json({username: findUser.username});
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"server crashed in manager forgot username endpoint"})
  }
})

franchiseManagerRouter.post("/signin",async(req,res) => {
  try{
    const {username, password} = req.body;
    const zodParse = adminSigninSchema.safeParse(req.body);
    if(!zodParse.success){
      res.status(403).json({message:"zod error", errors: zodParse.error.errors});
      return
    }

    const findUser = await client.franchiseManager.findUnique({where: {username: username}});
    if(!findUser){
      res.status(403).json({message:"username or password is invalid or this user does not exist"});
      return
    }
    const passwordDecrypt = await bcrypt.compare(password, findUser.password);
    if(!passwordDecrypt){
      res.status(403).json({message:"username or password is invalid or this user does not exist"});
      return
    }

    const token = jwt.sign({id: findUser.id, role: "admin"}, JWT_SECRET);
    res.cookie("token", token, {httpOnly: true});
    res.json({message:"signin successful"})

  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"Server crash at manager signin endpoint"})
  }
})


export default franchiseManagerRouter;
