import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true //By default, browsers block sending cookies or auth headers in cross‑origin requests. Setting credentials: true allows them.    Login / Cart actions in modern apps → JSON (handled by express.json()).
}));
app.use(express.json({limit: '16kb'})); //parses JSON but restricts payload size to 16kb for safety and performance.Please accept incoming request bodies that are in JSON format, parse them, and make them available as req.body”.   Signup / Contact forms in classic HTML → URL‑encoded (handled by express.urlencoded()).
app.use(express.urlencoded({extended:true, limit: '16kb'})); //parses URL-encoded data but restricts payload size to 16kb for safety and performance. Please accept incoming request bodies that are in URL‑encoded format, parse them, and make them available as req.body”.   Login / Cart actions in modern apps → JSON (handled by express.json()).
app.use(cookieParser());
app.use(express.static('public')); // Serve static files from the 'public' directory. This allows you to serve images, CSS files, and JavaScript files directly to the client without needing additional routes.   Serving images, CSS, JS in web apps → Static files (handled by express.static()).

export {app};