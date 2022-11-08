const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  sendMesage,
  getAllMessages,
} = require("../controllers/messageControllers");

router.post("/", authMiddleware, sendMesage);
router.get("/:chatId", authMiddleware, getAllMessages);

module.exports = router;
