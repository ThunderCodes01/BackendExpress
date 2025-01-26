import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addComment,
  getAllCommentWithLike,
  addCommentOnComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/add-comment/:videoId").post(verifyJwt, addComment);
router.route("/total-comment/:videoId").get(verifyJwt, getAllCommentWithLike);
router.route("/add-coc/:commentId").post(verifyJwt, addCommentOnComment);

export default router;
