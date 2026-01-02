import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

export const ClassModel = mongoose.model('Class', classSchema);