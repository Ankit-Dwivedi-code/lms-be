import { Admin } from "../models/admin.model.js";
import { Student } from "../models/student.model.js";
import {Trainer} from "../models/trainer.model.js"
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


export const verifyAdmin = asyncHandler(async(req, _, next)=>{

    //get token
    //verify the jwt token by method : jwt.verify
    //find the user by id 
    //set req.user =  user

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (typeof token !== 'string') {
            throw new ApiError(400, "Invalid token format, Unauthorized request");
        }
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const admin = await Admin.findById(verifiedToken?._id).select("-password -refreshToken")
    
        if (!admin) {
            throw new ApiError(401, "Invalid access token")
        }
    
        req.admin = admin

        next()
    } catch (error) {
        throw new ApiError(400, error?.message  || "Invalid access token")
    }
})

export const VerifyStudent = asyncHandler(async(req, _, next)=>{


    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (typeof token !== 'string') {
            throw new ApiError(400, "Invalid token format");
        }
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const student = await Student.findById(verifiedToken?._id).select("-password -refreshToken")
    
        if (!student) {
            throw new ApiError(401, "Invalid access token")
        }
    
        req.student = student

        next()
    } catch (error) {
        throw new ApiError(400, error?.message  || "Invalid access token")
    }
})

export const VerifyTrainer = asyncHandler(async(req, _, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (typeof token !== 'string') {
            throw new ApiError(400, "Invalid token format");
        }
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const trainer = await Trainer.findById(verifiedToken?._id).select("-password -refreshToken")
    
        if (!trainer) {
            throw new ApiError(401, "Invalid access token")
        }
    
        req.trainer = trainer

        next()
    } catch (error) {
        throw new ApiError(400, error?.message  || "Invalid access token")
    }
})