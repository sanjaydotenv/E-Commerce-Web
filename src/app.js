const cookieParser = require("cookie-parser");
const express = require("express");
const constants = require("./constants");

const app = express();

app.use(express.json({ limit: constants.DATA_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



module.exports = app;
