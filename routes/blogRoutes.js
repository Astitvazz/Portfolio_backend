import express from "express";
import Blog from "../models/Blog.js";
import { upload, cloudinary } from "../config/cloudinary.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * CREATE BLOG (with image upload)
 */
router.post("/",adminAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Parse the body data
    const blogData = {
      ...req.body,
      image: {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
      },
    };

    const blog = await Blog.create(blogData);
    res.status(201).json(blog);
  } catch (error) {
    // If blog creation fails, delete the uploaded image from Cloudinary
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET ALL BLOGS
 */
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET BLOG BY SLUG
 */
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * UPDATE BLOG (with optional image update)
 */
router.put("/:slug",adminAuth, upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const updateData = { ...req.body };

    // If new image is uploaded, update image and delete old one
    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(blog.image.publicId);
      
      // Add new image data
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedBlog);
  } catch (error) {
    // If update fails and new image was uploaded, delete it
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE BLOG (also deletes image from Cloudinary)
 */
router.delete("/:slug",adminAuth, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(blog.image.publicId);

    // Delete blog from database
    await Blog.findOneAndDelete({ slug: req.params.slug });

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
