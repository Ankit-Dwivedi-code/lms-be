import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import { InviteCode } from "../models/invite.model.js";
import { ulid } from "ulid";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateOtp } from '../utils/otpGenerator.js';
import { sendMail } from '../utils/sendEmail.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    console.log("refresh Token is", refreshToken);

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error while generating access and refresh token"
    );
  }
};

// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  // Get admin details
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingAdmin = await Admin.findOne({ role });
  if (existingAdmin) {
    throw new ApiError(409, 'Admin already exists');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar image is required');
  }

  const uploadResult = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadResult) {
    throw new ApiError(500, 'Failed to upload avatar image');
  }

  const { otp, otpExpires } = generateOtp();
  if (!otp || !otpExpires) {
    throw new ApiError(500, 'Internal server error');
  }

  await sendMail(email, otp);

  const admin = new Admin({
    name,
    email,
    password,
    role,
    avatar: uploadResult.url,
    avatarPublicId: uploadResult.public_id,
    otp,
    otpExpires
  });

  await admin.save();

  return res.status(201).json(
    new ApiResponse(201, { email }, 'OTP sent to your email')
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required');
    }
  
    const admin = await Admin.findOne({ email });
  
    if (!admin || admin.isVerified) {
      throw new ApiError(400, 'Invalid or already verified admin');
    }
  
    if (admin.otp !== otp || admin.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }
  
    admin.isVerified = true;
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();
  
    const verifiedAdmin = await Admin.findById(admin._id).select('-password -refreshToken');
  
    return res.status(200).json(
      new ApiResponse(200, verifiedAdmin, 'Admin verified and registered successfully')
    );
  });

// Admin Login
// Admin Login
const loginAdmin = asyncHandler(async (req, res) => {
    // Get admin credentials
    const { email, password } = req.body;
  
    // Check for empty fields
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }
  
    // Check for existing admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new ApiError(401, "Invalid email or password");
    }
  
    // Check if the password is correct
    const isPasswordCorrect = await admin.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid email or password");
    }
  
    // Generate OTP
    const { otp, otpExpires } = generateOtp();
    if (!otp || !otpExpires) {
      throw new ApiError(500, "Internal server error");
    }
  
    // Send OTP to admin's email
    await sendMail(email, otp);
  
    // Save OTP and OTP expiration to the admin's record
    admin.otp = otp;
    admin.otpExpires = otpExpires;
    admin.isVerified = false;
    await admin.save({ validateBeforeSave: false });
  
    return res.status(200).json(
      new ApiResponse(200, { email }, "OTP sent to your email for verification")
    );
  });

  
  const verifyLoginOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required');
    }
  
    const admin = await Admin.findOne({ email });
  
    if (!admin || admin.isVerified) {
      throw new ApiError(400, 'Invalid or already verified admin');
    }
  
    if (admin.otp !== otp || admin.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }
  
    // Mark the admin as verified
    admin.isVerified = true;
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();
  
    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, refreshToken }, "Admin verified and logged in successfully")
      );
  });
  

const generateInviteCode = asyncHandler(async (req, res) => {

  // Create a unique invite code
  const inviteCode = ulid();

  // Save the invite code to the database
  const invite = new InviteCode({
    code: inviteCode,
    used: false,
  });

  await invite.save();

  return res.status(201).json({
    success: true,
    message: "Invite code generated successfully",
    data: { inviteCode },
  });
});

// Admin Logout
const logoutAdmin = asyncHandler(async (req, res) => {
  //clear the cookie
  //clear the accesstoken
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: {
        refreshToken: 1,
        isVerified: 1
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin Logged out successfully"));
});

const renewRefreshToken = asyncHandler(async(req, res)=>{
  const token = req.cookies?.refreshToken || req.body.refreshToken

  try {
      const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
  
      if(!decodedToken){
          throw new ApiError(401, "Unauthorized request")
      }
  
      const admin = await Admin.findById(decodedToken._id)
  
      if(!admin){
          throw new ApiError(401, "Inavild refresh Token")
      }
  
  
      if(token !== admin.refreshToken){
          throw new ApiError(401, "Token doesnot match")
      }
  
      const {refreshToken, accessToken} = generateAccessAndRefreshTokens(admin._id)
  
      const options = {
          httpOnly : true,
          secure : true
      }
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
          new ApiResponse(200, 
              {
                  accessToken,
                  refreshToken
              },
              "Refresh token updated"
          )
      )
  } catch (error) {
      throw new ApiError(400, error?.message || "Invalid access token")
  }
})

//Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      throw new ApiError(400, "Please enter the email");
    }
  
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new ApiError(400, "Invalid Email ID");
    }
  
    const { otp, otpExpires } = generateOtp();
    if (!otp || !otpExpires) {
      throw new ApiError(500, "Internal server error");
    }
  
    await sendMail(email, otp);
  
    admin.otp = otp;
    admin.otpExpires = otpExpires;
    await admin.save({ validateBeforeSave: false });
  
    return res.status(200).json(
      new ApiResponse(200, { email }, 'OTP sent to your email for password reset')
    );
  });

  const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required');
    }
  
    const admin = await Admin.findOne({ email });
  
    if (!admin) {
      throw new ApiError(400, 'Invalid admin');
    }
  
    if (admin.otp !== otp || admin.otpExpires < Date.now()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }
  
    admin.isVerified = true; // Temporarily marking as verified for password reset
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();
  
    return res.status(200).json(
      new ApiResponse(200, { email }, 'OTP verified successfully, you can now reset your password')
    );
  });

  const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      throw new ApiError(400, 'Email and new password are required');
    }
  
    const admin = await Admin.findOne({ email });
  
    if (!admin || !admin.isVerified) {
      throw new ApiError(400, 'Invalid request or OTP not verified');
    }
  
    admin.password = newPassword;
    admin.isVerified = false; // Reset isVerified after password reset
    await admin.save();
  
    return res.status(200).json(
      new ApiResponse(200, {}, 'Password reset successfully go to login')
    );
  });

  const getCurrentAdmin = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.admin, "Current admin fetched successfully")
    )
  })

  //Change current password

  const changeCurrentPassword = asyncHandler(async(req, res)=>{

    const {oldPassword, newPassword} = req.body
    
    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Please provide old and new password")
    }
  
    // Find the admin by ID
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(400, "Admin not found, please provide password correctly");
    }
  
     // Check if the old password is correct
     const isPasswordCorrect = await admin.isPasswordCorrect(oldPassword);
     if (!isPasswordCorrect) {
       throw new ApiError(401, "Invalid old password");
     }
  
     admin.password = newPassword
    await admin.save({validateBeforeSave : false })
  
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
  })
  


  //Update avatar

  const updateAdminAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file.path;
  
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide the avatar");
    }
  
    const admin = await Admin.findById(req.admin._id);
  
    if (!admin) {
        throw new ApiError(400, "Admin not found");
    }
  
    // Delete old avatar from Cloudinary if it exists
    if (admin.avatarPublicId) {
        await cloudinary.uploader.destroy(admin.avatarPublicId);
    }
  
    // Upload new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
  
    if (!avatar?.url || !avatar?.public_id) {
        throw new ApiError(400, "Error while uploading avatar");
    }
  
    // Update admin with new avatar URL and public ID
    admin.avatar = avatar.url;
    admin.avatarPublicId = avatar.public_id;
    await admin.save();
  
    return res
        .status(200)
        .json(new ApiResponse(200, admin, "Avatar uploaded successfully"));
  });


  const updateAdminDetails = asyncHandler(async(req, res)=>{

    const {name, email} = req.body
  
    if(!name || !email ){
        throw  new ApiError(400, "Please provide the details")
    }
  
    const admin = await Admin.findByIdAndUpdate(req.admin._id,
        {
            $set:{
                name,
                email
            }
        },
        {new : true}
    ).select("-password")
  
    if(!admin){
        throw new ApiError(400, "Admin not found")
    }
  
    return res
    .status(200)
    .json(
        new ApiResponse(200, admin, "Admin details updated Successfully")
    )
  })


  


export { registerAdmin,verifyOtp, loginAdmin, verifyLoginOtp, generateInviteCode, logoutAdmin, renewRefreshToken };