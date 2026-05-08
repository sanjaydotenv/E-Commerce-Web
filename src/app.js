const cookieParser = require("cookie-parser");
const express = require("express");
const constants = require("./constants");

const app = express();

app.use(express.json({ limit: constants.DATA_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Require Routes 
 */

const userRouter = require('./routes/user.route')


/**
 * Use Routes
 */

app.use("/api/v1/users", userRouter)



module.exports = app;
