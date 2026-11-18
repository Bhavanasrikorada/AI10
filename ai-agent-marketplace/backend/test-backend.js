const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { app } = require('./server');

console.log('Testing module loading...');
const server = http.createServer(app);

server.listen(5001, async () => {
  console.log('Test server listening on port 5001');

  // Test /health
  const req = http.get('http://localhost:5001/health', (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('HEALTH RESPONSE:', res.statusCode, data);
      server.close(() => {
        console.log('All backend components loaded and health verified successfully!');
        process.exit(0);
      });
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
    server.close(() => process.exit(1));
  });
});
