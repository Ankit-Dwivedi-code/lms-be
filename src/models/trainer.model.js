import mongoose from "mongoose";
import bcrypt from "bcrypt";

const trainerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    uniqueCode: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    avatar: {
        type: String, // cloudinary URL
        required: true,
    },
    avatarPublicId: {
        type: String,
        required: false
    },
    otp: {
        type: String
    }, 
    otpExpires: {
        type: Date
    },
    subjectname: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
      },
    courses:{
        type:mongoose.Types.ObjectId,
        ref:"Course"
    }
}, { timestamps: true });

// Hash password before saving if modified
trainerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if password is correct
trainerSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate access token
trainerSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            subjectname: this.subjectname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// Method to generate refresh token
trainerSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const Trainer = mongoose.model("Trainer", trainerSchema);
