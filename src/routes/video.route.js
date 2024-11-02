import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { VerifyTrainer } from "../middlewares/auth.middleware.js";
import {publishAVideo } from "../controllers/video.controller.js";



const router = Router()

router.use(VerifyTrainer); // Apply verifyJWT middleware to all routes in this file


router.route("/upload-video").post( upload.fields([
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo)


export default router