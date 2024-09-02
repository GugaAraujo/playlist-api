const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  playlistCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Analysis", statsSchema);
