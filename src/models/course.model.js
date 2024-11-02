import mongoose from 'mongoose';

// Define the Course schema
const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    courseVideos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    tags: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    language: {
        type: String,
        default: 'English'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    price: {
        type: Number,
        default: 0
    },
    enrolledStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    thumbnail: {
        type: String
    },
    ratings: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviews: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student'
            },
            reviewText: {
                type: String,
                trim: true
            },
            rating: {
                type: Number,
                min: 0,
                max: 5
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    prerequisites: {
        type: [String],
        default: []
    },
    duration: {
        type: String
    },
    publishedAt: {
        type: Date
    }
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
