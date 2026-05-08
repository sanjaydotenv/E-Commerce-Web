const mongoose = require('mongoose')


const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    otpHash: {
        type: String,
        required: true
    },
    createAt: {
        type: Date,
        default: Date.now(),
        expires: 600
    }
})

const otpModel = mongoose.model('otp', otpSchema)


module.exports = otpModel