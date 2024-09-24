const Express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const mqtt = require('mqtt');  // Import MQTT
require('dotenv').config();    // Import dotenv to load environment variables

const port = process.env.PORT || 3000;  // Use environment variable for port

const app = Express();
const server = http.Server(app);

const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST']
};

// Store car positions
const carPositions = new Map();

app.use(cors(corsOptions));
app.use(Express.json());

const trackCoordinates = [];

// Reading the CSV file containing track coordinates
fs.createReadStream('coordinates1.csv')
  .pipe(csv())
  .on('data', (row) => {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    trackCoordinates.push({ lat, lng });
  })
  .on('end', () => {
    console.log('CSV file successfully processed.');
  });

// MQTT Setup
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost');  // Use environment variable for MQTT broker URL

mqttClient.on('connect', () => {
  console.log('MQTT client connected.');
  mqttClient.subscribe('sim7600/nmea');  // Subscribe to the NMEA data topic
  mqttClient.subscribe('sim7600/sos');   // Subscribe to SOS alert topic
  mqttClient.subscribe('sim7600/ok');    // Subscribe to OK alert topic
});

// Convert degree format (DMS) to decimal format
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

function isPositionEqual(pos1, pos2, tolerance = 0.0001) {
  return Math.abs(pos1.lat - pos2.lat) < tolerance && 
         Math.abs(pos1.lng - pos2.lng) < tolerance;
}

// Parse NMEA string to extract location data
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

// Find the nearest track point to the current position
function findNearestTrackPoint(position) {
  let nearestPoint = trackCoordinates[0];
  let minDistance = Infinity;
  let index = 0;

  for (let i = 0; i < trackCoordinates.length; i++) {
    const point = trackCoordinates[i];
    const distance = Math.sqrt(
      Math.pow(position.latitude - point.lat, 2) + 
      Math.pow(position.longitude - point.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
      index = i;
    }
  }

  return { point: nearestPoint, index, distance: minDistance };
}

// MQTT Message Handler
mqttClient.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  if (topic === 'sim7600/nmea') {
    const { carId, nmea } = payload;

    if (!nmea || !carId) {
      console.warn("Invalid NMEA data received");
      return;
    }

    const parsedData = parseNMEA(nmea);
    if (!parsedData) {
      console.warn("Failed to parse NMEA data");
      return;
    }

    const currentPosition = carPositions.get(carId);
    const { point: nearestPoint, index: nearestIndex } = findNearestTrackPoint(parsedData);

    if (currentPosition && isPositionEqual(currentPosition, nearestPoint)) {
      return;
    }

    const updatedPosition = {
      carId,
      latitude: nearestPoint.lat,
      longitude: nearestPoint.lng,
      ...parsedData
    };

    carPositions.set(carId, updatedPosition);
    io.emit('locationUpdate', [updatedPosition]);  // Broadcast the update to clients
  }

  if (topic === 'sim7600/sos') {
    const { carId, message } = payload;
    const sosMessage = { carId, message, timestamp: new Date() };
    io.emit('sos', sosMessage);

    const carBehind = findCarBehind(carId);
    if (carBehind) {
      const warningMessage = {
        carId: carBehind.id,
        message: `Warning: Car ${carId} ahead has sent an SOS alert. Please proceed with caution.`,
        timestamp: new Date()
      };
      io.emit('warning', warningMessage);
    }
  }

  if (topic === 'sim7600/ok') {
    const { carId, message } = payload;
    const okMessage = { carId, message, timestamp: new Date() };
    io.emit('ok', [okMessage]);
  }
});

// Socket.IO setup for frontend communication
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  },
});

io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);
});

// Start the server
server.listen(port, () => {
  console.log("Server listening on port:", port);
});
