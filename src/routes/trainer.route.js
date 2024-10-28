import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js" 

// import { VerifyTrainer } from "../middlewares/auth.middleware.js";

import {
    registerTrainer,
    verifyOtp
} from '../controllers/trainer.controller.js';

const router = Router();

// Register teacher
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        }
    ]),
    registerTrainer
);

//Verify register otp

router.route("/verify-otp").post(verifyOtp)


export default router