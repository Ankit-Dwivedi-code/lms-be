import { Course } from '../models/course.model.js';
import { Student } from '../models/student.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Simulate payment process and enroll student
const processPayment = asyncHandler(async (req, res) => {
    const { courseId } = req.params; // Course ID passed in the URL parameter
    const studentId = req.student._id; // Student ID from auth middleware

    // Validate course and student existence
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found");

    const student = await Student.findById(studentId).select('-password -refreshToken');
    if (!student) throw new ApiError(404, "Student not found");

    // Simulate successful payment logic
    const paymentSuccessful = true; // Replace with actual payment logic when integrated

    if (paymentSuccessful) {
        // Check if student is already enrolled
        if (course.enrolledStudents.includes(studentId)) {
            throw new ApiError(400, "Student is already enrolled in this course");
        }

        // Enroll student and add course to student's profile
        course.enrolledStudents.push(studentId);
        student.enrolledCourses.push(courseId);

        await course.save();
        await student.save();

        return res.status(200).json(new ApiResponse(200, { course, student }, "Enrollment successful after payment"));
    } else {
        throw new ApiError(400, "Payment failed");
    }
});

export { processPayment };
