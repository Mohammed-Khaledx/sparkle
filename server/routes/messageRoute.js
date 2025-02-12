const express = require("express");
const { 
  sendMessage, 
  getMessages, 
  getRecentMessages, 
  markMessagesAsSeen 
} = require("../controllers/message_controller");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/recent", auth, getRecentMessages);
router.get("/:otherUserId", auth, getMessages);
router.post("/", auth, sendMessage);
router.patch("/seen/:messageId", auth, markMessagesAsSeen); // Now properly exported

module.exports = router;
