import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js" 

import { VerifyTrainer } from "../middlewares/auth.middleware.js";

import {
    loginTrainer,
    registerTrainer,
    verifyOtp,
    logoutTrainer,
    renewRefreshToken,
    changeCurrentPassword,
    getCurrenttrainer,
    updatetrainerAvatar,
    updatetrainerDetails,
    resendOtp,
    verifyLoginOtp,
    forgotPassword
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

//login trainer
router.route("/login").post(loginTrainer)

//verify login otp
router.route("/verify-login").post(verifyLoginOtp)

router.route("/resend-otp").post(resendOtp)

// forgot password
router.route("/forgot-password").post(forgotPassword)

//Secured routes
//********************************************************************//
//logout trainers
router.route("/logout").post(VerifyTrainer, logoutTrainer)

//renew refresh token
router.route("/renew-refresh-token").post(VerifyTrainer, renewRefreshToken)

//change current password
router.route("/change-current-password").post(VerifyTrainer, changeCurrentPassword)

//get current trainer
router.route("/get-trainer").get(VerifyTrainer, getCurrenttrainer)

//update trainer avatar
router.route("/update-avatar").patch(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    VerifyTrainer,
    updatetrainerAvatar
);


//update trainer email username or subject name
router.route("/update-details").patch(VerifyTrainer, updatetrainerDetails)




export default router