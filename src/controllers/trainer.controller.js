import { asyncHandler } from '../utils/asyncHandler.js';
import { Trainer } from '../models/trainer.model.js';
import { ApiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateOtp } from '../utils/otpGenerator.js';
import { sendMail } from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

// Function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (trainerId) => {
    try {
        const trainer = await Trainer.findById(trainerId);
        const accessToken = trainer.generateAccessToken();
        const refreshToken = trainer.generateRefreshToken();

        trainer.refreshToken = refreshToken;
        await trainer.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Internal server error while generating access and refresh token");
    }
};

// Register a new trainer
const registerTrainer = asyncHandler(async (req, res) => {
    const { username, email, password,uniqueCode, subjectname } = req.body;

    if ([username, email, password, uniqueCode, subjectname].some(field => !field)) {
        throw new ApiError(400, 'All required fields must be provided');
    }

    const existingtrainer = await Trainer.findOne({ 
        $or: [
            { email },
            { uniqueCode }
        ]
     });
    if (existingtrainer) {
        throw new ApiError(409, 'trainer already exists');
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar image is required');
      }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, 'Failed to upload avatar image');
  }

  const { otp, otpExpires } = generateOtp();
  if (!otp || !otpExpires) {
    throw new ApiError(500, 'Internal server error');
  }

  await sendMail(email, otp);

    const trainer = new Trainer({
        username,
        email,
        password,
        uniqueCode,
        subjectname,
        avatar: avatar.url,
        avatarPublicId: avatar.public_id,
        otp,
        otpExpires
    });

    await trainer.save();

    return res.status(201).json(
        new ApiResponse(201, { email }, 'OTP sent to your email')
    );
});


//Verify signup otp
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required');
    }
  
    const trainer = await Trainer.findOne({ email });
  
    if (!trainer || trainer.isVerified) {
      throw new ApiError(400, 'Invalid or already verified trainer');
    }
  
    if (trainer.otp !== otp || trainer.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }
  
    trainer.isVerified = true;
    trainer.otp = undefined;
    trainer.otpExpires = undefined;
    await trainer.save();
  
    const verifiedTrainer = await Trainer.findById(trainer._id).select('-password -refreshToken');
  
    return res.status(200).json(
      new ApiResponse(200, verifiedTrainer, 'Trainer verified and registered successfully')
    );
  });

// Login a trainer
const logintrainer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const trainer = await trainer.findOne({ email });
    if (!trainer || !(await trainer.isPasswordCorrect(password))) {
        throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(trainer._id);

    trainer.refreshToken = refreshToken;
    await trainer.save();

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "trainer logged in successfully"));
});

// Logout a trainer
const logouttrainer = asyncHandler(async (req, res) => {
    const trainerId = req.trainer._id;

    const trainer = await trainer.findById(trainerId);
    if (!trainer) {
        throw new ApiError(400, "trainer not found");
    }

    trainer.refreshToken = null;
    await trainer.save({ validateBeforeSave: false });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "trainer logged out successfully"));
});

// Renew refresh token
const renewRefreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    try {
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        if (!decodedToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const trainer = await trainer.findById(decodedToken._id);

        if (!trainer || token !== trainer.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(trainer._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Refresh token updated"));
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token");
    }
});

// Change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide old and new password");
    }

    const trainer = await trainer.findById(req.trainer._id);
    if (!trainer || !(await trainer.isPasswordCorrect(oldPassword))) {
        throw new ApiError(401, "Invalid old password");
    }

    trainer.password = newPassword;
    await trainer.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get current trainer
const getCurrenttrainer = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.trainer, "Current trainer fetched successfully"));
});

// Update trainer avatar
const updatetrainerAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide the avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const trainer = await trainer.findByIdAndUpdate(req.trainer._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    if (!trainer) {
        throw new ApiError(400, "trainer not found");
    }

    return res.status(200).json(new ApiResponse(200, trainer, "Avatar updated successfully"));
});

// Update trainer details
const updatetrainerDetails = asyncHandler(async (req, res) => {
    const { name, email, phone, address, department, subjects, highestQualification } = req.body;

    if (![name, email, phone, address, department, subjects, highestQualification].some(field => field)) {
        throw new ApiError(400, "Please provide at least one detail to update");
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (department) updateFields.department = department;
    if (subjects) updateFields.subjects = subjects;
    if (highestQualification) updateFields.highestQualification = highestQualification;

    const trainer = await trainer.findByIdAndUpdate(req.trainer._id,
        { $set: updateFields },
        { new: true }
    ).select("-password");

    if (!trainer) {
        throw new ApiError(400, "trainer not found");
    }

    return res.status(200).json(new ApiResponse(200, trainer, "trainer details updated successfully"));
});

export {
    registerTrainer,
    verifyOtp,
    logintrainer,
    logouttrainer,
    renewRefreshToken,
    changeCurrentPassword,
    getCurrenttrainer,
    updatetrainerAvatar,
    updatetrainerDetails
};