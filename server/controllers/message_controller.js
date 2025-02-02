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
    const sender = req.user.userId; // Extract from JWT

    if (!receiver || !content) {
      return res
        .status(400)
        .json({ error: "Receiver ID and message are required" });
    }

    // Save message to database
    const newMessage = await Message.create({ sender, receiver, content });
    // getting reciver name from user table and attaching it to the message content 
    // const user = await User.findById(sender);

    emitToUser(receiver, "message",  content, io);
    return res.status(201).json(newMessage);

  } catch (error) {
    res.status(500).json({ error: "Failed to send message"+ error });
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
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
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
  // markMessagesAsSeen
};
