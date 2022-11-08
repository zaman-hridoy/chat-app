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

// config
dotenv.config();
app.use(cors());
app.use(express.json());

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

app.use(notFound);
app.use(errorHandler);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
  pingTimeout: 60000,
});

io.on("connection", (socket) => {
  console.log("Connected to soket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join_chat", (room) => {
    socket.join(room);
    console.log("User joined room", room);
  });

  // typing
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop_typing", (room) => socket.in(room).emit("stop_typing"));

  socket.on("new_message", (newMgs) => {
    let chat = newMgs.chat;
    if (!chat.users) return;
    chat.users.forEach((user) => {
      if (user._id === newMgs.sender._id) return;

      socket.in(user._id).emit("mgs_received", newMgs);
    });
  });

  socket.off("setup", () => {
    console.log("user disconnected");
    socket.leave(userData._id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
