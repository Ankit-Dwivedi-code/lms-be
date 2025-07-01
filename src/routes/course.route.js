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
    addReview,
    updateThumbnail,
    getMyCourses
} from "../controllers/course.controller.js"

const router = Router();

router.route("/publish-course").post(upload.fields([
        {
            name : "thumbnail",
            maxCount:1,
        }
    ]),VerifyTrainer, createCourse)

//get all course videos
router.route("/get-all-videos/:courseId").get(VerifyTrainer, getAllCourseVideos);

// Get all enrolled students in a specific course
router.route("/get-enrolled-students/:courseId").get(VerifyTrainer, getEnrolledStudents)

// Edit a specific course
router.route('/edit/:courseId').put(VerifyTrainer, updateCourse)

// update course thumbnail
router.route('/update-thumbnail/:courseId').patch(upload.single('thumbnail'), VerifyTrainer, updateThumbnail)

// Delete a specific course
router.route('/delete/:courseId').delete(VerifyTrainer, deleteCourse)

// Get a specific course by ID
router.route('/get/:courseId').get(getCourseById)

// get my courses
router.route("/my-courses").get(VerifyTrainer, getMyCourses);


// Get all courses
router.route('/all').get(getAllCourses)

// Route for adding a review and rating to a course
router.route('/:courseId/review').post(VerifyStudent, addReview);

export default router