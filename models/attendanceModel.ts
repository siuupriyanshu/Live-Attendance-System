import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    status: {
        enum: ['present', 'absent'],
        type: String,
        required: true
    }
})

export const AttendanceModel = mongoose.model('Attendance', attendanceSchema);