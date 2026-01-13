import  type { Request, Response } from "express";
import { ClassModel } from "../models/classModel";
import { startAttendanceSchema } from "../schemas/auth";
import { AttendanceModel } from "../models/attendanceModel";
import z from "zod";

export let activeSession: {
    classId: string;
    startedAt: string;
    attendance: Record<string, 'present' | 'absent'>;
} | null = null;



export const getmyAttendance = async (req: Request, res: Response) => {
   try {
           const classId = req.params.id
           const studentId = req.user!.userId
   
           const classDoc = await ClassModel.findById(classId)
           if (!classDoc) {
               return res
                   .status(404)
                   .json({ success: false, error: "Class not found" })
           }
   
           const isEnrolled = classDoc.studentIds
               .map(id => id.toString())
               .includes(studentId)
   
           if (!isEnrolled) {
               return res.status(403).json({
                   success: false,
                   error: "Forbidden, not enrolled in class",
               })
           }
   
           const attendance = await AttendanceModel.findOne({
               classId: classId,
               studentId: studentId,
           })
   
           if (!attendance) {
               return res.status(200).json({
                   success: true,
                   data: {
                       classId: classId,  // Use the actual classId
                       status: null
                   }
               });
           }
   
           res.status(200).json({
               success: true,
               data: {
                   classId: attendance.classId,
                   status: attendance.status
               }
           })
       } catch {
           return res
               .status(500)
               .json({ success: false, error: "Internal server error" })
       }
}

export const startAttendance = async (req: Request, res: Response) => {
    try {
            const { classId } = startAttendanceSchema.parse(req.body)
            const teacherId = req.user!.userId

            const classDoc = await ClassModel.findById(classId)
            if (!classDoc) {
                return res
                    .status(404)
                    .json({ success: false, error: "Class not found" })
            }

            if (classDoc.teacherId.toString() !== teacherId) {
                return res.status(403).json({
                    success: false,
                    error: "Forbidden, not class teacher",
                })
            }

            activeSession = {
                classId: classId,
                startedAt: new Date().toISOString(),
                attendance: {},
            }

            res.status(200).json({
                success: true,
                data: {
                    classId: activeSession.classId,
                    startedAt: activeSession.startedAt,
                },
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ success: false, error: "Invalid request schema" })
            }
            return res
                .status(500)
                .json({ success: false, error: "Internal server error" })
        }
}