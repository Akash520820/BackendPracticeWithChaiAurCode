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
    console.log("Cloudinary upload error:", error);
    fs.unlinkSync(localFilePath);
    return null;
}
};

const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) return null;

        // Extract the public_id from the URL.
        // e.g. https://res.cloudinary.com/xyz/image/upload/v123456/abc123.jpg
        // public_id = "abc123"
        const publicId = imageUrl.split("/").pop().split(".")[0];

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.log("Error deleting old image from Cloudinary:", error);
        return null;
    }
}

module.exports = { uploadOnCloudinary,deleteFromCloudinary };