const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true , "userName is required for registraction"],
        unique: [true , "userName is unique for registraction"]
    },
    email: {
        type: String,
        required: [true , "email is required for registraction"],
        unique: [true , "email is unique for registraction"]
    },
    password: {
        type: String,
        required: [true , "password is required for registraction"],
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