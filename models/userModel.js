const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    pic: {
      type: String,
      default: "",
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      required: true,
    },
    notifications: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
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
    ],
  },
  {
    timestamps: true,
  }
);

// userSchema.methods.matchPassword = async function (pass) {
//   return await bcrypt.compare(pass, this.password);
// };

// userSchema.pre("save", async function (next) {
//   if (!this.isModified) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

const User = mongoose.model("User", userSchema);

module.exports = User;
