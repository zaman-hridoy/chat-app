const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const chats = require("./data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const Chat = require("./models/chatModel");
const User = require("./models/userModel");
const Message = require("./models/messageModel");
const Notification = require("./models/notificationModel");

// config
dotenv.config();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// DB connection
connectDB();

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Api is running...");
});

// configure routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
});

// io.on("connection", (socket) => {
//   console.log("Connected to soket.io");

//   socket.on("setup", (userData) => {
//     socket.join(userData._id);
//     socket.emit("connected");
//   });

//   socket.on("join_chat", (room) => {
//     socket.join(room);
//     console.log("User joined room", room);
//   });

//   // typing
//   socket.on("typing", (room) => socket.in(room).emit("typing"));
//   socket.on("stop_typing", (room) => socket.in(room).emit("stop_typing"));

//   socket.on("new_message", (newMgs) => {
//     let chat = newMgs.chat;
//     if (!chat.users) return;
//     chat.users.forEach((user) => {
//       if (user._id === newMgs.sender._id) return;

//       socket.in(user._id).emit("mgs_received", newMgs);
//     });
//   });

//   socket.off("setup", () => {
//     console.log("user disconnected");
//     socket.leave(userData._id);
//   });
// });

async function getChatMessages(chatId) {
  return await Message.aggregate([
    {
      $match: { chatId },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        messageByDate: {
          $push: "$$ROOT",
        },
      },
    },
  ]);
}

// socket
io.on("connection", (socket) => {
  let connectedUser;
  socket.on("new_user", (userId) => {
    socket.join(userId);
    connectedUser = userId;
    io.to(userId).emit("new_user");
    console.log(`new user ${userId} have joined`);
  });

  socket.on("join_chat", async (newChat, prevChatId) => {
    if (!newChat) return;
    socket.join(newChat?._id);
    if (!newChat?.latestMessage) {
      let users = newChat?.users;
      users = users.filter((u) => u?._id !== newChat?.creator?._id);
      users.forEach((u) => {
        io.to(u?._id).emit("chat_created");
      });
    }

    if (prevChatId) {
      socket.leave(prevChatId);
    }

    // console.log(`User join room: ${newChatId}`);
    try {
      // send chat messages
      // const messages = await getChatMessages(newChat?._id);

      socket.emit("chat_messages");
    } catch (err) {
      console.log(err);
    }
  });

  //   // typing
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop_typing", (room) => socket.in(room).emit("stop_typing"));

  socket.on(
    "new_message",
    async (content, chatId, senderId, isVideo = false) => {
      if (!content || !chatId || !senderId) return;
      const newMessage = {
        sender: senderId,
        content,
        chat: chatId,
        chatId,
        isVideo,
      };
      try {
        let message = await Message.create(newMessage);
        message = await message.populate("sender", "name userId");
        message = await message.populate("chat");

        message = await User.populate(message, {
          path: "chat.users",
          select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, {
          latestMessage: message,
        });
        await Chat.findByIdAndUpdate(chatId, {
          latestMessage: message,
        });

        const messages = await getChatMessages(chatId);
        io.to(chatId).emit("chat_messages", messages);
        socket.in(chatId).emit("update_chatlist");
        // socket.emit("new_user"); // for updating chat list
        socket.broadcast.emit("notifications", chatId, message);
      } catch (err) {
        console.log(err);
      }
    }
  );

  // add notification
  socket.on(
    "add_notification",
    (sender, receivers, chatId, mgsId, isGroupChat) => {
      if (!sender || !receivers || !chatId || !mgsId) return;
      try {
        if (receivers?.length > 0) {
          receivers.forEach(async (receiver) => {
            const user = await User.findByIdAndUpdate(receiver, {
              $push: {
                notifications: {
                  sender,
                  chat: chatId,
                  message: mgsId,
                  isGroupChat,
                },
              },
            });
            io.to(receiver).emit("get_notifications");
            // const notifications = await Notification.create({
            //   sender,
            //   receivers,
            //   chat: chatId,
            //   message: mgsId,
            //   isGroupChat: isGroupChat,
            // });
          });
        }

        // receivers.forEach((user) => {
        //   io.to(user).emit("get_notifications", notifications);
        // });
      } catch (err) {
        console.log(err);
      }
    }
  );

  // delete chat
  socket.on("delete_chat", async (chatId) => {
    try {
      await Chat.findByIdAndRemove(chatId);

      io.to(chatId).emit("chat_deleted");
      const updated = await User.updateMany(
        {
          notifications: {
            $elemMatch: {
              chat: chatId,
            },
          },
        },
        {
          $pull: {
            notifications: {
              chat: chatId,
            },
          },
        },
        { new: true }
      );
    } catch (err) {
      console.log(err);
    }
  });

  // delete notification on joining chat
  socket.on("delete_notification", async (chatId, userId) => {
    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $pull: {
            notifications: {
              chat: chatId,
            },
          },
        },
        { new: true }
      );
      io.to(userId).emit("get_notifications");
      console.log("user notifications deleted on join");
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    socket.leave(connectedUser);
  });
});

app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
