import zod from 'zod';

export const signUpSchema = zod.object({
    name: zod.string().min(2, "Name must be at least 2 characters").max(100),
    email: zod.string().email(),
    password: zod.string().min(6, "Password must be at least 6 characters").max(100),
    role: zod.enum(['student', 'teacher'])
})

export const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod.string(),
})

export const classSchema = zod.object({
    className: zod.string().min(1, "Class name must be at least 1 character").max(100),
})

export const addStudentSchema = zod.object({
    studentId: zod.string(),
})

export const startAttendanceSchema = zod.object({
    classId: zod.string(),
})