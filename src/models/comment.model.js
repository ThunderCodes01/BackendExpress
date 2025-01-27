import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      index: true,
    },
    onComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    content: {
      type: String,
      require: true,
    },
    commentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
