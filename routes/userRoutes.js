const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getSearchedUser,
  registerUserWithSTTokenCreds,
  getUserById,
  registerAllUser,
} = require("../controllers/userControllers");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/register-with-st-token", registerUserWithSTTokenCreds);

router.get("/", authMiddleware, getSearchedUser);
router.get("/:userId", getUserById);

router.post("/insert-users", registerAllUser);

module.exports = router;
