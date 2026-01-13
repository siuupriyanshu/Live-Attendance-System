import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getmyAttendance, startAttendance } from "../controllers/attendanceController";



const attendanceRouter = Router();

attendanceRouter.get("/class/:id/my-attendance", requireAuth, requireRole("student"), getmyAttendance)

attendanceRouter.post(
    "/attendance/start",
    requireAuth,
    requireRole("teacher"),
    startAttendance
)

export default attendanceRouter;
