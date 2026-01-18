import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import contactRoutes from "./routes/contactRoutes.js";



dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());


connectDB();
// test route
app.get("/", (req, res) => {
  res.send("Portfolio Backend Running");
});
app.use("/api/contact", contactRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
