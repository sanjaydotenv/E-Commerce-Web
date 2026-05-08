const cloudinary = require('cloudinary')
const config = require('../config/config')
const fs = require('fs')

cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME, 
    api_key: config.CLOUDINARY_API_KEY, 
    api_secret: config.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (file) => {
    try {
        if (!file) return null;
        const response = cloudinary.v2.uploader.upload(file , {
            resource_type: "auto"
        })
        
        fs.unlinkSync(file)
        return response

    } catch (error) {
        fs.unlinkSync(file)
        console.log(`Image Upload Failed On Cloudinary`)
        return null
    }
}

module.exports = { uploadOnCloudinary }