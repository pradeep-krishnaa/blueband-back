const express = require('express');
const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

app.post('/test', (req, res) => {
  const { nmea } = req.body;

  if (!nmea) {
    return res.status(400).send('Bad Request: Missing NMEA data');
  }

  // Process the NMEA data...
  console.log('Received NMEA data:', nmea);

  res.send('NMEA data received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
