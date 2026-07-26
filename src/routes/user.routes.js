const express = require('express');
const { verifyJWT } = require('../middlewares/auth.middleware.js');
const { upload } = require('../middlewares/multer.middleware.js');
const { registerUser, loginUser, logOutUser,refreshAccessToken } = require('../controllers/user.controller.js');

const userRouter = express.Router();
userRouter.route('/register').post(
    // here i want to add one middleware for multer to handle file uploads for avatar and coverImage
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
    registerUser
);
userRouter.route('/login').post(loginUser);

// Secure route for logOut the user
userRouter.route('/logout').post(verifyJWT, logOutUser);
// Secure route for logOut the user
userRouter.route('/refresh-token').post(refreshAccessToken);


module.exports = userRouter;