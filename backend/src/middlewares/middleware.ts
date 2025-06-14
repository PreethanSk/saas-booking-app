import express, {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { JWT_KEY } from "../utils/config";

const JWT_SECRET = JWT_KEY || "default-value";

export async function superAdminMiddleware(req: Request, res: Response, next: NextFunction){
    try{
        const token = req.cookies.token;
        if(!token){
            res.status(403).json({message:"please enter a token"});
            return
        }
        const verify = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };
        
        if(!verify){
            res.status(403).json({message:"invalid token"});
            return
        }
        
        if(verify.role !== "super-admin"){
            res.status(403).json("you dont have access to this endpoint");
            return
        }
        
        (req as any).id = verify.id;
        (req as any).role = verify.role;
        next()
        }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crashed in superAdmin middleware"})
    }
}

export async function commonMiddleware(req: Request, res: Response, next: NextFunction){
    try{
        const token = req.cookies.token;
    if(!token){
        res.status(403).json({message:"theres no token entered"});
        return
    }
    const verify = jwt.verify(token, JWT_SECRET);
    if(!verify){
        res.status(403).json({message:"invalid token"});
        return
    }
    //@ts-ignore
    req.id = verify.id;
    //@ts-ignore
    req.role = verify.role
    next()
    }
    catch(e){
        console.log(e);
        res.status(500).json({message:"Server crashed in commonMiddleware"})
    }
}

export async function franchiseManagerMiddleware(req: Request, res: Response, next: NextFunction){
    try{
        const token = req.cookies.token;
        if(!token){
            res.status(403).json({message:"please enter a token"});
            return;
        }
        const verify = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };
        
        if(!verify){
            res.status(403).json({message:"invalid token"});
            return;
        }
        
        if(verify.role !== "manager"){
            res.status(403).json({message:"you don't have access to this endpoint"});
            return;
        }
        
        (req as any).id = verify.id;
        (req as any).role = verify.role
        next();
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"server crashed in franchiseManager middleware"});
    }
}

export async function staffMiddleware(req: Request, res: Response, next: NextFunction){
    
}