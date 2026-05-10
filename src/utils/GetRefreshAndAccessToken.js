const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const config = require('../config/config')
const constants = require('../constants')

const GenerateAccessAndRefreshToken = async (userId , sessionId) => {
    
    const user = await userModel.findById(userId)

    const accessToken = jwt.sign({
        id: user._id,
        email: user.email
    }, config.JWT_SECRET_KEY , {
        expiresIn: constants.ACCESS_TOKEN_EXPIRY
    })

    const refreshToken = jwt.sign({
        id: user._id,
        sessionId: sessionId
    } , config.JWT_SECRET_KEY , {
        expiresIn: constants.REFRESH_TOKEN_EXPIRY
    })

    return {accessToken , refreshToken}
}


module.exports = GenerateAccessAndRefreshToken