const axios = require('axios');
let carData=[];
// let carData = [
//   {
//     carId: 1,
//     nmea: '1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0'
//   },
//   {
//     carId: 2,
//     nmea: '1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0'
//   },
//   {
//     carId: 3,
//     nmea: '1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0'
//   },
//   {
//     carId: 4,
//     nmea: '1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0'
//   },
//   {
//     carId: 5,
//     nmea: '1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0'
//   }
// ];
for(var i=1;i<=100;i++)
{
  const data={carId:i,nmea:'1106.071038,N,07658.135577,E,040724,164237.0,446.8,'+i+'.'+i+',0.0'}
  carData.push(data);
}

// Initial data for two cars
console.log(carData);
// Endpoint URL
const endpoint = 'https://blueband-bc-zr7gm6w4cq-el.a.run.app/track';
// const endpoint = 'https://blueband-server-zr7gm6w4cq-el.a.run.app/track';
// const endpoint = 'http://localhost:5000/track';

// Function to send data
const sendData = async (car) => {
  try {
    const response = await axios.post(endpoint, car);
    console.log(`Car ${car.carId}: Data sent successfully - Lat: ${car.latitude}, Long: ${car.longitude}`);
  } catch (error) {
    console.error(`Car ${car.carId}: Error sending data:`, error.message);
  }
};

// Function to slightly change car location
const updateLocation = (car) => {
  car.latitude += (Math.random() - 0.5) * 0.0001; // Small change in latitude
  car.longitude += (Math.random() - 0.5) * 0.0001; // Small change in longitude
};

// Send data for each car every half second
setInterval(() => {
  carData.forEach(car => {
    updateLocation(car);
    sendData(car);
  });
}, 3000); // 500 milliseconds = 0.5 seconds
