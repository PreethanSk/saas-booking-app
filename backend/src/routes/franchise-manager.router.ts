import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  adminForgotUsernameSchema,
  adminSigninSchema,
  createPasswordSchema,
  createStaffSchema,
  franchiseManagerUpdateSchema,
} from "../utils/zod";
import {
  franchiseManagerMiddleware,
  superAdminMiddleware,
} from "../middlewares/middleware";

const franchiseManagerRouter = Router();
const JWT_SECRET = JWT_KEY || "default-key";
const app = express();
const client = new PrismaClient();

//Auth

franchiseManagerRouter.post("/setForgotPassword", async (req, res) => {
  try {
    const { username, newPassword, passwordKey } = req.body;
    const zodParse = createPasswordSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }
    const userCheck = await client.franchiseManager.findUnique({
      where: { username: username },
    });
    if (!userCheck) {
      res.status(403).json({ message: "invalid username or password" });
      return;
    }
    if (passwordKey !== userCheck.passwordKey) {
      res.status(403).json({ message: "invalid password key" });
      return;
    }
    const passwordEncrypt = await bcrypt.hash(newPassword, 5);
    await client.franchiseManager.update({
      where: { username: username },
      data: { password: passwordEncrypt },
    });
    res.status(201).json({ messaeg: "password updated successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Server crashed in manager set password endpoint" });
  }
});

franchiseManagerRouter.post("/forgotUsername", async (req, res) => {
  try {
    const { email, password } = req.body;
    const zodParse = adminForgotUsernameSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }
    const findUser = await client.franchiseManager.findUnique({
      where: { email: email },
    });
    if (!findUser) {
      res.status(403).json({ message: "username or password is invalid" });
      return;
    }
    const passwordDecrypt = await bcrypt.compare(password, findUser.password);
    if (!passwordDecrypt) {
      res.status(403).json({ message: "username or password is invalid" });
      return;
    }
    res.json({ username: findUser.username });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "server crashed in manager forgot username endpoint" });
  }
});

franchiseManagerRouter.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const zodParse = adminSigninSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }

    const findUser = await client.franchiseManager.findUnique({
      where: { username: username },
    });
    if (!findUser) {
      res.status(403).json({
        message: "username or password is invalid or this user does not exist",
      });
      return;
    }
    const passwordDecrypt = await bcrypt.compare(password, findUser.password);
    if (!passwordDecrypt) {
      res.status(403).json({
        message: "username or password is invalid or this user does not exist",
      });
      return;
    }

    const token = jwt.sign({ id: findUser.id, role: "manager" }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "signin successful" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Server crash at manager signin endpoint" });
  }
});

franchiseManagerRouter.put(
  "/updateUser",
  franchiseManagerMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).id;
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      const { username, email, name, phoneNumber, picture } = req.body;
      const zodParse = franchiseManagerUpdateSchema.safeParse(req.body);
      if (!zodParse.success) {
        res
          .status(403)
          .json({ message: "zod error", errors: zodParse.error.errors });
        return;
      }
      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (picture !== undefined) updateData.picture = picture;
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "No fields provided for update" });
        return;
      }
      if (username || email) {
        const existingUser = await client.franchiseManager.findFirst({
          where: {
            OR: [
              username ? { username } : undefined,
              email ? { email } : undefined,
            ].filter(Boolean) as any[],
            NOT: { id: userId },
          },
        });
        if (existingUser) {
          res.status(409).json({ message: "Username or email already taken" });
          return;
        }
      }
      const updatedUser = await client.franchiseManager.update({
        where: { id: userId },
        data: updateData,
      });
      const { password, passwordKey, ...userWithoutSensitive } = updatedUser;
      res.status(200).json({
        message: "User updated successfully",
        user: userWithoutSensitive,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "server crash in update user endpoint" });
    }
  }
);

franchiseManagerRouter.get("/profile",franchiseManagerMiddleware,async (req, res) => {
    try {
      //@ts-ignore
      const id = req.id;
      if (!id) {
        res.status(403).json({ message: "invalid authentication" });
        return;
      }
      const getUser = await client.franchiseManager.findFirst({
        where: { id: id },
      });
      if (!getUser) {
        res.status(403).json({ message: "user does not exist" });
        return;
      }
      res.json({ userData: getUser });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Server crashed in manager getProfile endpoint" });
    }
  }
);

franchiseManagerRouter.post("/createStaff",franchiseManagerMiddleware,async (req, res) => {
    try {
      //@ts-ignore
      const id = req.id;
      const { name, email, username } = req.body;
      const zodParse = createStaffSchema.safeParse(req.body);
      if (!zodParse.success) {
        res
          .status(403)
          .json({ message: "zod error", errors: zodParse.error.errors });
        return;
      }
      const userCheck = await client.staff.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });
      if (userCheck) {
        res.status(403).json({ message: "username or email already exists" });
        return;
      }
      const branchId = await client.franchiseManager.findUnique({
        where: { id: id },
        select: { branchId: true },
      });
      if (branchId?.branchId == null) {
        res.status(400).json({ message: "Branch ID is invalid" });
        return;
      }
      const branchCheck = await client.branch.findUnique({
        where: { id: branchId.branchId },
      });
      if (!branchCheck) {
        res.status(403).json({ message: "branch does not exist" });
        return;
      }
      const passwordKey = crypto.randomBytes(8).toString("base64").slice(0, 10);
      await client.staff.create({
        data: {
          username,
          name,
          password: passwordKey,
          passwordKey,
          email,
          branchId: branchId.branchId,
        },
      });
      res.json({message:"Staff created", passwordKey: passwordKey})
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Server crashed in create staff endpoint" });
    }
  }
);

franchiseManagerRouter.get( "/getStaffGrid",franchiseManagerMiddleware,async (req, res) => {
    //@ts-ignore
    const id = req.id;
    try {
      // Get manager's branchId
      const manager = await client.franchiseManager.findUnique({
        where: { id },
        select: { branchId: true },
      });
      if (!manager || manager.branchId == null) {
        res.status(400).json({ message: "Manager's branch not found" });
        return;
      }
      const branchId = manager.branchId;

      // Pagination params
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;
      const name = req.query.name as string | undefined;

      // For fuzzy search, use 'contains' for partial/typo tolerance (Prisma doesn't support true fuzzy, but 'contains' is forgiving)
      const where: any = { branchId };
      if (name) {
        where.name = { contains: name, mode: "insensitive" };
      }

      // Query staff for this branch only
      const [staff, total] = await Promise.all([
        client.staff.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: "desc" },
        }),
        client.staff.count({ where }),
      ]);

      res.status(200).json({
        staff,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Server crashed in getStaffGrid endpoint" });
    }
  }
);

franchiseManagerRouter.get("/getStaffDetail", franchiseManagerMiddleware, async(req,res) => {
  try{
    const {staffId} = req.body;
    //@ts-ignore
    const id = req.id;
    const branchId = await client.franchiseManager.findUnique({where: {id: id}, select: {branchId: true}});
    if(!branchId || !branchId.branchId){
      res.status(403).json({message:"this staff is from a different branch or does not exist"});
      return
    }
    const staffBranchId = await client.staff.findUnique({where:{id: staffId}, select: {branchId: true}});
    if(!staffBranchId){
      res.status(403).json({message:"this staff is from a different branch or does not exist"});
      return
    }
    if(branchId.branchId !== staffBranchId.branchId){
      res.status(403).json({message:"this staff is from a different branch or does not exist"});
      return
    }
    const details = await client.staff.findUnique({where: {id: staffId}});
    res.json({details: details})
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"Server crash in getStaffDetail endpoint"})
  }
})

franchiseManagerRouter.get("/staffNames", franchiseManagerMiddleware, async(req,res) => {
  try{
    //@ts-ignore
    const id = req.id;
    const branchId = await client.franchiseManager.findUnique({where: {id: id}, select: {branch: true}});
    if(!branchId || !branchId.branch){
      res.status(403).json({message:"branchid or user does not exist"});
      return
    }
    const names = await client.staff.findMany({where: {branchId: branchId.branch.id}, select: {id: true, name: true}});
    res.json({staff: names})
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"Server crashed in staff names endpoint"})
  }
})

franchiseManagerRouter.delete("/deleteStaff", franchiseManagerMiddleware, async(req,res) => {
  try{
    const {staffId} = req.body;
    //@ts-ignore
    const id = req.id;
    const branchId = await client.franchiseManager.findUnique({where:{id: id}, select: {branchId: true}});
    if(!branchId){
      res.status(403).json({message:"user or branch does not exist"});
      return
    }
    const staffBranchId = await client.staff.findUnique({where: {id: staffId}, select: {branchId: true}});
    if(!staffBranchId){
      res.status(403).json({message:"staff doesnt belong to the branch or does not exist"});
      return
    }
    if(branchId.branchId !== staffBranchId.branchId){
      res.json({message:"staff doesnt belong to the branch or does not exist"});
      return
    }
    await client.staff.delete({where: {id: staffId}});
    res.json({message:"Staff successfully deleted!"}); 
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"server crash in delete staff endpoint"})
  }
})


// product management for Manager
// booking management for manager
export default franchiseManagerRouter;
