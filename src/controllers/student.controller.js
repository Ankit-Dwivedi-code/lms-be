import { asyncHandler } from '../utils/asyncHandler.js';
import { Student } from "../models/student.model.js";
import { ApiError } from '../utils/apiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateOtp } from '../utils/otpGenerator.js';
import { sendMail } from '../utils/sendEmail.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    const accessToken = student.generateAccessToken();
    const refreshToken = student.generateRefreshToken();

    student.refreshToken = refreshToken;
    await student.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Internal server error while generating access and refresh token");
  }
};

const registerStudent = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => !field)) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingStudent = await Student.findOne({ email });
  if (existingStudent) {
    throw new ApiError(409, 'Student already exists');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar image is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, 'Failed to upload avatar image');
  }

  const { otp, otpExpires } = generateOtp();
  if (!otp || !otpExpires) {
    throw new ApiError(500, "Internal server error");
  }

  await sendMail(email, otp);

  const student = new Student({
    username,
    email,
    password,
    avatar: avatar.url,
    avatarPublicId: avatar.public_id,
    otp,
    otpExpires
  });

  await student.save();

  return res.status(201).json(
    new ApiResponse(201, { email }, 'OTP sent to your email')
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const student = await Student.findOne({ email });

  if (!student || student.isVerified) {
    throw new ApiError(400, 'Invalid or already verified student');
  }

  if (student.otp !== otp || student.otpExpires < Date.now()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  student.isVerified = true;
  student.otp = undefined;
  student.otpExpires = undefined;
  await student.save();

  const verifiedStudent = await Student.findById(student._id).select('-password -refreshToken');

  return res.status(200).json(
    new ApiResponse(200, verifiedStudent, 'Student verified and registered successfully')
  );
});

const loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const student = await Student.findOne({ email });
  if (!student) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await student.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { otp, otpExpires } = generateOtp();
  if (!otp || !otpExpires) {
    throw new ApiError(500, "Internal server error");
  }

  await sendMail(email, otp);

  student.otp = otp;
  student.otpExpires = otpExpires;
  student.isVerified = false;
  await student.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, { email }, 'OTP sent to your email for verification')
  );
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const student = await Student.findOne({ email });

  if (!student) {
    throw new ApiError(400, 'Invalid student');
  }

  if (student.otp !== otp || student.otpExpires < Date.now()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  student.isVerified = true;
  student.otp = undefined;
  student.otpExpires = undefined;
  await student.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(student._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Student verified and logged in successfully"));
});

const logoutStudent = asyncHandler(async (req, res) => {
  const studentId = req.student._id;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(400, "Student not found");
  }

  student.refreshToken = null;
  student.isVerified = false;
  await student.save({ validateBeforeSave: false });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json(new ApiResponse(200, {}, "Student logged out successfully"));
});

const renewRefreshToken = asyncHandler(async(req, res)=>{
  const token = req.cookies?.refreshToken || req.body.refreshToken

  try {
      const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
  
      if(!decodedToken){
          throw new ApiError(401, "Unauthorized request")
      }
  
      const student = await Student.findById(decodedToken._id)
  
      if(!student){
          throw new ApiError(401, "Inavild refresh Token")
      }
  
  
      if(token !== student.refreshToken){
          throw new ApiError(401, "Token doesnot match")
      }
  
      const {refreshToken, accessToken} = generateAccessAndRefreshTokens(student._id)
  
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Please enter the email");
  }

  const student = await Student.findOne({ email });
  if (!student) {
    throw new ApiError(400, "Invalid Email ID");
  }

  const { otp, otpExpires } = generateOtp();
  if (!otp || !otpExpires) {
    throw new ApiError(500, "Internal server error");
  }

  await sendMail(email, otp);

  student.otp = otp;
  student.otpExpires = otpExpires;
  await student.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, { email }, 'OTP sent to your email for password reset')
  );
});


const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const student = await Student.findOne({ email });

  if (!student) {
    throw new ApiError(400, 'Invalid student');
  }

  if (student.otp !== otp || student.otpExpires < Date.now()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  student.isVerified = true; // Temporarily marking as verified for password reset
  student.otp = undefined;
  student.otpExpires = undefined;
  await student.save();

  return res.status(200).json(
    new ApiResponse(200, { email }, 'OTP verified successfully, you can now reset your password')
  );
});


const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    throw new ApiError(400, 'Email and new password are required');
  }

  const student = await Student.findOne({ email });

  if (!student || !student.isVerified) {
    throw new ApiError(400, 'Invalid request or OTP not verified');
  }

  student.password = newPassword;
  student.isVerified = false; // Reset isVerified after password reset
  await student.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successfully')
  );
});


const changeCurrentPassword = asyncHandler(async(req, res)=>{

  const {oldPassword, newPassword} = req.body
  
  if(!oldPassword || !newPassword){
      throw new ApiError(400, "Please provide old and new password")
  }

  // Find the student by ID
  const student = await Student.findById(req.student._id);
  if (!student) {
    throw new ApiError(400, "Student not found, please provide password correctly");
  }

   // Check if the old password is correct
   const isPasswordCorrect = await student.isPasswordCorrect(oldPassword);
   if (!isPasswordCorrect) {
     throw new ApiError(401, "Invalid old password");
   }

   student.password = newPassword
  await student.save({validateBeforeSave : false })

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

//to get the current student
const getCurrentStudent = asyncHandler(async(req, res)=>{
  // console.log(req.student);
  return res
  .status(200)
  .json(
      new ApiResponse(200, req.student, "Current student fetched successfully")
  )
})

const updateStudentAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;

  if (!avatarLocalPath) {
      throw new ApiError(400, "Please provide the avatar");
  }

  const student = await Student.findById(req.student._id);

  if (!student) {
      throw new ApiError(400, "Student not found");
  }

  // Delete old avatar from Cloudinary if it exists
  if (student.avatarPublicId) {
      await cloudinary.uploader.destroy(student.avatarPublicId);
  }

  // Upload new avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url || !avatar?.public_id) {
      throw new ApiError(400, "Error while uploading avatar");
  }

  // Update student with new avatar URL and public ID
  student.avatar = avatar.url;
  student.avatarPublicId = avatar.public_id;
  await student.save();

  return res
      .status(200)
      .json(new ApiResponse(200, student, "Avatar uploaded successfully"));
});

export { registerStudent, verifyOtp, loginStudent, verifyLoginOtp, logoutStudent, renewRefreshToken, resetPassword, verifyForgotPasswordOtp, forgotPassword, getCurrentStudent, changeCurrentPassword, updateStudentAvatar };
