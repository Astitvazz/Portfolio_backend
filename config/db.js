import mongoose from "mongoose";
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;