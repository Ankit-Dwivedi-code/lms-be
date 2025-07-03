import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';
import { Course } from '../models/course.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import mongoose, { isValidObjectId } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Create & Upload a Video
const publishAVideo = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    if (!courseId || !title || !description) {
        throw new ApiError(400, "Course ID, title, and description are required!");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both video and thumbnail files are required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video");
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
        throw new ApiError(400, "Error uploading video or thumbnail to Cloudinary");
    }

    // ✅ Create video entry
    const newVideo = await Video.create({
        video: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title,
        description,
        owner: req.trainer._id,
        course: course._id
    });

    // ✅ Push video._id into course.courseVideos array
    course.courseVideos.push(newVideo._id);
    await course.save();

    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video published and added to course successfully")
    );
});



// Get all videos with filters, sorting, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filter = {};
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    if (userId) {
        filter.owner = userId;
    }

    const videos = await Video.aggregate([
        { $match: filter },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
    ]);

    const total = await Video.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalVideos: total,
        }
    }, "Videos fetched successfully"));
});

// Get a single video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

// Update video details (title, description, thumbnail)
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;

    if (req.file?.path) {
        const uploadedThumb = await uploadOnCloudinary(req.file.path);
        if (!uploadedThumb?.url) {
            throw new ApiError(400, "Failed to upload thumbnail");
        }
        updates.thumbnail = uploadedThumb.url;
    }

    const updated = await Video.findByIdAndUpdate(videoId, updates, { new: true });

    if (!updated) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, updated, "Video updated"));
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Extract public_id from Cloudinary URLs
    const extractPublicId = (url, resourceType = 'video') => {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1].split('.')[0]; // remove extension
        return url.includes('/upload/') ? parts.slice(-2).join('/').split('.')[0] : fileName;
    };

    const videoPublicId = extractPublicId(video.video, 'video');
    const thumbnailPublicId = extractPublicId(video.thumbnail, 'image');

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
    await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });

    // Delete from DB
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video and its media deleted successfully")
    );
});


// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated"));
});

// Get video with comments (aggregation)
const getVideoWithComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const result = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        }
    ]);

    if (!result || result.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, result[0], "Video with comments fetched"));
});

// get all videos of particular course
const getVideosByCourseId = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    const videos = await Video.find({ course: courseId }).populate('owner', 'name email');

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this course");
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideoWithComments,
    getVideosByCourseId
};
