import express from "express"; // Importing Express framework
import cors from "cors"; // Importing CORS for handling cross-origin requests
import cookieParser from "cookie-parser"; // Importing cookie-parser to handle cookies

const app = express(); // Initializing Express app

// Middleware to handle CORS (Cross-Origin Resource Sharing) with the origin specified in environment variables
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Allow only requests from this origin
    credentials: true // Enable sending of cookies in cross-origin requests
}));

// Middleware to parse incoming JSON requests with a body size limit of 16kb
app.use(express.json({ limit: "16kb" }));

// Middleware to parse URL-encoded data with extended support and body size limit of 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware to serve static files from the "public" directory
app.use(express.static("public"));

// Middleware to parse cookies from the request
app.use(cookieParser());



//routes
import studentRouter from "./routes/student.route.js";
import adminRouter from "./routes/admin.route.js"
import trainerRouter  from './routes/trainer.route.js'



//routes declaration
app.use("/api/a2/students", studentRouter)
app.use("/api/a2/admin", adminRouter)
app.use("/api/a2/trainer", trainerRouter)




export { app }; // Exporting the app instance for use in other modules
