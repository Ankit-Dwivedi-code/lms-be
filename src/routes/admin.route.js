import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js" 
import { registerAdmin, loginAdmin, generateInviteCode, logoutAdmin, renewRefreshToken, verifyOtp, verifyLoginOtp } from "../controllers/admin.controller.js"
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


//----------Secured routes------------------

//Invite code route
router.route("/generate-invite-code").get(verifyAdmin, generateInviteCode)
//logout admin route
router.route("/log-out").post(verifyAdmin, logoutAdmin)
//Renew refresh Token
router.route("/renew-refresh-token").post(verifyAdmin, renewRefreshToken)





export default router