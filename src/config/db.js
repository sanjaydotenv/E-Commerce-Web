const mongoose = require('mongoose')
const config = require('./config')
const { DB_NAME } = require('../constants')

const ConnectDB = async () => {
    try {
        const response = await mongoose.connect(`${config.MONGODB_URI}${DB_NAME}`)
        console.log(`Database Connected Successfully ${response.connection.host}`)
    } catch (error) {
        console.log(`Database Connection failed ${error.message}`)
        process.exit(1)
    }
}


module.exports = ConnectDB