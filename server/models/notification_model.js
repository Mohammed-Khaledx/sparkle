const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["follow", "spark", "comment", "mention", "advice"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, refPath: "targetModel", required: true },
    targetModel: { type: String, enum: ["Post", "Comment"], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, {
    timestamps: true
})

module.exports = mongoose.model("Notification", notificationSchema);