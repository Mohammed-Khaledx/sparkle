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
    .limit(20)
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent messages" });
  }
};

// // Update message status to "seen"
// const markMessagesAsSeen = async (req, res) => {
//   try {
//     const messageId = req.params;

//     // const { sender } = req.body;
//     // const receiver = req.user.userId;

//     const message = await Message.findOne({messageId})

//     console.log(sender ,"  " , receiver )
//     const sender = message.sender;
//     const receiver = req.user.userId;

//     await Message.updateMany(
//       { sender, receiver, read: false },
//       { read: true }
//     );

//     res.status(200).json({ message: "Messages marked as seen" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to update message status" });
//   }
// };

module.exports = {
  sendMessage,
  getMessages,
  getRecentMessages
};
