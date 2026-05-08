const express = require('express')
const router = express.Router()


/**
 * Require Controllers
 */

const userController = require('../controllers/user.controller')


/**
 * Require Middlewares
 */

const upload = require('../middleware/multer.middleware')

/**
 * Use Controllers
 */

router.post("/register", upload.fields([{name: "profilePicture" , maxCount: 1} , {name: "coverPicture" , maxCount: 1}]) , userController.Register)


module.exports = router