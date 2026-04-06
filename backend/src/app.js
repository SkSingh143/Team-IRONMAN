const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy required for express-rate-limit when hosted behind a reverse proxy (e.g., Railway)
app.set('trust proxy', 1);

app.use(cors({
  origin: function (origin, callback) {
    // Permit ALL incoming network requests for local LAN testing
    callback(null, true);
  },
  credentials: true, // REQUIRED for cookies
}));

app.use(express.json());
app.use(cookieParser());

// Routes will be added in Phase 2/3
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
