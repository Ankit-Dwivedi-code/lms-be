import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js" 
import { registerAdmin, loginAdmin, generateInviteCode, logoutAdmin, renewRefreshToken, verifyOtp, verifyLoginOtp, publishCourse, deleteStudent, deleteTrainer, updateAdminDetails, updateAdminAvatar, changeCurrentPassword, forgotPassword, verifyForgotPasswordOtp, resetPassword, getAdmin } from "../controllers/admin.controller.js"
import { verifyAdmin } from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1,
        }
    ]),
    registerAdmin
)
// Verify signup otp
router.route('/verify-otp').post(verifyOtp)


//login
router.route("/log-in").post(loginAdmin)
//verify login otp
router.route("/verify-login").post(verifyLoginOtp)

//forgot password
router.route("/forgot-password").post(forgotPassword)

//verify forgot password
router.route('/verify-forgot-pass').post(verifyForgotPasswordOtp)

//reset password
router.route('/reset-password').post(resetPassword)


//----------Secured routes------------------

//Invite code route
router.route("/generate-invite-code").get(verifyAdmin, generateInviteCode)
//logout admin route
router.route("/log-out").post(verifyAdmin, logoutAdmin)
//Renew refresh Token
router.route("/renew-refresh-token").post(verifyAdmin, renewRefreshToken)

//update admin details
router.route("/update-details").patch(verifyAdmin, updateAdminDetails)

//update admin avatar
router.route("update-avatar").patch(verifyAdmin,upload.single("avatar"), updateAdminAvatar)

//change current password
router.route("/change-current-password").patch(verifyAdmin, changeCurrentPassword)

//get admin
router.route("/get-admin").get(verifyAdmin, getAdmin)



//publish the course
router.route('/publish-course/:courseId').put(verifyAdmin, publishCourse)

//delete student
router.route('/student/:studentId').delete(verifyAdmin, deleteStudent)

// delete trainer
router.route('/trainer/:trainerId').delete(verifyAdmin, deleteTrainer)





export default router