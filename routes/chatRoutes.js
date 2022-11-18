const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  fetchNotifications,
  addNotification,
} = require("../controllers/chatControllers");

router.post("/", authMiddleware, accessChat);
router.get("/", authMiddleware, fetchChats);
router.post("/add-notification", authMiddleware, addNotification);
router.get("/notifications", authMiddleware, fetchNotifications);

// group chat
router.post("/create-group", authMiddleware, createGroupChat);
router.put("/rename-group", authMiddleware, renameGroupChat);
router.put("/remove-from-group", authMiddleware, removeFromGroup);
router.put("/add-to-group", authMiddleware, addToGroup);

module.exports = router;
