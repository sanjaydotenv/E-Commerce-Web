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
 * @GET /api/v1/user/logout
 * @description User Logout Route 
 */

router.get("/logout", userController.Logout)




// ---------------------------------------------------------------------------------------------------

module.exports = router