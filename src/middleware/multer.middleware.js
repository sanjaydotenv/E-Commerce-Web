const multer = require("multer");

const Storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null , "./public/images")
    },
    filename: (req,file,cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 10000)
        cb(null , uniqueSuffix + '_' + file.originalname)
    }
})

const upload = multer({Storage})

module.exports = upload