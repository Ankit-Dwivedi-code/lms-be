// controllers/courseController.js
import { Course } from '../models/course.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from "mongoose";

const createCourse = asyncHandler(async (req, res) => {
    const { courseName, description, category, level, language, price, prerequisites } = req.body;

    if (!courseName || !description || !category) {
        throw new ApiError(400, "Course name, description, and category are required!");
    }

    const course = await Course.create({
        courseName,
        description,
        owner: req.trainer._id,
        category,
        level,
        language,
        price,
        prerequisites,
        isPublished: false, // Initially set to false until approved
    });

    return res
        .status(201)
        .json(new ApiResponse(201, course, "Course created successfully"));
});

// Get all videos of a specific course using aggregation
const getAllCourseVideos = asyncHandler(async (req, res) => {
    const { courseId } = req.query; // Assuming course ID is passed in the URL

    const courseVideos = await Course.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(courseId) } }, // Match the course by ID
        {
            $lookup: {
                from: 'videos', // Assuming your video collection is named "videos"
                localField: 'courseVideos',
                foreignField: '_id',
                as: 'videos',
            },
        },
        {
            $unwind: {
                path: '$videos',
                preserveNullAndEmptyArrays: true // Keep courses even if they have no videos
            }
        },
        {
            $project: {
                courseName: 1,
                videos: {
                    title: '$videos.title',
                    youtubeLink: '$videos.youtubeLink',
                    thumbnail: '$videos.thumbnail',
                    description: '$videos.description',
                    isPublished: '$videos.isPublished',
                },
            },
        },
    ]);

    if (!courseVideos.length) {
        throw new ApiError(404, "Course not found or no videos available");
    }

    return res.status(200).json(new ApiResponse(200, courseVideos, "Course videos retrieved successfully"));
});

// Get all students enrolled in a specific course using aggregation
const getEnrolledStudents = asyncHandler(async (req, res) => {
    const { courseId } = req.query;

    const enrolledStudents = await Course.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(courseId) } }, // Match the course by ID
        {
            $lookup: {
                from: 'students', // Assuming your student collection is named "students"
                localField: 'enrolledStudents',
                foreignField: '_id',
                as: 'students',
            },
        },
        {
            $unwind: {
                path: '$students',
                preserveNullAndEmptyArrays: true // Keep courses even if there are no students
            }
        },
        {
            $project: {
                courseName: 1,
                students: {
                    name: '$students.name',
                    email: '$students.email',
                },
            },
        },
    ]);

    if (!enrolledStudents.length) {
        throw new ApiError(404, "Course not found or no enrolled students");
    }

    return res.status(200).json(new ApiResponse(200, enrolledStudents, "Enrolled students retrieved successfully"));
});

// Edit course details
const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params; // Assuming course ID is passed as a route parameter
    const updatedData = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updatedData, {
        new: true, // Return the updated document
        runValidators: true, // Ensure model validation rules are applied
    });

    if (!updatedCourse) {
        throw new ApiError(404, "Course not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCourse, "Course updated successfully"));
});

// Delete a course
const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params; // Assuming course ID is passed as a route parameter

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
        throw new ApiError(404, "Course not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Course deleted successfully"));
});

// Get a specific course by ID
const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params; // Assuming course ID is passed as a route parameter

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, course, "Course retrieved successfully"));
});

// Get all courses (optional for viewing all courses)
const getAllCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find();

    if (!courses.length) {
        throw new ApiError(404, "No courses found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, courses, "Courses retrieved successfully"));
});

// Controller to add a review and rating to a course
const addReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params; // Get course ID from request parameters
    const studentId = req.student._id; // Student ID from auth middleware
    const { reviewText, rating } = req.body; // Get review text and rating from request body

    // Validate course existence
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");

    // Check if the student has already reviewed this course
    const existingReview = course.reviews.find(review => review.student.toString() === studentId.toString());
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this course");
    }

    // Add the new review
    const newReview = {
        student: studentId,
        reviewText,
        rating,
        createdAt: new Date()
    };
    course.reviews.push(newReview);

    // Recalculate the average rating
    const totalRatings = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    course.ratings = (totalRatings / course.reviews.length).toFixed(2);

    await course.save();

    return res.status(201).json(new ApiResponse(201, { course }, "Review added successfully"));
});


export {
    createCourse,
    getAllCourseVideos,
    getEnrolledStudents,
    updateCourse,
    deleteCourse,
    getCourseById,
    getAllCourses,
    addReview
};
