const mongoose = require("mongoose");

const nofiticationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", nofiticationSchema);
module.exports = Notification;
