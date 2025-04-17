import express, { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import { PrismaClient } from "../../generated/prisma";
import { JWT_KEY } from "../utils/config";
import cookieParser from "cookie-parser";
import { CREATOR_SECRET } from "../utils/config";
import {
  superAdminSignUpSchema,
  adminSigninSchema,
  branchCreateSchema,
  forgotPasswordSchema,
  superAdminUpdateSchema,
  branchUpdateSchema,
  franchiseMangerCreateSchema,
} from "../utils/zod";
import { superAdminMiddleware } from "../middlewares/middleware";
import crypto from "crypto";


const app = express();
const adminRouter = Router();
const client = new PrismaClient();
const JWT_SECRET = JWT_KEY || "default-key";

// app.use(cookieParser());
// app.use(cors());
app.use(express.json());

adminRouter.post("/signup", async (req, res) => {
  try {
    const { username, email, password, secretKey, picture } = req.body;

    if (secretKey !== CREATOR_SECRET) {
      res.status(403).json({ message: "invalid key" });
      return;
    }

    const zodParse = superAdminSignUpSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "Validation failed", errors: zodParse.error.errors });
      return;
    }

    const userCheck = await client.superAdmin.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });
    if (userCheck) {
      res
        .status(403)
        .json({ message: "User with this username or email already exists" });
      return;
    }
    const key = crypto.randomBytes(8).toString("base64").slice(0, 10);
    const hashPassword = await bcrypt.hash(password, 5);
    await client.superAdmin.create({
      data: {
        username,
        email,
        password: hashPassword,
        picture,
        passwordKey: key,
      },
    });
    res.json({ message: "user created successfully!!", passwordKey: key });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "server crashed in superAdmin signup endpoint endpoint",
    });
  }
});

adminRouter.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const zodParse = adminSigninSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }

    const userCheck = await client.superAdmin.findUnique({
      where: { username },
    });
    if (!userCheck) {
      res.status(403).json({ message: "invalid username or password " });
      return;
    }
    const passwordDecrypt = await bcrypt.compare(password, userCheck.password);
    if (!passwordDecrypt) {
      res.status(403).json({ message: "invalid username or password" });
      return;
    }
    const token = jwt.sign(
      { id: userCheck.id, role: "super-admin" },
      JWT_SECRET
    );
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "signin successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server crash in superadmin signin" });
  }
});

adminRouter.post("/updateProfile", superAdminMiddleware, async (req, res) => {
  try {
    const { username, email, password, picture } = req.body;
    //@ts-ignore
    const userId = req.id;

    const zodParse = superAdminUpdateSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (picture) updateData.picture = picture;
    if (password) {
      updateData.password = await bcrypt.hash(password, 5);
    }
    await client.superAdmin.update({ where: { id: userId }, data: updateData });
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash updateprofile endpoint" });
  }
});

// ADD EMAIL VALIDATION LATER
adminRouter.put("/forgotPassword", async (req, res) => {
  try {
    const { username, passwordKey, newPassword } = req.body;

    const zodParse = forgotPasswordSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod invalid", errors: zodParse.error.errors });
      return;
    }

    const userCheck = await client.superAdmin.findFirst({
      where: { username: username },
    });
    if (!userCheck) {
      res.status(403).json({ message: "user not found" });
      return;
    }
    if (passwordKey === userCheck.passwordKey) {
      const passwordHash = await bcrypt.hash(newPassword, 5);
      await client.superAdmin.update({
        where: { username: username },
        data: { password: passwordHash },
      });
      res.status(201).json({ message: "password updated successfully" });
      return;
    } else {
      res.status(403).json({ message: "invalid key" });
      return;
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Server crash at superadmin forgot password" });
  }
});

adminRouter.post("/createBranch", superAdminMiddleware, async (req, res) => {
  try {
    const { name, address, pincode, city, state, country, picture } = req.body;

    const zodParse = branchCreateSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }

    const branchCheck = await client.branch.findFirst({
      where: { name: name },
    });
    if (branchCheck) {
      res.status(403).json({ message: "this branch already exists" });
      return;
    }
    await client.branch.create({
      data: { name, address, pincode, city, state, country, picture },
    });
    res.status(201).json({ message: "branch created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server crash in create branch endpoint" });
  }
});

adminRouter.post("/updateBranch", superAdminMiddleware, async (req, res) => {
  try {
    const { branchId, ...branchData } = req.body;
    if (!branchId) {
      res.status(400).json({ message: "branchId is required" });
      return;
    }
    // Validate only the provided fields
    const zodParse = branchCreateSchema.partial().safeParse(branchData);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }
    // Check if branch exists
    const branch = await client.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      res.status(404).json({ message: "Branch not found" });
      return;
    }
    // Only update provided fields
    const updateData: any = {};
    for (const key of Object.keys(zodParse.data)) {
      if (branchData[key] !== undefined) {
        updateData[key] = branchData[key];
      }
    }
    const updatedBranch = await client.branch.update({
      where: { id: branchId },
      data: updateData,
    });
    res
      .status(200)
      .json({ message: "Branch updated successfully", branch: updatedBranch });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash in updateBranch endpoint" });
  }
});

adminRouter.post("/deleteBranch", superAdminMiddleware, async (req, res) => {
  try {
    const { branchId } = req.body;
    if (!branchId) {
      res.status(400).json({ message: "branchId is required" });
      return;
    }
    const branch = await client.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      res.status(404).json({ message: "Branch not found" });
      return;
    }
    await client.branch.delete({ where: { id: branchId } });
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash in deleteBranch endpoint" });
  }
});

// for dropdown menu
adminRouter.get("/branchNames", superAdminMiddleware, async (req, res) => {
  try {
    const branches = await client.branch.findMany({
      select: { id: true, name: true },
    });
    res.status(200).json({ branches });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash in get branches endpoint" });
  }
});

// manager will later give input for password, name, ph number etc
adminRouter.post("/createManager", superAdminMiddleware, async (req, res) => {
  try {
    const { email, username, branchId } = req.body;
    const zodParse = franchiseMangerCreateSchema.safeParse(req.body);
    if (!zodParse.success) {
      res
        .status(403)
        .json({ message: "zod error", errors: zodParse.error.errors });
      return;
    }

    const userCheck = await client.franchiseManager.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });
    if (userCheck) {
      res.status(403).json({ message: "user already exists" });
      return;
    }

    const key = crypto.randomBytes(8).toString("base64").slice(0, 10);
    await client.franchiseManager.create({
      data: { email, username, passwordKey: key, password: key, branchId },
    });

    res.status(201).json({ message: "manager created!", key: key });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ messagE: "server crash in manager create endpoint" });
  }
});

//for dropdown menu
adminRouter.get("/managerNames", superAdminMiddleware, async (req, res) => {
  try {
    const managers = await client.franchiseManager.findMany({
      select: { id: true, name: true },
    });
    res.status(200).json({ managers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash in get managers endpoint" });
  }
});

adminRouter.post("/deleteManager", superAdminMiddleware, async (req, res) => {
  try {
    const { managerId } = req.body;
    if (!managerId) {
      res.status(400).json({ message: "managerId is required" });
      return;
    }
    const manager = await client.franchiseManager.findUnique({
      where: { id: managerId },
    });
    if (!manager) {
      res.status(404).json({ message: "Manager not found" });
      return;
    }
    await client.franchiseManager.delete({ where: { id: managerId } });
    res.status(200).json({ message: "Manager deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server crash in deleteManager endpoint" });
  }
});

// can search for individual names too allows half ass inputs, add button to view in detail 
adminRouter.get("/getBranchesGrid", superAdminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    const name = req.query.name as string | undefined;

    const where: any = {};
    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    const [branches, total] = await Promise.all([
      client.branch.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: "desc" },
      }),
      client.branch.count({ where }),
    ]);

    res.status(200).json({
      branches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "server crashed in get branches grid endpoint" });
  }
});

// button from grid list should redirect here
adminRouter.get("/getBranchDetail", superAdminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.query.id as string);
    if (!id) {
      res.status(403).json({ message: "please enter a branch id" });
      return;
    }
    const findBranch = await client.branch.findUnique({ where: { id: id } });
    if (!findBranch) {
      res.status(403).json({ message: "this branch does not exist" });
      return;
    }
    res.json({ branch: findBranch });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "server crashed in get branch detail endpoint" });
  }
});

// can search for individual names too allows half ass inputs, add button to view in detail 
adminRouter.get("/getManagersGrid", superAdminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    const name = req.query.name as string | undefined;

    const where: any = {};
    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    const [managers, total] = await Promise.all([
      client.franchiseManager.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { id: "desc" },
      }),
      client.franchiseManager.count({ where }),
    ]);

    res.status(200).json({
      managers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "server crashed in get managers grid endpoint" });
  }
});

// button from grid list should redirect here
adminRouter.get("/getMangerDetail", superAdminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.query.id as string);
    if (!id) {
      res.status(403).json({ message: "please enter a manager id" });
      return;
    }
    const findManager = await client.franchiseManager.findUnique({
      where: { id: id },
    });
    if (!findManager) {
      res.status(403).json({ message: "theres no manger under this id" });
      return;
    }
    res.json({ manager: findManager });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Server crashed at get manager detail endpoint" });
  }
});

export default adminRouter;
