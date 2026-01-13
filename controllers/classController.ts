import { classSchema, addStudentSchema } from "../schemas/auth";
import { User } from "../models/userModel";
import { ClassModel } from "../models/classModel";
import type { Request, Response } from "express";
import z from "zod";

export const createClass = async (req: Request, res: Response) => {
    try {
            const { className } = classSchema.parse(req.body);
            const teacherId = req.user?.userId;
            const studentIds: [] = [];
            const newClass = await ClassModel.create({ className, teacherId, studentIds });
            res.status(201).json({ success: true, data: { _id: newClass._id, className, teacherId, studentIds } });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, error: "Invalid request schema" });
            }
            return res.status(500).json({ success: false, error: "Internal server error" });
        }
}

export const addStudent = async (req: Request, res: Response) => {
    try {
                const { studentId } = addStudentSchema.parse(req.body)
                const classId = req.params.id
    
                const classDoc = await ClassModel.findById(classId)
                if (!classDoc) {
                    return res.status(404).json({ success: false, error: "Class not found" })
                }
    
                if (classDoc.teacherId.toString() !== req.user!.userId) {
                    return res.status(403).json({
                        success: false,
                        error: "Forbidden, not class teacher",
                    })
                }
    
                const student = await User.findById(studentId)
                if (!student) {
                    return res.status(404).json({ success: false, error: "Student not found" })
                }
    
                if (student.role !== "student") {
                    return res
                        .status(400)
                        .json({ success: false, error: "User is not a student" })
                }
    
                const updatedClass = await ClassModel.findByIdAndUpdate(
                    classId,
                    { $addToSet: { studentIds: studentId } },
                    { new: true }
                )
    
                if (!updatedClass) {
                    return res.status(500).json({ success: false, error: "Update failed" })
                }
    
                res.status(200).json({
                    success: true,
                    data: {
                        _id: updatedClass._id,
                        className: updatedClass.className,
                        teacherId: updatedClass.teacherId,
                        studentIds: updatedClass.studentIds,
                    },
                })
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return res.status(400).json({ success: false, error: "Invalid request schema" })
                }
                return res.status(500).json({ success: false, error: "Internal server error" })
            }
}

export const getClass = async (req: Request, res: Response) => {
    try {
        const classId = req.params.id

        const classDoc = await ClassModel.findById(classId);
if (!classDoc) {
    return res.status(404).json({ success: false, error: "Class not found" });
}

// Check access BEFORE populating
const userId = req.user!.userId;
const isTeacher = classDoc.teacherId.toString() === userId;
const isStudent = classDoc.studentIds.map(id => id.toString()).includes(userId);

if (!isTeacher && !isStudent) {
    return res.status(403).json({
        success: false,
        error: "Forbidden, not class teacher",
    });
}

// NOW populate for response
await classDoc.populate('studentIds', 'name email _id');
        res.status(200).json({
            success: true,
            data: {
                _id: classDoc._id,
                className: classDoc.className,
                teacherId: classDoc.teacherId,
                students: classDoc.studentIds,
            },
        })
    } catch {
        return res.status(500).json({ success: false, error: "Internal server error" })
    }
}

export const getStudents = async (req: Request, res: Response) => {
     try {
            const students = await User.find({ role: 'student' }, 'name email _id');
            res.status(200).json({ success: true, data: students });
        } catch {
            return res.status(500).json({ success: false, error: "Internal server error" })
        }
}