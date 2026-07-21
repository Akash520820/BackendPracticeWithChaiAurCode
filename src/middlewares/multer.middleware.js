const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // folder where files will be stored temporarily
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // keep the original file name
  }
});

const upload = multer({ storage: storage });

module.exports = { upload };