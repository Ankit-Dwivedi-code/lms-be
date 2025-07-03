import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyStudent, VerifyTrainer } from "../middlewares/auth.middleware.js";
import {
  publishAVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoWithComments,
  getVideosByCourseId,
} from "../controllers/video.controller.js";

const router = Router();

// 🔐 Protect all routes for logged-in trainers
// router.use(VerifyTrainer);

// 🆕 Upload a video to a specific course
router.route("/upload/:courseId").post(
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  VerifyTrainer,
  publishAVideo
);

// 📥 Get all videos (with filters, pagination, sorting)
router.route("/").get(VerifyTrainer, getAllVideos);

// 🔎 Get video by ID
router.route("/:videoId").get(VerifyTrainer, getVideoById);

// 🧠 Get video with its comments
router.route("/:videoId/comments").get(VerifyTrainer, getVideoWithComments);

// get video by course ID
router.route("/course/:courseId").get(VerifyTrainer, getVideosByCourseId);

// 📝 Update video details (title, description, thumbnail)
router.route("/update/:videoId",).put(
    upload.single("thumbnail"),
    VerifyTrainer,
  updateVideo
);

// ❌ Delete a video and remove from Cloudinary
router.route("/delete/:videoId").delete(VerifyTrainer, deleteVideo);

// 🔄 Toggle published status
router.route("/toggle-status/:videoId").patch(VerifyTrainer, togglePublishStatus);

// get course videos by student
router.route("/course-videos/:courseId").get(VerifyStudent, getVideosByCourseId);

export default router;
