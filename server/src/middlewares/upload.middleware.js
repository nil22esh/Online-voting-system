import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "online_voting_system/candidates",
    allowed_formats: ["jpg", "jpeg", "png"],
    public_id: (req, file) => {
      // Create a unique filename on Cloudinary
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return `candidate-${uniqueSuffix}`;
    },
  },
});

// Initialize multer with Cloudinary storage
export const uploadCandidateFiles = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit per file
  },
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "party_symbol_file", maxCount: 1 },
]);
