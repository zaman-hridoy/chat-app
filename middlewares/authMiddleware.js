const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const authMiddleware = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        // decode the token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById({ _id: decodedToken.id }).select(
          "-password"
        );
        next();
      } else {
        throw new Error("Not Authorized");
      }
    } catch (err) {
      console.log(err);
      res.status(401);
      throw new Error("Not Authorized");
    }
  } else {
    res.status(401);
    throw new Error("Not Authorized");
  }
});

module.exports = authMiddleware;
