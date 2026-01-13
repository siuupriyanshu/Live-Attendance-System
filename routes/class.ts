import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { addStudent, createClass, getClass, getStudents } from "../controllers/classController";

const classRouter = Router();

classRouter.post("/create-class", requireAuth, requireRole("teacher"), createClass);

classRouter.post(
    "/class/:id/add-student",
    requireAuth,
    requireRole("teacher"),
    addStudent
)

classRouter.get("/class/:id", requireAuth, getClass)

classRouter.get(
    "/students",
    requireAuth,
    requireRole("teacher"),
    getStudents
)

export default classRouter;