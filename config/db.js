import mongoose from "mongoose";
import { requireEnv } from "./env.js";

const connectDB = async () => {
  try {
    const mongoUri = requireEnv("MONGO_URI");
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default connectDB;
