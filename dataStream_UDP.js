const dgram = require('dgram');
const dns = require('dns');

const server_domain = 'blueband-backend.onrender.com'; // Replace with your domain name
const server_port = 8080; // Replace with the port your server is listening on

function resolveAndSendUDP(data) {
  dns.lookup(server_domain, (err, address, family) => {
    if (err) {
      console.error('Error resolving domain name:', err);
      return;
    }

    const server_ip = address;

    const message = Buffer.from(data);

    const client = dgram.createSocket('udp4');
    // setInterval(() => {
      client.send(message, 0, message.length, server_port, server_ip, (err) => {
        if (err) {
          console.error('Error sending UDP message:', err);
        } else {
          console.log('UDP message sent successfully');
        }
        client.close();
      });
    // }, 2000);

  });
}

// Example data to send
const data = JSON.stringify({"carId":1,"nmea":"1106.071038,N,07658.135577,E,040724,164237.0,446.8,0.0,0.0"});

resolveAndSendUDP(data);
