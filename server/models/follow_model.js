const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who is following
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who is being followed
}, { timestamps: true });

// Ensure uniqueness of follower-following pairs 
// this mean there no reapeated rows

// adding indexing: indexing is ultra fast while try to findOne with mongo
// wich is in normal mongo witout undexing will iterate all over the data 
// but if index it could access it directlt 
followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);