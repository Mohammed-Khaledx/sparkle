const mongoose = require("mongoose")


const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["follow", "spark", "comment", "mention"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, refPath: "targetModel" },
    targetModel: { type: String, enum: ["Post", "Comment"] },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
})


module.exports = mongoose.model("Notification", notificationSchema);