import { Router } from "express"
import { changeCurrentPassword, forgotPassword, getCurrentStudent, loginStudent, logoutStudent, registerStudent, renewRefreshToken, resetPassword, updateStudentAvatar, verifyForgotPasswordOtp, verifyLoginOtp, verifyOtp } from "../controllers/student.controller.js"
import { upload } from "../middlewares/multer.middleware.js" 
import { VerifyStudent } from "../middlewares/auth.middleware.js"


const router = Router()


//Register student
router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1,
        }
    ]),
    registerStudent
)
//verify otp 
router.post('/verify-otp', verifyOtp);

//Login
router.route('/login').post(loginStudent)
router.route('/verify-login').post(verifyLoginOtp)

//Secured routes
//-------------------------------
router.route('/logout').post(VerifyStudent, logoutStudent)
router.route('/refresh-token').post( renewRefreshToken)

// Forgot Password and sends otp 
router.route('/forgot-password').post(forgotPassword)
//Verify otp for resetting otp
router.route('/verify-resetpassotp').post(verifyForgotPasswordOtp)
//reset the password
router.route('/reset-password').post(resetPassword)

//change current password
router.route('/change-pass').patch(VerifyStudent, changeCurrentPassword)

//get current student
router.route('/get-student').get(VerifyStudent, getCurrentStudent)

//Update avatar
router.route('/update-avatar').patch(VerifyStudent, updateStudentAvatar)


export default router