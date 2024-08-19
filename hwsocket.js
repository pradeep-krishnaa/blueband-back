const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions)); // Use CORS middleware
app.use(express.json()); // Middleware to parse JSON bodies

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  },
});

// Socket event listener
io.on('connection', (socket) => {
  console.log('A device connected');

  // Handle incoming data via socket
  socket.on('data', async (data) => {
    try {
      console.log('Received data from device via socket:', data);
      const { latitude, longitude } = data;
        console.log(data.latitude,longitude);
      const otherEndpoint = 'https://blueband-backend.onrender.com/track';
      const dataToSend = { carId: 69, latitude:11.15, longitude:76.51 };

    //   const response = await axios.post(otherEndpoint, dataToSend);
      
    //   console.log('Response from other endpoint:', latitude,longitude);

      socket.emit('locationUpdate', [dataToSend]);
      // Emit acknowledgment or further instructions if needed
      socket.emit('ack', { message: 'Data received and forwarded successfully.' });
    } catch (err) {
      console.error('Error handling data:', err);
      socket.emit('error', { message: "Internal Server Error" });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Device disconnected');
  });
});

// Endpoint to receive data from SIM7600E-H module
app.post('/test', async (req, res) => {
  try {
    console.log('Received data from SIM7600E-H:', req.body);
    const { latitude, longitude } = req.body;

    const otherEndpoint = 'https://blueband-backend.onrender.com/track';
    const dataToSend = { carId: 44, latitude, longitude };

    const response = await axios.post(otherEndpoint, dataToSend);

    console.log('Response from other endpoint:', response.data);

    res.status(200).send('Data received and forwarded successfully.');
  } catch (err) {
    console.error('Error handling data:', err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.post('/track', (request, response) => {
  try {
    const { carId, latitude, longitude } = request.body;
    const record = { carId, latitude, longitude };

    if (typeof carId === 'undefined') {
      response.status(300).json({ msg: "CarID Undefined" });
      return;
    }
    io.emit('locationUpdate', [record]);
    console.log(record);
    response.status(200).json({ msg: "Location updated successfully" });
  } catch (err) {
    response.status(400).json({ msg: "Internal Server Error" });
  }
});

app.get('/track', (request, response) => {
  try {
    const { carId, latitude, longitude } = request.query;
    const record = { carId, latitude, longitude };

    if (typeof carId === 'undefined') {
      response.status(300).json({ msg: "CarID Undefined" });
      return;
    }
    io.emit('locationUpdate', [record]);
    console.log(record);
    response.status(200).json({ msg: "Location updated successfully" });
  } catch (err) {
    response.status(400).json({ msg: "Internal Server Error" });
  }
});

app.post('/sos', (request, response) => {
  const { carId, message } = request.body;
  const sosMessage = { carId, message, timestamp: new Date() };

  io.emit('sos', sosMessage);
  response.status(200).send({ message: 'SOS alert sent successfully' });
});

app.post('/ok', (request, response) => {
  const { carId, message } = request.body;
  const okMessage = { carId, message, timeStamp: new Date() };
  io.emit("ok", [okMessage]);
  console.log("OK status updated", carId);
  response.status(200).send([{ okMessage, message: `OK status updated ${carId}` }]);
});

server.listen(443, () => {
  console.log("Listening at :443");
});
