import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudnary, uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;

  if (
    [title, description].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  const localVideoPath = req.files?.video[0].path;
  const localThumbnailPath = req.files?.thumbnail[0].path;

  if (!localVideoPath && !loaclThumbnailPath) {
    throw new ApiError(403, "Video and thumbnail needed");
  }

  const video = await uploadOnCloudinary(localVideoPath);
  const thumbnail = await uploadOnCloudinary(localThumbnailPath);

  if (!video && !thumbnail) {
    throw new ApiError(500, "Internal error");
  }
  console.log(video, thumbnail);
  const videoUploaded = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video.duration,
    owner: req.user?._id,
  });

  if (!videoUploaded) {
    throw new ApiError(500, "Internal error while saving");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, videoUploaded, "Uploaded successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "title",
    sortType,
    userId,
  } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const sortOrder = sortType === "desc" ? -1 : 1;
  if (!query) {
    query = "";
  }

  const filter = query
    ? {
        title: {
          $regex: query,
          $options: "i",
        },
      }
    : {};

  const videos = await Video.find(filter)
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ [sortBy]: sortOrder })
    .exec();
  if (!videos) {
    throw new ApiError(404, "Not found");
  }
  console.log(videos);

  const totalCount = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalCount,
        totalPagse: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      "Search successful"
    )
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    throw new ApiError(404, "Video Id is must");
  }
  const videoProfile = await Video.findById(videoId);
  if (!videoProfile) {
    throw new ApiError(403, "Video Not Found");
  }
  const VideoUrl = videoProfile.videoFile;
  // const publicId = VideoUrl.split("/")[7].split(".");
  // if (!publicId) {
  //   throw new ApiError(500, "Code error line 116 video controller");
  // }
  const videoOwnerId = videoProfile.owner?.toString();
  if (videoOwnerId !== req.user._id.toString()) {
    throw new ApiError(404, "Not Authorize Line 115 Video controller");
  }
  // const publicId = VideoUrl

  await deleteOnCloudnary(VideoUrl)
    .then((response) => {
      console.log("Delete Response:", response); // Should return { result: 'ok' } if successful
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });

  return res.status(200).json(new ApiResponse(201, {}, "Video Deleted"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id needed");
  }
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  console.log(video);
  if (!video) {
    throw new ApiError(404, "Not found");
  }

  const view = video.views + 1;
  video.views = view;
  await video.save({ validateBeforeSave: false });
  const viewer = await User.findById(req.user?._id);
  if (!viewer) {
    throw new ApiError(404, "Sign up Please");
  }

  const wh = viewer.watchHistory;
  const index = wh.indexOf(video._id);
  if (index !== -1) {
    wh.splice(index, 1);
  }
  wh.unshift(video._id);
  viewer.watchHistory = wh;

  viewer.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, video, "success"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req.file?.path;

  if (!videoId) {
    throw new ApiError(405, "video id needed");
  }
  if (!title && !description && !thumbnail) {
    throw new ApiError(406, "title description needed");
  }
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video.owner) {
    throw new ApiError(403, "Video not found");
  }
  if (video?.owner.toString() === req.user._id.toString()) {
    if (title) {
      video.title = title;
    }
    if (description) {
      video.description = description;
    }
    if (thumbnail) {
      const oldThumb = video.thumbnail;
      const respone = await deleteOnCloudnary(oldThumb);
      if (respone) {
        const respone = await uploadOnCloudinary(thumbnail);
        if (respone) {
          video.thumbnail = respone?.url;
        }
      }
    }
  }

  const newVideo = await video.save({ validateBeforeSave: false });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        title: newVideo.title,
        id: video._id,
        description: video.description,
      },
      "updated"
    )
  );

  //TODO: update video details like title, description, thumbnail
});

export { uploadVideo, getAllVideos, deleteVideo, getVideoById, updateVideo };
