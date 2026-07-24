const { asyncHandler } = require('../utils/asyncHandler.js');
const { ApiError } = require('../utils/ApiError.js');
const { ApiResponse } = require('../utils/ApiResponse.js');
const { User } = require("../models/user.model.js");
const { uploadOnCloudinary } = require('../utils/cloudinary.js');

// asyncHandler wraps this whole function so we don't need try/catch everywhere.
// If anything inside throws (like our ApiError calls below), asyncHandler
// catches it and passes it to Express's error-handling middleware via next(err).
const registerUser = asyncHandler(async (req, res) => {

    // ---- STEP 1: Get user details from the frontend ----
    // For text fields (userName, email, fullName, password), Express reads them
    // from req.body. This only works because app.js has express.json() and
    // express.urlencoded() middleware set up to parse incoming request bodies.
    // Note: avatar and coverImage are NOT here — they are files, not text,
    // so they live in req.files instead (handled by multer, see Step 4).
    const { userName, email, fullName, password } = req.body
    console.log("email:", email) // quick debug log to confirm data is arriving correctly


    // ---- STEP 2: Validation - check required fields are not empty ----
    // If any of these are missing/falsy (undefined, "", null), stop immediately
    // and throw a 400 Bad Request error with a clear message.
    // Because we're inside asyncHandler, this "throw" is safely caught and
    // forwarded to your error-handling middleware instead of crashing the server.
    if (!userName || !email || !fullName || !password) {
        throw new ApiError(400, "Please provide all required fields")
    }

    // ---- STEP 2b: Validate email format ----
    // Simple regex check: something@something.something
    // ^[^\s@]+   -> one or more chars that are NOT whitespace or @ (local part)
    // @          -> literal @ symbol
    // [^\s@]+    -> domain name (no whitespace or @)
    // \.         -> literal dot
    // [^\s@]+$   -> extension, till end of string
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Please provide a valid email address")
    }


    // ---- STEP 3: Check if user already exists (by username OR email) ----
    // $or tells MongoDB: find ONE document where userName matches
    // OR email matches. findOne() returns the first match it finds (or null).
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    // If a matching user was found, figure out EXACTLY what collided
    // so we can give a specific, helpful error message instead of a vague one.
    if (existingUser) {
        if (existingUser.userName === userName && existingUser.email === email) {
            // both fields matched the same existing user
            throw new ApiError(409, "User already exists with this username and email")
        } else if (existingUser.userName === userName) {
            // only the username matched
            throw new ApiError(409, "Username is already taken")
        } else if (existingUser.email === email) {
            // only the email matched
            throw new ApiError(409, "Email is already registered")
        }
    }
    // 409 = HTTP status code for "Conflict" (resource already exists),
    // more semantically correct here than 400.


    // ---- STEP 4: Check for images (avatar required, coverImage optional) ----
    // multer's upload.fields() middleware (in user.routes.js) runs BEFORE this
    // controller and populates req.files. Since we used .fields() with named
    // fields (avatar, coverImage), req.files looks like:
    // {
    //   avatar: [ { path: "...", originalname: "...", ... } ],
    //   coverImage: [ { path: "...", originalname: "...", ... } ]
    // }
    // Each value is an ARRAY of files, even if maxCount is 1 — that's why
    // we need [0] to grab the actual file object before reading .path.
    //
    // The ?. (optional chaining) prevents crashes: if req.files is undefined,
    // or req.files.avatar is undefined, it just returns undefined instead
    // of throwing "Cannot read property of undefined".
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // avatar is required by our User schema (required: true), so we enforce
    // that here too, with a clear error, before we waste time uploading anything.
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    // ---- STEP 5: Upload images to Cloudinary, get back the hosted URL ----
    // uploadOnCloudinary() takes the LOCAL temp file path (where multer saved
    // it, e.g. ./public/temp/xyz.jpg), uploads it to Cloudinary's servers,
    // deletes the local temp copy, and returns Cloudinary's response object
    // (which includes .url, the public link to the uploaded file).
    // If upload fails internally, uploadOnCloudinary returns null.
    const [avatar, coverImage] = await Promise.all([
    uploadOnCloudinary(avatarLocalPath),
    coverImageLocalPath ? uploadOnCloudinary(coverImageLocalPath) : Promise.resolve(null)
]);

    // If Cloudinary upload failed for the (required) avatar, stop here.
    // 500 = Internal Server Error, since this isn't the user's fault —
    // something went wrong on our end (network, Cloudinary config, etc.)
    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed, please try again")
    }


    // ---- STEP 6: Create the user object and save it to the database ----
    // User.create() builds a new document matching our Mongoose schema and
    // saves it to MongoDB in one step. Note: we do NOT hash the password
    // manually here — the schema's pre("save") hook in user.model.js
    // automatically hashes it with bcrypt right before saving.
    const user = await User.create({
        userName: userName.toLowerCase(), // normalize casing so "Akash" and "akash" aren't different users
        email,
        fullName,
        avatar: avatar.url,               // store only the Cloudinary URL, not the whole response object
        coverImage: coverImage?.url || "", // store URL if it exists, otherwise empty string
        password                          // gets hashed automatically by the pre-save hook
    })


    // ---- STEP 7: Remove password and refreshToken before sending response ----
    // We never want to send the hashed password (or refresh token) back to
    // the client, even hashed. findById() re-fetches the just-created user,
    // and .select("-password -refreshToken") EXCLUDES those two fields
    // from the result (the minus sign means "leave this field out").
    const createdUser = await User.findById(user._id).select("-password -refreshToken")


    // ---- STEP 8: Check that user creation actually succeeded ----
    // If somehow the re-fetch failed (rare, but possible — e.g. DB hiccup),
    // throw a 500 error rather than silently returning nothing.
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    // ---- STEP 9: Send the success response back to the frontend ----
    // 201 = HTTP status code for "Created" (a new resource was successfully made).
    // ApiResponse standardizes the response shape: { statusCode, data, message, success }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
});

module.exports = { registerUser };