const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");


const http = require("http"); // Required for creating a server
const server = http.createServer(app);
const { initializeSocket } = require("./socket/socket");
const io = initializeSocket(server);

module.exports = {io};




require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// For serving static files

// Status route
app.get("/status", (req, res) => {
  res.json({
    socketio: !!io,
    connections: io.engine?.clientsCount || 0,
    status: "running",
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Debug events
io.engine.on("connection_error", (err) => {
  console.log("Connection Error:", err);
});

// this is listening for the user connect from the frontend
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on('error', (error) => {
//     console.error('Socket error:', error);
//   });

//   // When a user authenticates, store their socket
//   // and this is emmited from the front end after successfull sign-in
//   socket.on("register", (userId) => {
//     activeUsers[userId] = socket.id;
//     console.log("Registered user:", userId, "Socket ID:", socket.id);
//   });

//   socket.on("message", (data) => {
//     console.log("Received:", data);
//     socket.emit("response", `Server received: ${data}`);
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     const userId = Object.keys(activeUsers).find(
//       (key) => activeUsers[key] === socket.id
//     );
//     if (userId) {
//       delete activeUsers[userId];
//       console.log(`User ${userId} disconnected`);
//     }
//   });
// });


async function mongoConnect() {
  try {
    const state = await mongoose.connect(
      "mongodb://127.0.0.1:27017/sparky_platfrom_db"
    );
    console.log("db connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}
mongoConnect();


// setup routes
const user_route = require("./routes/userRoute");
app.use("/users", user_route);

const followOrUnfollow_Route = require("./routes/followOrUnfollowRoute");
app.use("/followOrUnfollow", followOrUnfollow_Route);

const post_route = require("./routes/postRoute");
app.use("/posts", post_route);

const notification_route = require("./routes/notificationRoute");
app.use("/notifications", notification_route);

const messageRoutes = require("./routes/messageRoute");
app.use("/messages", messageRoutes);

// 404 Not Found Middleware
app.use((req, res, next) => {
  console.log(`404 Error: ${req.method} ${req.url} not found`); // Log before sending response
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
    path: req.originalUrl,
  });
});

// Global Error Handler (should be last middleware)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// from server connect to routes throw specific route path "./path"
// then go to the route then import express to use the requests [get ,post]
