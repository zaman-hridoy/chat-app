const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User id is not given",
    });
  }
  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        {
          users: {
            $elemMatch: {
              $eq: req.user._id,
            },
          },
        },
        {
          users: {
            $elemMatch: {
              $eq: {
                _id: userId,
              },
            },
          },
        },
      ],
    })
      .populate("users")
      .populate("latestMessage")
      .populate("creator");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email isActive role userId isActive",
    });

    if (isChat.length > 0) {
      res.status(200).send(isChat[0]);
    } else {
      let chatData = {
        chatName: "sender",
        creator: req.user._id,
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);

      const fullChat = await Chat.find({ _id: createdChat._id })
        .populate("users")
        .populate("creator");

      res.status(200).send(fullChat[0]);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({
      users: {
        $elemMatch: {
          $eq: req.user._id,
        },
      },
    })
      .populate("users")
      .populate("creator")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).json({
          success: true,
          data: results,
        });
      });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

const addNotification = asyncHandler(async (req, res) => {
  const { sender, receivers, chatId, mgsId, isGroupChat } = req.body;

  if (!sender || !receivers || !chatId || !mgsId) return;
  try {
    console.log("call add noti");
    const notification = await Notification.create({
      sender,
      receivers,
      chat: chatId,
      message: mgsId,
      isGroupChat: isGroupChat,
    });

    res.status(201).json(notification);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

const fetchNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await User.find(
      {
        _id: req.user._id,
      },
      {
        notifications: 1,
        _id: 0,
      }
    );

    res.status(200).json(notifications[0]);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the fields" });
  }

  const users = req.body.users;

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat.");
  }
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      creator: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users")
      .populate("creator");

    res.status(200).json(fullGroupChat);
  } catch (err) {
    console.log(err);
  }
});

const renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: {
          chatName,
        },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.status(200).send(updatedChat);
    }
  } catch (err) {
    console.log(err);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  console.log(req.body);
  const addedData = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: {
        users: userId,
      },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!addedData) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.status(200).send(addedData);
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const updatedData = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        users: userId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedData) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.status(200).send(updatedData);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroup,
  removeFromGroup,
  fetchNotifications,
  addNotification,
};
