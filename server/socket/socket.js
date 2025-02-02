// socket.js

require("dotenv").config();

const { Server } = require("socket.io");

let io = null;



// In-memory map to track active users
// this will be a userid as a key and array of its devices socket id
// in case he is opening from more than one device

// TODO
// Future improvement:
// Replace in-memory `activeUsers` with Redis for distributed and scalable user tracking.
// Redis can store userId as the key and a list of socketIds as the value.


const activeUsers = new Map();

function initializeSocket(httpServer) {
   io = new Server(httpServer, {
    cors: {
      origin: "*", // the origin should be the frontend url
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // socket here is object from socket io representing the individual client connection

    console.log("New socket connected:", socket.id);

    // Authentication middleware for socket

    // The handshake property of the socket object contains information about the initial handshake that established the WebSocket connection. 
    // This includes things like headers, query parameters, and authentication data.
    const token = socket.handshake.auth.token;
    let userId;

    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log(decoded)
      userId = decoded.userId;

      // Add socket to the activeUsers map if exist
      if (!userId) throw new Error("user not authenticated");

      // else
      addUser(userId, socket.id);

      console.log(`User ${userId} connected. Active users:`, activeUsers);
    } catch (err) {
      console.log("Invalid or missing token:", err.message);
      socket.disconnect();
      return;
    }

    // Handle socket disconnection
    // inside the connection event to just work with correctly connected users
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      removeUser(socket.id);
      console.log(`Updated active users:`, activeUsers);
    });
  });

  return io;
}

// Emit a notification to a specific user and handle all his devices

const emitToUser = (userId, event, data) => {
  // console.log(userId,event,data)
  const sockets = getUserSockets(userId);
  if (sockets.length > 0) {
    // more than one device
    sockets.forEach((socketid) => {
      io.to(socketid).emit(event, data);
    });
  } else {
    console.log(`User ${userId} is offline. Event not delivered.`);
  }
};

// Broadcast an event to all connected users
const broadcastToAll = (event, data, io) => {
  const users = getAllUsers();
  users.forEach((userId) => {
    const sockets = getUserSockets(userId);
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  });
};


// Add a user to the map
const addUser = (userId, socketId) => {
  // if the user is not already there in the array
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, []);
  }
  // if the user is already connected but this is his second device
  activeUsers.get(userId).push(socketId);
};

// Remove a user from the map
const removeUser = (socketId) => {
  for (const [userId, sockets] of activeUsers.entries()) {
    const updatedSockets = sockets.filter((id) => id !== socketId);
    if (updatedSockets.length === 0) {
      activeUsers.delete(userId);
    } else {
      activeUsers.set(userId, updatedSockets);
    }
  }
};

// Fetch all sockets for a user
// Using a Map provides O(1) average time complexity for lookups
const getUserSockets = (userId) => {
  return activeUsers.get(userId) || []
};

// Get all connected users
const getAllUsers = () => [...activeUsers.keys()];

module.exports = {
  initializeSocket,
  emitToUser,
};
