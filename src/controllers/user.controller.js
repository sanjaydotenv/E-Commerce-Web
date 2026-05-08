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

  const {accessToken , refreshToken} = accessTokenAndrefreshTokenGenerator(verifiedUser._id)

  const refreshTokenHash = await bcrypt.hash(refreshToken , 12)

  await sessionModel.create({
    user: verifiedUser._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  })

  res.status(200).json(new ResponseApi(200, {
      userName: verifiedUser.userName,
      email: verifiedUser.email,
      accessToken
    }, "OTP Verification Successfully"));



};







module.exports = {
  Register,
  OtpVerification,
};
