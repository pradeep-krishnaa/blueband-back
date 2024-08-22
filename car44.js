const Express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const port = process.env.PORT || 3000;

const app = Express();
const server = http.Server(app);

const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(Express.json());

function convertToDecimal(degreeString, direction) {
  const degreeLength = direction === 'N' || direction === 'S' ? 2 : 3;
  const degrees = parseInt(degreeString.slice(0, degreeLength));
  const minutes = parseFloat(degreeString.slice(degreeLength));
  let decimal = degrees + (minutes / 60);

  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

function parseNMEA(nmea) {
  const parts = nmea.split(',');
  
  if (parts.length < 9) {
    console.warn('Invalid NMEA data: insufficient parts');
    return null;
  }

  const [rawLat, latDirection, rawLon, lonDirection, date, time, altitude, speed, course] = parts;

  if (!rawLat || !latDirection || !rawLon || !lonDirection || !date || !time) {
    console.warn('Invalid NMEA data: missing required fields');
    return null;
  }

  if (!/^\d{4}\.\d+$/.test(rawLat) || !/^[NS]$/.test(latDirection)) {
    console.warn('Invalid NMEA data: invalid latitude');
    return null;
  }

  if (!/^\d{5}\.\d+$/.test(rawLon) || !/^[EW]$/.test(lonDirection)) {
    console.warn('Invalid NMEA data: invalid longitude');
    return null;
  }

  const latitude = convertToDecimal(rawLat, latDirection);
  const longitude = convertToDecimal(rawLon, lonDirection);

  return {
    latitude,
    longitude,
    altitude: parseFloat(altitude),
    speed: parseFloat(speed),
    course: parseFloat(course)
  };
}

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  },
});

app.post('/track', (req, res) => {
  try {
    console.log('Received data from SIM7600E-H:', req.body);

    const { nmea, carId } = req.body;
    if (!nmea || !carId) {
      res.status(400).json({ msg: "Invalid data received" });
      return;
    }

    const parsedData = parseNMEA(nmea);
    if (!parsedData) {
      res.status(400).json({ msg: "Invalid NMEA data" });
      return;
    }

    const record = { carId, ...parsedData };
    io.emit('locationUpdate', [record]);
    console.log('Emitted record:', record);
    res.status(200).json({ msg: "Location updated successfully" });
  } catch (err) {
    console.error('Error handling data:', err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.post('/sos', (req, res) => {
  const { carId, message } = req.body;
  const sosMessage = { carId, message, timestamp: new Date() };

  io.emit('sos', sosMessage);
  res.status(200).send({ message: 'SOS alert sent successfully' });
});

app.post('/ok', (req, res) => {
  const { carId, message } = req.body;
  const okMessage = { carId, message, timeStamp: new Date() };
  io.emit("ok", [okMessage]);
  console.log("OK status updated", carId);
  res.status(200).send([{ okMessage, message: `OK status updated ${carId}` }]);
});

io.on('connection', (socket) => {
  console.log("Connected to device", socket.id);
});

server.listen(port, () => {
  console.log("Listening at:", port);
});