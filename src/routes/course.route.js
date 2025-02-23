import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js" 

import { VerifyTrainer, VerifyStudent } from "../middlewares/auth.middleware.js";

import {
    createCourse,
    getAllCourseVideos,
    getEnrolledStudents,
    updateCourse,
    deleteCourse,
    getCourseById,
    getAllCourses,
    addReview
} from "../controllers/course.controller.js"

const router = Router();

router.route("/publish-course").post(VerifyTrainer, createCourse)

//get all course videos
router.route("/get-all-videos").get(VerifyTrainer, getAllCourseVideos)

// Get all enrolled students in a specific course
router.route("/get-enrolled-students").get(VerifyTrainer, getEnrolledStudents)

// Edit a specific course
router.route('/edit/:courseId').put(VerifyTrainer, updateCourse)

// Delete a specific course
router.route('/delete/:courseId').delete(VerifyTrainer, deleteCourse)

// Get a specific course by ID
router.route('/get/:courseId').get(getCourseById)

// Get all courses
router.route('/all').get(VerifyTrainer, getAllCourses)

// Route for adding a review and rating to a course
router.route('/:courseId/review').post(VerifyStudent, addReview);

export default router