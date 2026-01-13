import { signUpSchema, loginSchema } from "../schemas/auth";
import { User } from "../models/userModel";
import bcrypt from 'bcrypt';
import type { Request, Response } from "express";
import z from "zod";
import  jwt  from "jsonwebtoken";



const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

export const signup = async (req: Request, res: Response) => {
     try {
             const { name, email, password, role } = signUpSchema.parse(req.body);
            
             const existingUser = await User.findOne({ email});
             if (existingUser) {
                 return res.status(400).json({ success: false, error: "User already exists"})
             } 
             const hashedPassword = await bcrypt.hash(password, 10);
             const user = await User.create({ name, email, password: hashedPassword, role });
             res.status(201).json({ success: true, data: { _id: user._id, name, email, role } });
         } catch (error) {
             if (error instanceof z.ZodError) {
                 return res.status(400).json({ 
                     success: false, 
                     error: "Invalid request schema" 
                 });
             }
             return res.status(500).json({ 
                 success: false, 
                 error: "Internal server error" 
             });
         }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ success: true, data: { token: token } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid request schema" 
            });
        }
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error" 
        });
    }
}

export const me = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        res.status(200).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(400).json({ success: false, error: "Internal server error" });
        console.error("Me error:", error);
    }
}