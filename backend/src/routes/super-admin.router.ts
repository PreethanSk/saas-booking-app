import express, { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import cookieParser from "cookie-parser";
import { CREATOR_SECRET } from "../utils/config";
import { superAdminSignUpSchema, adminSigninSchema, branchCreateSchema, forgotPasswordSchema } from "../utils/zod";
import { superAdminMiddleware } from "../middlewares/middleware";

const app = express();
const adminRouter = Router();
const client = new PrismaClient();
const JWT_SECRET = JWT_KEY || "default-key";

app.use(cookieParser());
app.use(cors());
app.use(express.json());

adminRouter.post("/signup", async (req, res) => {
  try {
    const { username, email, password, secretKey, picture } = req.body;
    
    if(secretKey !== CREATOR_SECRET){
        res.status(403).json({message:"invalid key"});
        return
    }
    
    const zodParse = superAdminSignUpSchema.safeParse(req.body);
    if (!zodParse.success) {
      res.status(403).json({message: "Validation failed", errors: zodParse.error.errors,});
      return;
    }

    const userCheck = await client.superAdmin.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });
    if (userCheck) {
      res.status(403).json({ message: "User with this username or email already exists" });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 5);
    await client.superAdmin.create({
        data:{
            username,
            email,
            password:hashPassword,
            picture
        }
    })
    res.json({message:"user created successfully!!"})

  } catch (error) {
    console.log(error);
    res.status(403).json({
        message: "server crashed in superAdmin signup endpoint endpoint",
      });
  }
});



adminRouter.post("/signin", async(req,res) => {
    try{
        const {username, password} = req.body;
        const zodParse = adminSigninSchema.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:"zod error", errors: zodParse.error.errors});
            return
        }
        
        const userCheck = await client.superAdmin.findUnique({where: {username}});
        if(!userCheck){
            res.status(403).json({message:"invalid username or password "});
            return
        }
        const passwordDecrypt = await bcrypt.compare(password, userCheck.password);
        if(!passwordDecrypt){
            res.status(403).json({message:"invalid username or password"});
            return
        }
        const token = jwt.sign({id: userCheck.id, role: "super-admin"}, JWT_SECRET);
        res.cookie("token", token, {httpOnly: true});
        res.json({message:"signin successful"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crash in superadmin signin"})
    }
})

adminRouter.post("/updateProfile", superAdminMiddleware, async(req,res) => {
    try{
        const {username, email, password, picture} = req.body;
        //@ts-ignore
        const userId = req.id;

        const updateData: any = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (picture) updateData.picture = picture;
        if (password) {
            updateData.password = await bcrypt.hash(password, 5);
        }
        await client.superAdmin.update({where: {id: userId}, data: updateData});
        res.status(200).json({message: "Profile updated successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server crash updateprofile endpoint"})
    }
})

// ADD EMAIL VALIDATION LATER
adminRouter.put("/forgotPassword",  async(req,res) => {
    try{
        const {username, secretKey, newPassword} = req.body;

        const zodParse = forgotPasswordSchema.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:"zod invalid", errors: zodParse.error.errors});
            return
        }

        const userCheck = await client.superAdmin.findFirst({where: {username: username}});
        if(!userCheck){
            res.status(403).json({message:"user not found"});
            return
        }
        if(secretKey === CREATOR_SECRET){
            const passwordHash = await bcrypt.hash(newPassword, 5)
            await client.superAdmin.update({where: {username: username}, data: {password: passwordHash}});
            res.status(201).json({message:"password updated successfully"});
            return
        }
        else{
            res.status(403).json({message:"invalid key"});
            return
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server crash at superadmin forgot password"})
    }
})



adminRouter.post("/createBranch", superAdminMiddleware, async(req,res) => {
    try{
        const {name, address, pincode, city, state, country, picture} = req.body;
        
        const zodParse = branchCreateSchema.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:"zod error", errors: zodParse.error.errors});
            return
        }

        const branchCheck = await client.branch.findFirst({where: {name: name}});
        if(branchCheck){
            res.status(403).json({message:"this branch already exists"});
            return
        }
        await client.branch.create({data: {name, address, pincode, city, state, country, picture}});
        res.status(201).json({message:"branch created successfully"})
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crash in create branch endpoint"})
    }
} )

// adminRouter.put("/updateBranch")

export default adminRouter;
