const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const dgram = require('dgram');

// Configure UDP server address and port
const UDP_PORT = process.env.PORT || 8080;  // UDP port number, match this with your Maduino setup
const port = process.env.PORT || 3000
// Create a UDP socket
const udpServer = dgram.createSocket('udp4');

// Bind UDP socket to listen on UDP_PORT
udpServer.bind(UDP_PORT, () => {
  console.log(`UDP server is listening on port ${UDP_PORT}...`);
});

// Handle incoming UDP messages
udpServer.on('message', (msg, rinfo) => {
  console.log(`Received UDP data from ${rinfo.address}:${rinfo.port}: ${msg.toString()}`);
  // Process the received data as needed
  // Example: emit the data via Socket.IO to connected clients
  io.emit('udpData', msg.toString());
});

// Express route to serve HTML with Socket.IO client script
app.get('/', (req, res) => {
  console.log("/ request.");
  res.send("ok")
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A client connected');

  // Example Socket.IO event handling
  socket.on('chat message', (msg) => {
    console.log('Message: ' + msg);
    io.emit('chat message', msg);
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start HTTP server
http.listen(port, () => {
  console.log(`HTTP server is listening on :${port}`);
});