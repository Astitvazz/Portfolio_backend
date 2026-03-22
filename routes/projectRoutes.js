import express from "express";
import Project from "../models/Project.js";
import { upload, uploadMedia, cloudinary } from "../config/cloudinary.js";

import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * CREATE PROJECT (with image upload and optional media)
 * For featured projects, use upload.array('media', 10) instead
 */
router.post("/",adminAuth, upload.single("image"), async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Parse tags if they come as a string (from form-data)
    let tags = req.body.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Prepare project data
    const projectData = {
      title: req.body.title,
      description: req.body.description,
      tags: tags,
      liveUrl: req.body.liveUrl,
      githubUrl: req.body.githubUrl,
      slug: req.body.slug,
      featured: req.body.featured === 'true' || req.body.featured === true,
      order: req.body.order || 0,
      image: {
        url: req.file.path,
        publicId: req.file.filename,
      },
      media: [], // Initialize empty media array
    };

    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (error) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET ALL PROJECTS
 * Query params: ?featured=true, ?limit=6
 */
router.get("/", async (req, res) => {
  try {
    const { featured, limit } = req.query;
    
    let query = {};
    if (featured === 'true') {
      query.featured = true;
    }

    let projectsQuery = Project.find(query).sort({ order: 1, createdAt: -1 });
    
    // For non-featured queries, exclude media array to reduce payload
    if (featured !== 'true') {
      projectsQuery = projectsQuery.select('-media');
    }
    
    if (limit) {
      projectsQuery = projectsQuery.limit(parseInt(limit));
    }

    const projects = await projectsQuery;
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET FEATURED PROJECT (for landing page)
 */
router.get("/featured/project", async (req, res) => {
  try {
    const featuredProject = await Project.findOne({ featured: true })
      .sort({ order: 1, createdAt: -1 });
    
    if (!featuredProject) {
      return res.status(404).json({ message: "No featured project found" });
    }
    
    res.json(featuredProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET PROJECT BY SLUG
 */
router.get("/:slug", async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ADD MEDIA TO PROJECT (for featured projects)
 * POST /api/projects/:slug/media
 */
router.post("/:slug/media", adminAuth, uploadMedia.array("media", 10), async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      // Clean up uploaded files if project not found
      if (req.files) {
        await Promise.all(
          req.files.map(file => cloudinary.uploader.destroy(file.filename))
        );
      }
      return res.status(404).json({ message: "Project not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No media files uploaded" });
    }

    // Parse media metadata if provided
    let mediaMetadata = [];
    if (req.body.mediaData) {
      try {
        mediaMetadata = JSON.parse(req.body.mediaData);
      } catch (e) {
        // Use defaults if parsing fails
      }
    }

    // Add new media items
    const newMedia = req.files.map((file, index) => {
      const metadata = mediaMetadata[index] || {};
      return {
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: file.path,
        publicId: file.filename,
        alt: metadata.alt || '',
        order: project.media.length + index,
      };
    });

    project.media.push(...newMedia);
    await project.save();

    res.json(project);
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all(
        req.files.map(file => cloudinary.uploader.destroy(file.filename))
      );
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE MEDIA FROM PROJECT
 * DELETE /api/projects/:slug/media/:publicId
 */
router.delete("/:slug/media/:publicId",adminAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const mediaIndex = project.media.findIndex(
      m => m.publicId === req.params.publicId
    );

    if (mediaIndex === -1) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(req.params.publicId, {
      resource_type: project.media[mediaIndex].type === 'video' ? 'video' : 'image'
    });

    // Remove from database
    project.media.splice(mediaIndex, 1);
    await project.save();

    res.json({ message: "Media deleted successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * REORDER MEDIA
 * PATCH /api/projects/:slug/media/reorder
 */
router.patch("/:slug/media/reorder",adminAuth, async (req, res) => {
  try {
    const { mediaOrder } = req.body; // Array of publicIds in new order
    
    if (!Array.isArray(mediaOrder)) {
      return res.status(400).json({ message: "mediaOrder must be an array" });
    }

    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update order for each media item
    mediaOrder.forEach((publicId, index) => {
      const mediaItem = project.media.find(m => m.publicId === publicId);
      if (mediaItem) {
        mediaItem.order = index;
      }
    });

    // Sort media by order
    project.media.sort((a, b) => a.order - b.order);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * UPDATE PROJECT (with optional image update)
 */
router.put("/:slug",adminAuth, upload.single("image"), async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Parse tags if needed
    let tags = req.body.tags;
    if (tags && typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = tags.split(',').map(tag => tag.trim());
      }
    }

    const updateData = {
      ...(req.body.title && { title: req.body.title }),
      ...(req.body.description && { description: req.body.description }),
      ...(tags && { tags: tags }),
      ...(req.body.liveUrl && { liveUrl: req.body.liveUrl }),
      ...(req.body.githubUrl && { githubUrl: req.body.githubUrl }),
      ...(req.body.slug && { slug: req.body.slug }),
      ...(req.body.featured !== undefined && { 
        featured: req.body.featured === 'true' || req.body.featured === true 
      }),
      ...(req.body.order !== undefined && { order: req.body.order }),
    };

    // If new image is uploaded, update image and delete old one
    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(project.image.publicId);
      
      // Add new image data
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const updatedProject = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProject);
  } catch (error) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE PROJECT (also deletes image and all media from Cloudinary)
 */
router.delete("/:slug",adminAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete main image from Cloudinary
    await cloudinary.uploader.destroy(project.image.publicId);

    // Delete all media items from Cloudinary
    if (project.media && project.media.length > 0) {
      await Promise.all(
        project.media.map(mediaItem =>
          cloudinary.uploader.destroy(mediaItem.publicId, {
            resource_type: mediaItem.type === 'video' ? 'video' : 'image'
          })
        )
      );
    }

    // Delete project from database
    await Project.findOneAndDelete({ slug: req.params.slug });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * TOGGLE FEATURED STATUS
 */
router.patch("/:slug/featured",adminAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.featured = !project.featured;
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * UPDATE PROJECT ORDER
 */
router.patch("/:slug/order",adminAuth, async (req, res) => {
  try {
    const { order } = req.body;
    
    if (order === undefined) {
      return res.status(400).json({ message: "Order value is required" });
    }

    const project = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      { order: parseInt(order) },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;