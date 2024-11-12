import { Admin } from "../models/admin.model.js";
import { Student } from "../models/student.model.js";
import { Trainer } from "../models/trainer.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

// Generic function for verifying users
export const verifyUser = (Model, userType) => asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (typeof token !== 'string') {
            throw new ApiError(400, "Invalid token format");
        }

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await Model.findById(verifiedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, `Invalid access token for ${userType}`);
        }

        req[userType.toLowerCase()] = user;
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token");
    }
});

// Role-specific middleware exports
export const verifyAdmin = verifyUser(Admin, 'Admin');
export const VerifyStudent = verifyUser(Student, 'Student');
export const VerifyTrainer = verifyUser(Trainer, 'Trainer');
