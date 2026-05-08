const userModel = require("../models/user.model");
const  ErrorApi  = require("../utils/ErrorApi");
const bcrypt = require('bcrypt')
// const { uploadOnCloudinary } = require('../utils/Cloudinary')
const ResponseApi = require('../utils/ResponseApi')
const { GetOtp , GetOtpHtml } = require('../utils/OtpGenerator')
const SendEmail = require('../utils/SendMail');
const sendEmail = require("../utils/SendMail");
const otpModel = require('../models/otp.model')


const Register = async (req, res) => {

  const { userName, email, password } = req.body;

  if (!(userName || email || password)) {
    throw new ErrorApi(400 , "All fields are required for registraction" )
  }

  const isAlreadyExists = await userModel.findOne({
    $or: [
        {userName},
        {email}
    ]
  })

  if (isAlreadyExists){
    if (isAlreadyExists.userName){
        throw new ErrorApi(400 , "User is Allready with this userName")
    }

    if (isAlreadyExists.email) {
        throw new ErrorApi(400 , "User is Allready with this email")
    }
  }

  const hashedPassword = await bcrypt.hash(password , 12)

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
  })

  const Otp = GetOtp()
  const html = GetOtpHtml(Otp)

  const otpHash = await bcrypt.hash(String(Otp) , 12)

  await otpModel.create({
    email,
    user: user._id,
    otpHash
  })

  await sendEmail(email , "Email OTP Verification Mail" , `Your OTP is ${Otp}` , html)

  res.status(201).json(new ResponseApi(201 , user , "User Created Successfully"))

};

module.exports = {
  Register,
};
