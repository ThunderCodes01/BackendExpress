import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadVideo,
  getAllVideos,
  deleteVideo,
  updateVideo,
  getVideoById,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/upload-video").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

router.route("/watch").get(verifyJwt, getAllVideos);
router.route("/delete-video").post(verifyJwt, deleteVideo);
router.route("/get/:videoId").get(verifyJwt, getVideoById);
router
  .route("/update-video/:videoId")
  .post(verifyJwt, upload.single("thumbnail"), updateVideo);

export default router;
