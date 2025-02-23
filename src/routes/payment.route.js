import express from "express";
import { initializePayment, verifyPayment } from "../controllers/payment.controller.js";
import { VerifyStudent } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Initialize payment (create Razorpay order)
router.route("/initialize-payment/:courseId").post(VerifyStudent, initializePayment);

// Verify payment and enroll student after successful payment
router.route("/verify-payment/:courseId").post(VerifyStudent, verifyPayment);

export default router;
