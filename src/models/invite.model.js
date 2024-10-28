import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1d' // Invite code expires after 1 day
    }
});

export const InviteCode = mongoose.model('InviteCode', InviteSchema)