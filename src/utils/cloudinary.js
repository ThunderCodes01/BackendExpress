import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //console.log("Successfull upload", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    return null;
  }
};

const deleteOnCloudnary = async (VideoUrl) => {
  try {
    const publicId = VideoUrl.split("/").slice(-1)[0].split(".")[0];
    console.log(publicId);

    if (!publicId) {
      throw new ApiError(404, "Public Id Not Found");
    }

    const respone = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    return respone;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteOnCloudnary };
