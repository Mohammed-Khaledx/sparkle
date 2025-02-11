const express = require("express");
const { sendMessage, getMessages, getRecentMessages
    // markMessagesAsSeen 
} = require("../controllers/message_controller");
const auth = require("../middlewares/auth");

const router = express.Router();

// Send a message
router.post("/", auth, sendMessage);

// Get messages between two users
router.get("/:otherUserId", auth, getMessages);
router.get("/recent",   auth, getRecentMessages);

// Mark messages as seen
// router.patch("/seen/:messageId", auth, markMessagesAsSeen);

module.exports = router;
