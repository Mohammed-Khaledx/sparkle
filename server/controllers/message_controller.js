const Message = require("../models/message_model");


// socket io controller
const { io } = require("../index"); // Import the io instance
const { emitToUser } = require("../socket/socket");

// in all of this function you may notice that
// all senderid is extrated from req.user.userId
// and all of this came from JWT auth middle-ware

// Notice that the reciver here is extracted from the body
// but we an have a diffrent way to do that by sending the reciver id
// in the params

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.userId;

    if (!receiver || !content) {
      return res.status(400).json({ 
        error: "Receiver ID and message content are required" 
      });
    }

    // Create and populate the new message
    const newMessage = await Message.create({ 
      sender, 
      receiver, 
      content 
    });

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    // Emit real-time notification
    emitToUser(receiver, "message", populatedMessage, io);
    
    return res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message: " + error });
  }
};

// Get conversation between two users
const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

const getRecentMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get recent messages for the user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .limit(20);

    if (!messages) {
      return res.status(200).json({ messages: [] });
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ error: "Failed to fetch recent messages" });
  }
};

// Uncomment and fix the markMessagesAsSeen function
const markMessagesAsSeen = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as read if user is the receiver
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to mark this message as read" });
    }

    message.read = true;
    await message.save();

    res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getRecentMessages,
  markMessagesAsSeen  // Make sure to export the function
};
