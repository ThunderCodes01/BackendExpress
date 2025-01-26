import { Route, Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  toogleLikeButton,
  toogleCommentLike,
  getTotalLikeVideo,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/like-video/:videoId").post(verifyJwt, toogleLikeButton);
router.route("/like-comment/:commentId").post(verifyJwt, toogleCommentLike);
router.route("/total/:videoId").get(verifyJwt, getTotalLikeVideo);

export default router;
