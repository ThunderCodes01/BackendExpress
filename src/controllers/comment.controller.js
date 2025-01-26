import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(407, "content needed");
  }
  if (!videoId) {
    throw new ApiError(407, "Video Id needed");
  }

  const user = await User.findById(req?.user._id);
  if (!user) {
    throw new ApiError(404, "Please sign up");
  }

  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  const comment = await Comment.create({
    video: video._id,
    content: content,
    commentBy: user._id,
  });

  return res.status(201).json(new ApiResponse(201, comment, "commented"));
});

const addCommentOnComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId && !content) {
    throw new ApiError(404, "Comment id and content needed");
  }
  const commentFind = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  );
  if (!commentFind) {
    throw new ApiError(410, "Comment not found");
  }
  const createComment = await Comment.create({
    onComment: commentFind._id,
    content: content,
    CommenetedBy: req.user._id,
  });
  if (!createComment) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createComment, "Comment added"));
});

const getAllCommentWithLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "Video Id Required");
  }

  const totalComment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "CommenetedBy",
      },
    },
    {
      $addFields: {
        totalLikeonComment: {
          $size: "$totalLikes",
        },
      },
    },
    {
      $project: {
        content: 1,
        totalLikeonComment: 1,
        CommenetedBy: {
          username: { $arrayElemAt: ["$CommenetedBy.username", 0] }, // Extract the username
          fullname: { $arrayElemAt: ["$CommenetedBy.fullname", 0] }, // Extract the fullname
        },
      },
    },
  ]);
  //   const commentCount =
  //     totalComment.length > 0 ? totalComment[0].totalComment : 0;
  //   console.log(totalComment);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalComment,
      },
      "Fetched"
    )
  );
});

const getCOC = asyncHandler(async (req, res) => {});
export { addComment, getAllCommentWithLike, addCommentOnComment, getCOC };
