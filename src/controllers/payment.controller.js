// import { Course } from "../models/course.model.js";
// import { Student } from "../models/student.model.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiResponse.js";
// import Razorpay from "razorpay";
// import { ulid } from "ulid";
// // Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });

// // Simulate payment process and enroll student
// const processPayment = asyncHandler(async (req, res) => {
//   const { courseId } = req.params; // Course ID passed in the URL parameter
//   const studentId = req.student._id; // Student ID from auth middleware

//   // Validate course and student existence
//   const course = await Course.findById(courseId);
//   if (!course) throw new ApiError(404, "Course not found");

//   const student = await Student.findById(studentId).select(
//     "-password -refreshToken"
//   );
//   if (!student) throw new ApiError(404, "Student not found");

//   // Simulate successful payment logic
//   const paymentSuccessful = true; // Replace with actual payment logic when integrated

//   if (paymentSuccessful) {
//     // Check if student is already enrolled
//     if (course.enrolledStudents.includes(studentId)) {
//       throw new ApiError(400, "Student is already enrolled in this course");
//     }

//     // Enroll student and add course to student's profile
//     course.enrolledStudents.push(studentId);
//     student.enrolledCourses.push(courseId);

//     await course.save();
//     await student.save();

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { course, student },
//           "Enrollment successful after payment"
//         )
//       );
//   } else {
//     throw new ApiError(400, "Payment failed");
//   }
// });

// const initializePayment = asyncHandler(async (req, res) => {
//   console.log("initializePayment");
//   const amount = req.body.amount; // Amount in smallest currency unit (e.g., 100 = ₹1.00)
//   const options = {
//     amount: amount,
//     currency: "INR",
//     receipt: ulid(), // Unique receipt ID
//   };

//   try {
//     const order = await razorpay.orders.create(options);
//     return res.status(200).json(order);
//   } catch (error) {
//     console.log("error", error);
//     return res.status(500).send(error);
//   }
// });

// const verifyPayment = asyncHandler(async (req, res) => {
//   console.log("verifyPayment");
//   const crypto = require("crypto");

//   const { order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   const key_secret = process.env.RAZORPAY_SECRET;

//   const hmac = crypto.createHmac("sha256", key_secret);
//   hmac.update(order_id + "|" + razorpay_payment_id);
//   const generated_signature = hmac.digest("hex");

//   if (generated_signature === razorpay_signature) {
//     return res.redirect("/success.html");
//   } else {
//     return res.redirect("/fails.html");
//   }
// });

// export { processPayment, initializePayment, verifyPayment };


import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import { Student } from "../models/student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ulid } from "ulid";

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Initialize payment
const initializePayment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.student._id;

  // Validate course existence
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const amount = course.price * 100; // Convert to paise (smallest currency unit)
  const options = {
    amount: amount,
    currency: "INR",
    receipt: studentId,
  };

  try {
    const order = await razorpay.orders.create(options);
    return res.status(200).json(new ApiResponse(200, order, "Order created successfully"));
  } catch (error) {
    throw new ApiError(500, "Error initializing payment", error);
  }
});

// Verify payment and enroll student
const verifyPayment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.student._id;
  const { order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const key_secret = process.env.RAZORPAY_SECRET;
  const hmac = crypto.createHmac("sha256", key_secret);
  hmac.update(order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");

  if (generated_signature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  // Validate course and student existence
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, "Student not found");

  // Check for duplicate enrollment (safe check using .toString())
  if (course.enrolledStudents.some(id => id.toString() === studentId.toString())) {
    throw new ApiError(400, "Student is already enrolled in this course");
  }

  // Enroll student
  course.enrolledStudents.push(studentId);
  student.enrolledCourses.push(courseId);

  await course.save();
  await student.save();

  return res.status(200).json(
    new ApiResponse(200, { course, student }, "Payment successful, student enrolled")
  );
});


export { initializePayment, verifyPayment };
