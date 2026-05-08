const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true , "userName is required for registration"],
        unique: [true , "userName is unique for registration"]
    },
    email: {
        type: String,
        required: [true , "email is required for registration"],
        unique: [true , "email is unique for registration"]
    },
    password: {
        type: String,
        required: [true , "password is required for registration"],
    },
    profilePicture: {
        type: String,
    },
    coverPicture: {
        type: String,
    },
    isVerify: {
        type: Boolean,
        default: false
    }
})

const userModel = mongoose.model('user' , userSchema)

module.exports = userModel