const express = require('express')
const router = express.Router()

// ---------------------------------------------------------------------------------------------------

/**
 * Require Controllers
 */

const userController = require('../controllers/user.controller')

// ---------------------------------------------------------------------------------------------------

/**
 * Require Middlewares
 */

const upload = require('../middleware/multer.middleware')

// ---------------------------------------------------------------------------------------------------

/**
 * @POST /api/v1/users/register
 * @Description User Registration Route
 */
router.post("/register", upload.fields([{name: "profilePicture" , maxCount: 1} , {name: "coverPicture" , maxCount: 1}]) , userController.Register)

// ---------------------------------------------------------------------------------------------------

/**
 * @POST /api/v1/users/Otp-verification
 * @Description Otp Verification Route
 */
router.post("/otp-verification", userController.OtpVerification)

// ---------------------------------------------------------------------------------------------------


/**
 * @POST /api/v1/users/login
 * @Description User Login Route
 */

router.post("/login" , userController.Login)


// ---------------------------------------------------------------------------------------------------


/**
 * @GET /api/v1/users/logout
 * @description User Logout Route 
 */

router.get("/logout", userController.Logout)


// ---------------------------------------------------------------------------------------------------


/**
 * @GET /api/v1/users/logoout-from-all
 * @Description User Logout From All Device Route
 */
router.get("/logout-from-all-device", userController.LogoutFromAllDevice)

// ---------------------------------------------------------------------------------------------------


/**
 * @GET /api/v1/users/get-me
 * @Description Fetch The User Profile Info
 */

router.get("/get-me", userController.GetMe)


// ---------------------------------------------------------------------------------------------------


/**
 * @GET /api/v1/users/token-rotation
 * @Description Generate New Access Token And Refresh Token 
 */


router.get("/token-rotation" , userController.TokenRotation)


// ---------------------------------------------------------------------------------------------------


/**
 * @POST /api/v1/users/change-password
 * @Description Create New Password
 */


router.post("/change-password" , userController.ChangePassword)


module.exports = router