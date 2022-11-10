const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);
    // const con = await mongoose.connect("mongodb://localhost/stchat");

    console.log("Mongodb connected: ", con.connection.host);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
