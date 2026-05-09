const userModel = require("../models/user.model");
const ErrorApi = require("../utils/ErrorApi");
const bcrypt = require("bcrypt");
// const { uploadOnCloudinary } = require('../utils/Cloudinary')
const ResponseApi = require("../utils/ResponseApi");
const { GetOtp, GetOtpHtml } = require("../utils/OtpGenerator");
const sendEmail = require("../utils/SendMail");
const otpModel = require("../models/otp.model");
const accessTokenAndrefreshTokenGenerator = require('../utils/GetRefreshAndAccessToken')
const sessionModel = require('../models/session.model')
const jwt = require('jsonwebtoken');
const config = require('../config/config')



// ---------------------------------------------------------------------------------------------------



/**
 * @API User Registration Api
 * @Description This controller registers the user and sends an OTP to their email address for verification.
 */

const Register = async (req, res) => {

  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    throw new ErrorApi(400, "All fields are required for registration");
  }

  const isAlreadyExists = await userModel.findOne({
    $or: [{ userName }, { email }],
  });

  if (isAlreadyExists) {
    if (isAlreadyExists.userName === userName) {
      throw new ErrorApi(400, "User is Allready Exists with this userName");
    }

    if (isAlreadyExists.email === email) {
      throw new ErrorApi(400, "User is Allready Exists with this email");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // const profilePicturePath = req.files ? req.files?.profilePicture[0]?.path : ""
  // const coverPicturePath = req.files ? req.files?.coverPicture[0]?.path : ""

  // const profilePicture = await uploadOnCloudinary(profilePicturePath)
  // const coverPicture = await uploadOnCloudinary(coverPicturePath)

  // if (!profilePicture || !coverPicture){
  //   throw new ErrorApi(500 , "failed to upload on cloudinary")
  // }

  const user = await userModel.create({
    userName,
    email,
    password: hashedPassword,
    // profilePicture: profilePicture?.url,
    // coverPicture: coverPicture?.url
  });

  
  const Otp = GetOtp();
  const html = GetOtpHtml(Otp);
  
  const otpHash = await bcrypt.hash(String(Otp), 12);
  
  await otpModel.create({
    email,
    user: user._id,
    otpHash,
  });
  
  await sendEmail(email, "Email Verification Mail", `Your OTP is ${Otp}`, html);


  res.status(201).json(new ResponseApi(201, user, "User Created Successfully Please Verify Your Email Address"));

};



// ---------------------------------------------------------------------------------------------------



/**
 * @API OTP Verification API
 * @Description This controller checks whether the provided OTP is valid or invalid.
 */

const OtpVerification = async (req, res) => {
  
  const { email, otp } = req.body;

  const isExists = await otpModel.findOne({
    email,
  });

  if (!isExists) {
    throw new ErrorApi(400, "Invalid OTP");
  }

  const isValidOtp = await bcrypt.compare(String(otp), isExists.otpHash);

  if (!isValidOtp) {
    throw new ErrorApi(400, "OTP is Wrong");
  }

  const verifiedUser = await userModel.findOneAndUpdate(
    { email },
    { isVerify: true },
    { new: true },
  );

  console.log(verifiedUser)

  await otpModel.deleteMany({ email })

  const {accessToken , refreshToken} = await accessTokenAndrefreshTokenGenerator(verifiedUser._id)

  const refreshTokenHash = await bcrypt.hash(refreshToken , 12)

  await sessionModel.create({
    user: verifiedUser._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  })

  res.cookie("refreshToken", refreshToken , {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
  })

  res.status(200).json(new ResponseApi(200, {
      userName: verifiedUser.userName,
      email: verifiedUser.email,
      accessToken
    }, "OTP Verification Successfully"));

};



// ---------------------------------------------------------------------------------------------------



/**
 * @API User Login API
 * @Description This controller logs in a valid user.
 */


const Login = async (req,res) => {

  const {userName , email , password} = req.body

  if (!userName && !email) {
    throw new ErrorApi(400 , "Enter a userName or Email")
  }

  if (!password) {
    throw new ErrorApi(400 , "Password is required")
  }

  const user = await userModel.findOne({
    $or: [
      {userName},
      {email}
    ]
  })

  if (!user) {
    throw new ErrorApi(401 , "User not found")
  }

  if (!user.isVerify){
    throw new ErrorApi(409 , "User is not Verified")
  }

  const isPasswordValid = await bcrypt.compare(password , user.password)

  if (!isPasswordValid){
    throw new ErrorApi(400 , "Password is Incorrect Enter a Valid Password")
  }

  const { refreshToken , accessToken } = await accessTokenAndrefreshTokenGenerator(user._id)

  const refreshTokenHash = await bcrypt.hash(refreshToken , 12)

  await sessionModel.create({
    user: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  })

  res.cookie("refreshToken", refreshToken , {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  })

  res.status(200).json(new ResponseApi(200 , {
    userName: user.userName,
    email: user.email,
    accessToken
  } , "User Logged in Successfully"))

}



// ---------------------------------------------------------------------------------------------------



/**
 * @API USer Logout API
 * @description This Controller Logged Out The User
 */

const Logout = async (req,res) => {

  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    throw new ErrorApi(400 , "Refresh Token Not Provided")
  }

  let decoded
  try {
    decoded = jwt.verify(refreshToken , config.JWT_SECRET_KEY)
  } catch (error) {
    console.log(`Refresh Token Verification failed ${error.message}`)
  }


  const user = await userModel.findById(decoded.id)


  const session = await sessionModel.findOne({user: user._id})

  if (!session) {
    throw new ErrorApi(409 , "Session not found")
  }

  if (session.revoked) {
    throw new ErrorApi(400 , "Invalid Refresh Token Session is Revoked")
  }

  const isValidRefreshToken = await bcrypt.compare(refreshToken , session.refreshTokenHash)


  if (!isValidRefreshToken){
    throw new ErrorApi(400 , "Refresh Token is Invalid")
  }

  session.revoked = true
  await session.save()

  res.clearCookie('refreshToken')

  res.status(200).json(new ResponseApi(200 , null , "User Logged Out Successfully"))

}








// ---------------------------------------------------------------------------------------------------

module.exports = {
  Register,
  OtpVerification,
  Login,
  Logout
};
