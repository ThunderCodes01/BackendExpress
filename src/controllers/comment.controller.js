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
    commentBy: req.user._id,
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

// const getCOC = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   if (!videoId) {
//     throw new ApiError(403, "VideoIdneeded");
//   }
//   const totalComment = await Comment.aggregate([
//     {
//       $match: {
//         video: new mongoose.Types.ObjectId(videoId),
//         onComment: { $exists: false },
//       },
//     },
//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "comment",
//         as: "Likes",
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "commentBy",
//         foreignField: "_id",
//         as: "users",
//       },
//     },
//     {
//       $addFields: {
//         userDetails: {
//           $arrayElemAt: ["$users", 0],
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "comments",
//         localField: "_id",
//         foreignField: "onComment",
//         as: "replies",
//         pipeline: [
//           {
//             $lookup: {
//               from: "likes",
//               localField: "_id",
//               foreignField: "comment",
//               as: "likesonReply",
//             },
//           },
//           {
//             $addFields: {
//               totalLikesonReply: { $size: { $ifNull: ["$likesonReply", []] } },
//             },
//           },
//           {
//             $lookup: {
//               from: "users",
//               localField: "commentBy",
//               foreignField: "_id",
//               as: "userOnReply",
//             },
//           },
//           {
//             $addFields: {
//               userDetailsOnreply: {
//                 $arrayElemAt: ["$userOnReply", 0],
//               },
//             },
//           },
//           {
//             $lookup: {
//               from: "comments",
//               localField: "_id",
//               foreignField: "onComment",
//               as: "nestedReplies",
//               pipeline: [
//                 {
//                   $lookup: {
//                     from: "likes",
//                     localField: "_id",
//                     foreignField: "comment",
//                     as: "likesonNestedReplies",
//                   },
//                 },
//                 {
//                   $addFields: {
//                     totallikesonNestedReplies: {
//                       $size: { $ifNull: ["$likesonNestedReplies", []] },
//                     },
//                   },
//                 },

//                 {
//                   $lookup: {
//                     from: "comments",
//                     localField: "_id",
//                     foreignField: "onComment",
//                     as: "repliesonNestedReplies",
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "users",
//                     localField: "commentBy",
//                     foreignField: "_id",
//                     as: "userOnNestedReplies",
//                   },
//                 },
//                 {
//                   $addFields: {
//                     userDetailsOnNested: {
//                       $arrayElemAt: ["$userOnNestedReplies", 0],
//                     },
//                     totalrepliesonNestedReplies: {
//                       $size: { $ifNull: ["$repliesonNestedReplies", []] },
//                     },
//                   },
//                 },

//                 {
//                   $project: {
//                     _id: 1,
//                     content: 1,
//                     commentBy: 1,
//                     "userDetailsOnNested.username": 1,
//                     "userDetailsOnNested.fullname": 1,
//                     totalrepliesonNestedReplies: 1,
//                     repliesonNestedReplies: 1,
//                     totallikesonNestedReplies: 1,
//                   },
//                 },
//               ],
//             },
//           },
//           {
//             $project: {
//               _id: 1,
//               content: 1,
//               commentBy: 1,
//               "userDetailsOnreply.username": 1,
//               "userDetailsOnreply.fullname": 1,
//               totalLikesonReply: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $addFields: {
//         totalLikes: { $size: { $ifNull: ["$Likes", []] } },
//         totalReplies: { $size: { $ifNull: ["$replies", []] } },
//       },
//     },
//     {
//       $project: {
//         _id: 1,
//         content: 1,
//         commentBy: 1,
//         totalLikes: 1,
//         totalReplies: 1,
//         "userDetails.username": 1,
//         "userDetails.fullname": 1,
//         replies: {
//           _id: 1,
//           content: 1,
//           commentBy: 1,
//           "userDetailsOnreply.username": 1,
//           "userDetailsOnreply.fullname": 1,
//           totalLikesonReply: 1,
//           nestedReplies: {
//             _id: 1,
//             content: 1,
//             commentBy: 1,
//             "userDetailsOnNested.username": 1,
//             "userDetailsOnNested.fullname": 1,
//             totalrepliesonNestedReplies: 1,
//             repliesonNestedReplies: 1,
//             totallikesonNestedReplies: 1,
//           },
//         },
//       },
//     },
//   ]);

//   console.log(totalComment.content);
//   if (!totalComment) {
//     throw new ApiError(404, "Not found");
//   }

//   return res.status(200).json(new ApiResponse(200, totalComment, "Success"));
// });

const getCOC = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id needed");
  }

  const commentWithDetails = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        onComment: { $exists: false },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "author",
      },
    },
    {
      $unwind: "$author",
    },
    {
      $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$comment", "$$commentId"] } } },
          { $count: "count" },
        ],
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: { parentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$onComment", "$$parentId"] } } },
          {
            $lookup: {
              from: "users",
              localField: "commentBy",
              foreignField: "_id",
              as: "author",
            },
          },
          {
            $unwind: "$author",
          },
          {
            $lookup: {
              from: "likes",
              let: { replyId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$comment", "$$replyId"] } } },
                { $count: "count" },
              ],
              as: "totalLikes",
            },
          },
          {
            $lookup: {
              from: "comments",
              let: { parentId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$onComment", "$$parentId"] } } },

                {
                  $lookup: {
                    from: "users",
                    localField: "commentBy",
                    foreignField: "_id",
                    as: "author",
                  },
                },
                { $unwind: "$author" },
                {
                  $lookup: {
                    from: "likes",
                    let: { nestedReplyId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$comment", "$$nestedReplyId"] },
                        },
                      },
                      { $count: "count" },
                    ],
                    as: "totalLikes",
                  },
                },
                {
                  $project: {
                    _id: 1,
                    content: 1,
                    commentBy: 1,
                    author: { username: 1, fullname: 1 },
                    totalLikes: {
                      $ifNull: [{ $arrayElemAt: ["$totalLikes.count", 0] }, 0],
                    },
                    //  totalReplies: 0,
                  },
                },
              ],
              as: "replies",
            },
          },
          {
            $project: {
              _id: 1,
              content: 1,
              commentBy: 1,
              author: {
                username: "$author.username",
                fullname: "$author.fullname",
              },
              totalLikes: {
                $ifNull: [{ $arrayElemAt: ["$totalLikes.count", 0] }, 0],
              },
              replies: 1,
            },
          },
        ],
        as: "replies",
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        commentBy: 1,
        author: { username: 1, fullname: 1 },
        totalLikes: {
          $ifNull: [{ $arrayElemAt: ["$totalLikes.count", 0] }, 0],
        },
        replies: 1,
      },
    },
  ]);

  if (!commentWithDetails.length) {
    throw new ApiResponse(200, {}, "No comments Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentWithDetails, "Fetched"));
});
export { addComment, getAllCommentWithLike, addCommentOnComment, getCOC };
