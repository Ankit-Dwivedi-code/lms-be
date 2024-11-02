import express from 'express';
import { processPayment } from '../controllers/payment.controller.js';
import { VerifyStudent } from "../middlewares/auth.middleware.js"

const router = express.Router();

// Protected route to process payment and enroll student
router.route('/purchase-course/:courseId').post(VerifyStudent, processPayment)

export default router;
