require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  // WebSocket Server will be added in Phase 4
  // initWS(server);

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => { 
  console.error(err); 
  process.exit(1); 
});
