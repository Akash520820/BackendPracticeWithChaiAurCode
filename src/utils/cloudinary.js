const { v2: cloudinary } = require("cloudinary");
const fs = require("fs"); // built-in Node.js module for interacting with the file system

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // automatically detect image/video/etc.
    });
    // file uploaded successfully, remove the local temp copy
    console.log("File uploaded on Cloudinary, now removing it from local server", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

module.exports = { uploadOnCloudinary };