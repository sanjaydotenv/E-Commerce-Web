const mongoose = require('mongoose')
const config = require('./config')

const ConnectDB = async () => {
    try {
        const response = await mongoose.connect(`${config.MONGODB_URI}E-Commerce-Web`)
        console.log(`Database Connected Successfully ${response.connection.host}`)
    } catch (error) {
        console.log(`Database Connection failed ${error.message}`)
        process.exit(1)
    }
}


module.exports = ConnectDB