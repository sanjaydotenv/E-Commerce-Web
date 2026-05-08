require('dotenv').config()

if (!process.env.MONGODB_URI){
    throw new Error("MONGODB_URI is not defined in environment variable")
}

if (!process.env.CLOUDINARY_NAME){
    throw new Error("MONGODB_URI is not defined in environment variable")
}

if (!process.env.CLOUDINARY_API_KEY){
    throw new Error("MONGODB_URI is not defined in environment variable")
}

if (!process.env.CLOUDINARY_API_SECRET){
    throw new Error("MONGODB_URI is not defined in environment variable")
}

const config = {
    MONGODB_URI: process.env.MONGODB_URI,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}


module.exports = config