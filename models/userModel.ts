import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        requred: true,
        unique: true, 
    }, 
    password: {
        type : String,
        required: true
    }, 
    role: {
        enum: ['student', 'teacher'],
        type: String,
        required: true
    }
})

export const User = mongoose.model("User", userSchema);