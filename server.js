const server = require('./src/app')
const ConnectDB = require('./src/config/db')
const constants = require('./src/constants')

ConnectDB()
.then(() => {
    server.listen(constants.PORT || 8080 , () => {
        console.log(`Server is running at port ${constants.PORT}`)
    })
})
.catch((err) => {
    console.log(`Database Connection Problem ${err.message}`)
})