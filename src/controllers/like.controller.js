import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

const toogleLikeButton = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "Video Id required");
  }
  const video = Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) {
    throw new ApiError(405, "Something went wrong on lC 15");
  }

  const isAlreadyLiked = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);
  if (isAlreadyLiked.length > 0) {
    await Like.deleteOne({ _id: isAlreadyLiked[0]._id });
    return res.status(201).json(new ApiResponse(201, {}, "Unliked"));
  }
  //console.log(video);

  const currentLike = await Like.create({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: req.user._id,
  });
  console.log(currentLike);
  return res.status(201).json(new ApiResponse(201, {}, "Liked"));
});

const toogleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Comment is needed");
  }

  const comment = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  );

  if (!comment) {
    throw new ApiError(405, "Comment not exist");
  }
  const isAlreadyLiked = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
  ]);
  console.log(isAlreadyLiked);

  if (isAlreadyLiked.length > 0) {
    await Like.deleteOne({ _id: isAlreadyLiked[0]._id });
    return res.status(201).json(new ApiResponse(201, {}, "disliked"));
  }

  const createlike = await Like.create({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: req.user._id,
  });
  console.log(createlike);

  return res.status(201).json(new ApiResponse(201, {}, "Liked"));
});

const getTotalLikeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(408, "Error bc");
  }
  const totalLike = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $count: "totalLike",
    },
  ]);

  const likeCount = totalLike.length > 0 ? totalLike[0].totalLike : 0;

  return res.status(200).json(new ApiResponse(200, likeCount, "Ok"));
});

const getTotalLikeComment = asyncHandler(async (req, res) => {});
export { toogleLikeButton, toogleCommentLike, getTotalLikeVideo };
