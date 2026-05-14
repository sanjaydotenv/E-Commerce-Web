const userModel = require("../models/user.model");
const ErrorApi = require("../utils/ErrorApi");
const bcrypt = require("bcrypt");
// const { uploadOnCloudinary } = require('../utils/Cloudinary')
const ResponseApi = require("../utils/ResponseApi");
const { GetOtp, GetOtpHtml } = require("../utils/OtpGenerator");
const sendEmail = require("../utils/SendMail");
const otpModel = require("../models/otp.model");
const accessTokenAndrefreshTokenGenerator = require("../utils/GetRefreshAndAccessToken");
const sessionModel = require("../models/session.model");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

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

  res
    .status(201)
    .json(
      new ResponseApi(
        201,
        user,
        "User Created Successfully Please Verify Your Email Address",
      ),
    );
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

  await otpModel.deleteMany({ email });

  const session = await sessionModel.create({
    user: verifiedUser._id,
    revoked: false,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { accessToken, refreshToken } =
    await accessTokenAndrefreshTokenGenerator(verifiedUser._id, session._id);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  session.refreshTokenHash = refreshTokenHash;
  await session.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.status(200).json(
    new ResponseApi(
      200,
      {
        userName: verifiedUser.userName,
        email: verifiedUser.email,
        accessToken,
      },
      "OTP Verification Successfully",
    ),
  );
};

// ---------------------------------------------------------------------------------------------------

/**
 * @API User Login API
 * @Description This controller logs in a valid user.
 */

const Login = async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new ErrorApi(400, "Enter a userName or Email");
  }

  if (!password) {
    throw new ErrorApi(400, "Password is required");
  }

  const user = await userModel.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ErrorApi(401, "User not found");
  }

  if (!user.isVerify) {
    throw new ErrorApi(409, "User is not Verified");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ErrorApi(400, "Password is Incorrect Enter a Valid Password");
  }

  const session = await sessionModel.create({
    user: user._id,
    revoked: false,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { refreshToken, accessToken } =
    await accessTokenAndrefreshTokenGenerator(user._id, session._id);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  session.refreshTokenHash = refreshTokenHash;
  await session.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res.status(200).json(
    new ResponseApi(
      200,
      {
        userName: user.userName,
        email: user.email,
        accessToken,
      },
      "User Logged in Successfully",
    ),
  );
};

// ---------------------------------------------------------------------------------------------------

/**
 * @API User Logout APIo
 * @description This Contrller Logged Out The User
 */

const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ErrorApi(400, "Refresh Token Not Provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET_KEY);
  } catch (error) {
    throw new ErrorApi(
      400,
      `Refresh Token Verification Failed ${error.message}`,
    );
  }

  const session = await sessionModel.findById(decoded.sessionId);

  if (!session) {
    throw new ErrorApi(409, "Session not found");
  }

  if (session.revoked) {
    throw new ErrorApi(400, "Invalid Refresh Token Session is Revoked");
  }

  const isValidRefreshToken = await bcrypt.compare(
    refreshToken,
    session.refreshTokenHash,
  );

  if (!isValidRefreshToken) {
    throw new ErrorApi(400, "Refresh Token is Invalid");
  }

  session.revoked = true;
  await session.save();

  res.clearCookie("refreshToken");

  res
    .status(200)
    .json(new ResponseApi(200, null, "User Logged Out Successfully"));
};

// ---------------------------------------------------------------------------------------------------

/**
 * @API User All Device Logout Device API
 * @Description This Controller Logged Out User From All Devices
 */

const LogoutFromAllDevice = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ErrorApi(400, "Refresh Token not Provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET_KEY);
  } catch (error) {
    throw new ErrorApi(
      400,
      `Refresh Token Verification Failed ${error.message}`,
    );
  }

  const session = await sessionModel.findById(decoded.sessionId);

  if (!session) {
    throw new ErrorApi(400, "Session not found");
  }

  if (session.revoked) {
    throw new ErrorApi(400, "Invalid Refresh Token Session is Revoked");
  }

  const isValidRefreshToken = await bcrypt.compare(
    refreshToken,
    session.refreshTokenHash,
  );

  if (!isValidRefreshToken) {
    throw new ErrorApi(400, "Invalid Refresh Token");
  }

  await sessionModel.updateMany(
    {
      user: decoded.id,
      revoked: false,
    },
    { revoked: true },
  );

  res.clearCookie("refreshToken");

  res
    .status(200)
    .json(new ResponseApi(200, null, "All Device Logged Out Successfully"));
};

/**
 * @API Get-Me User API
 * @description This Controller Fetch The User Information And Give Us
 */

const GetMe = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    throw new ErrorApi(400, "Access Token Not Found");
  }

  let decoded;
  try {
    decoded = jwt.verify(accessToken, config.JWT_SECRET_KEY);
  } catch (error) {
    throw new ErrorApi(
      400,
      `Access Token Verification Failed ${error.message}`,
    );
  }

  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new ErrorApi(400, "User Not Found");
  }

  res.status(200).json(
    new ResponseApi(
      200,
      {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        isVerify: user.isVerify,
      },
      "User Fetched Successfully",
    ),
  );
};

// ---------------------------------------------------------------------------------------------------

/**
 * @API Token Rotation API
 * @description This Controller Generate The New AccessToken And RefreshToken
 */

const TokenRotation = async (req, res) => {
  const getRefreshToken = req.cookies.refreshToken;

  if (!getRefreshToken) {
    throw new ErrorApi(400, "Refresh Token Not Provided");
  }

  let decoded;

  try {
    decoded = jwt.verify(getRefreshToken, config.JWT_SECRET_KEY);
  } catch (error) {
    throw new ErrorApi(400, `Token Verification Failed ${error.message}`);
  }

  const session = await sessionModel.findById(decoded.sessionId);

  if (!session) {
    throw new ErrorApi(401, "Refresh Token is Invalid Session not Found");
  }

  if (session.revoked) {
    throw new ErrorApi(401, "Session Already Revoked");
  }

  const isValidRefreshToken = await bcrypt.compare(
    getRefreshToken,
    session.refreshTokenHash,
  );

  if (!isValidRefreshToken) {
    throw new ErrorApi(401, "Invalid Refresh Token");
  }

  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new ErrorApi(401, "User Not Found");
  }

  const revokedSession = await sessionModel.findOneAndUpdate(
    { _id: decoded.sessionId, revoked: false },
    {
      $set: {
        revoked: true,
      },
    },
    { new: true },
  );

  if (!revokedSession) {
    throw new ErrorApi(401, "Session Already Used");
  }

  const newSession = await sessionModel.create({
    user: user._id,
    revoked: false,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const { refreshToken, accessToken } =
    await accessTokenAndrefreshTokenGenerator(user._id, newSession._id);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  newSession.refreshTokenHash = refreshTokenHash;
  await newSession.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  });

  res
    .status(200)
    .json(
      new ResponseApi(
        200,
        accessToken,
        "Generate New Access Token And Refresh Token Successfully",
      ),
    );
};

/**
 * @API Chnage Password API
 * @description This Controller Create New Password
 */

const ChangePassword = async (req, res) => {
  const accessToken = req.headers.authorization.split(" ")[1];

  if (!accessToken) {
    throw new ErrorApi(400, "Access Token Not Provided");
  }

  let decoded;

  try {
    decoded = jwt.verify(accessToken, config.JWT_SECRET_KEY);
  } catch (error) {
    throw new ErrorApi(400, `JWT Verification Failed ${error.message}`);
  }

  const user = await userModel.findById(decoded.id);


  if (!user || !user.isVerify) {
    throw new ErrorApi(401, "User Not Found OR User is Not Verified");
  }

  const { oldPassword, newPassword } = req.body;

  const isValidPassword = await bcrypt.compare(oldPassword , user.password)

  if (!isValidPassword) {
    throw new ErrorApi(401 , "Password in Incorrect")
  }

  const password = await bcrypt.hash(newPassword , 12)

  user.password = password
  await user.save()


  res.status(200).json(new ResponseApi(200 , {
    userName: user.userName,
    email: user.email
  } , "Password Changed Successfully"))

};

// ---------------------------------------------------------------------------------------------------

module.exports = {
  Register,
  OtpVerification,
  Login,
  Logout,
  LogoutFromAllDevice,
  GetMe,
  TokenRotation,
  ChangePassword,
};
