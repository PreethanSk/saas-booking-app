import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import bcrypt from "bcrypt";
import {
  adminForgotUsernameSchema,
  adminSigninSchema,
  createPasswordSchema,
  franchiseManagerUpdateSchema,
} from "../utils/zod";
import { franchiseManagerMiddleware } from "../middlewares/middleware";

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

    const token = jwt.sign({ id: findUser.id, role: "admin" }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "signin successful" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Server crash at manager signin endpoint" });
  }
});

franchiseManagerRouter.put( "/updateUser",  franchiseManagerMiddleware, async (req, res) => {
  try {
    const userId = (req as any).id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    const { username, email, name, phoneNumber, picture } = req.body;
    const zodParse = franchiseManagerUpdateSchema.safeParse(req.body);
    if(!zodParse.success){
      res.status(403).json({message:"zod error", errors: zodParse.error.errors})
      return
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


export default franchiseManagerRouter;
