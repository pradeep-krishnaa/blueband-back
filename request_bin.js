const https = require("https")

const data = JSON.stringify({
  "test": "event"
})
console.log(data)
const options = {
  hostname: "eoc3fm75hs6f0nl.m.pipedream.net",
  port: 443,
  path: "/",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
}

const req = https.request(options)
req.write(data)
req.end()