const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all Fields");
  }

  const user = await User.findOne({ email });
  if (user) {
    throw new Error("User already exists");
  }

  const result = await User.create({ name, email, password, pic });

  res.status(201).json({
    success: true,
    data: {
      _id: result._id,
      name: result.name,
      email: result.email,
      pic: result.pic,
      token: generateToken(result._id),
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please Enter all Fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found!");
  }

  const matchPassword = await user.matchPassword(password);

  if (!matchPassword) {
    res.status(400);
    throw new Error("Wrong password");
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    },
  });
});

// /api/user?search=zaman
const getSearchedUser = asyncHandler(async (req, res) => {
  const keyword = req.query.search;
  const users = await User.find({
    $or: [
      {
        name: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        email: {
          $regex: keyword,
          $options: "i",
        },
      },
    ],
  }).find({
    _id: {
      $ne: req.user._id,
    },
  });

  res.status(200).json({
    success: true,
    data: users,
  });
});

const registerUserWithSTTokenCreds = asyncHandler(async (req, res) => {
  const { name, email, userId } = req.body;

  if (!name || !email || !userId) {
    return res
      .status(400)
      .json({ message: "Please give name, email and userId" });
  }

  try {
    const user = await User.findOne({ email });

    // check if user is not registered, then register
    if (!user) {
      const result = await User.create({
        name,
        email,
        password: "1234",
        userId,
      });
      return res.status(201).json({
        _id: result._id,
        name: result.name,
        email: result.email,
        token: generateToken(result._id),
      });
    }
    // if register return token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "User not found" });
  }

  const user = await User.findOne({ userId });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.status(200).json(user);
});

module.exports = {
  registerUser,
  loginUser,
  getSearchedUser,
  registerUserWithSTTokenCreds,
  getUserById,
};
