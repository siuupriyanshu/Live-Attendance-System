import mongoose from "mongoose";

export const connectDB = async () => {
   try {
      const MONGO_URI = process.env.MONGO_URI;
      if (!MONGO_URI) {
         throw new Error("MONGO_URI is not defined");
      }

      await mongoose.connect(process.env.MONGO_URI!);
      console.log('Database connected successfully');
   } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);
   }
}