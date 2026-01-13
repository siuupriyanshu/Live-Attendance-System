import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { login, me, signup } from "../controllers/authController.ts";

const authRouter = Router();

authRouter.post("/signup",  signup);

authRouter.post("/login", login);

authRouter.get("/me", requireAuth, me);

export default authRouter;
