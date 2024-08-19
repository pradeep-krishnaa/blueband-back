const { MongoClient, ServerApiVersion } = require("mongodb");
const Express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config()
const app = Express();
const server = http.createServer(app);

// Set up CORS options for Express
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only your frontend origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions)); // Use CORS middleware
app.use(Express.json()); // Middleware to parse JSON bodies

async function delay() {
  return new Promise(resolve => { 
      setTimeout(() => { resolve('') }, 500); 
  }) 
}

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow only your frontend origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const uri = process.env.MONGODB_URI

const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database, collection;

app.get("/data", async (request, response) => {
  try {
    const results = await collection.find({}).limit(5).toArray();
    response.send(results);
  } catch (error) {
    response.status(500).send({ "message": error.message });
  }
});

// Endpoint to handle SOS alerts
app.post('/sos', (request, response) => {
  const { carId, message } = request.body;
  const sosMessage = { carId, message, timestamp: new Date() };
  
  io.emit('sos', sosMessage);
  response.status(200).send({ message: 'SOS alert sent successfully' });
});

server.listen(5000, async () => {
  try {
    await mongoClient.connect();
    database = mongoClient.db("myapp");
    collection = database.collection("mycollection");
    console.log("Listening at :5000");
    loadDataFromCSV();
    await delay();
    loadDataFromCSV2();
    
  } catch (error) {
    console.error(error);
  }
});

// Load data from CSV and emit via Socket.IO
function loadDataFromCSV() {
  const results = [];

  fs.createReadStream('race.csv')
    .pipe(csv({ separator: '\t' })) // Specify tab as the delimiter
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let index = 1; // Start from the second row

      setInterval(async () => {
        if (index >= results.length) index = 1; // Loop back to the start of the data

        const entry = results[index];
        const ass = entry['latitude,longitude'].split(',');
        const latitude = parseFloat(ass[0]);
        const longitude = parseFloat(ass[1]);

        // Check if latitude and longitude are valid numbers
        if (!isNaN(latitude) && !isNaN(longitude)) {
          const carId = 1; // Generate a car ID based on the index
          const status = "offline";
          const newEntry = { carId, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), timestamp: new Date() };
        

          try {
            // await collection.insertOne(newEntry);
            io.emit('locationUpdate', newEntry);
            
            console.log(`Emitted data: Car ID ${carId}, Lat ${latitude}, Long ${longitude}`);
          } catch (error) {
            console.error('Error saving data to MongoDB', error);
          }
        } else {
          console.error('Invalid latitude or longitude value');
        }

        index++;
      }, 1000); // Emit data every second
    });
}

function loadDataFromCSV2() {
  const results = [];

  fs.createReadStream('race.csv')
    .pipe(csv({ separator: '\t' })) // Specify tab as the delimiter
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let index = 1; // Start from the second row

      setInterval(async () => {
        if (index >= results.length) index = 1; // Loop back to the start of the data

        const entry = results[index];
        const ass = entry['latitude,longitude'].split(',');
        const latitude = parseFloat(ass[0]);
        const longitude = parseFloat(ass[1]);

        // Check if latitude and longitude are valid numbers
        if (!isNaN(latitude) && !isNaN(longitude)) {
          const carId = 2; // Generate a car ID based on the index
          const status = "offline";
          const newEntry = { carId, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), timestamp: new Date() };
          

          try {
            // await collection.insertOne(newEntry);
            io.emit('locationUpdate', newEntry);
           
            console.log(`Emitted data: Car ID ${carId}, Lat ${latitude}, Long ${longitude}`);
          } catch (error) {
            console.error('Error saving data to MongoDB', error);
          }
        } else {
          console.error('Invalid latitude or longitude value');
        }

        index++;
      }, 1000); // Emit data every second
    });
}