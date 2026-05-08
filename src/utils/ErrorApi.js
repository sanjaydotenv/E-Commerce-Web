class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong,",
    error = [],
    Stack = "",
  ) {
    super(message);
    ((this.statusCode = statusCode),
      (this.message = message),
      (this.error = error));

    if (Stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}


module.exports = {ApiError}