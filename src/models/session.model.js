const mongoose = require('mongoose')


const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    refreshTokenHash: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const sessionModel = mongoose.model("session", sessionSchema)


module.exports = sessionModel