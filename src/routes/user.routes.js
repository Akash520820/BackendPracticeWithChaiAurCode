const express = require('express');
const { registerUser } = require('../controllers/user.controller.js');
const { upload } = require('../middlewares/multer.middleware.js');

const userRouter = express.Router();
userRouter.route('/register').post(
    // here i want to add one middleware for multer to handle file uploads for avatar and coverImage
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
    registerUser
);

module.exports = userRouter;