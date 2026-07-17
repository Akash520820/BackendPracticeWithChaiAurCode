require('dotenv').config({ path: './.env' });
const connectDB = require('./db/index.js');

connectDB();