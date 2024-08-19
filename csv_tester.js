const express = require('express');
const fs = require('fs'); // File system module for reading CSV

const app = express();
const port = 3000;

app.get('/csv-data', (req, res) => {
  const filePath = 'Silverstone.csv'; // Replace with your actual CSV file path

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV:', err);
      return res.status(500).send('Error reading CSV file');
    }
    
    const lines = data.split('\n');

    // Check if CSV has headers
    const hasHeaders = lines[0].split(',').includes('x_m') && lines[0].split(',').includes('y_m');

    // Skip header row if it exists
    const dataRows = lines.slice(hasHeaders ? 1 : 0);

    if (dataRows.length === 0) {
      return res.status(400).send('CSV file is empty or missing required columns');
    }

    const firstRow = dataRows[1].split(',');
    const xValue = firstRow[hasHeaders ? firstRow.indexOf('x_m') : 0];
    const yValue = firstRow[hasHeaders ? firstRow.indexOf('y_m') : 1];

    console.log(`x_m: ${xValue}, y_m: ${yValue}`); // Log first row values

    // You can further process the dataRows here for subsequent rows

    res.send('CSV data processed successfully');
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
