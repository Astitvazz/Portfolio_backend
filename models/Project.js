import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  }
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length > 0;
        },
        message: "At least one tag is required"
      }
    },
    liveUrl: {
      type: String,
      required: true,
      trim: true,
    },
    githubUrl: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    // Keep backward compatibility - single image for regular projects
    image: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    // New field for featured projects with multiple media
    media: {
      type: [mediaSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
      index: true, // Add index for faster queries
    },
    order: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);