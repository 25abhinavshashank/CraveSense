require('dotenv').config();

const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const cron = require('node-cron');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cravingRoutes = require('./routes/craving');
const foodRoutes = require('./routes/food');
const notificationRoutes = require('./routes/notification');
const patternRoutes = require('./routes/pattern');
const errorHandler = require('./middleware/errorHandler');
const { triggerDangerZoneWarningsJob } = require('./controllers/notificationController');

const dns=require('dns')
dns.setServers(["8.8.8.8","0.0.0.0"]);

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
    const isExtensionOrigin = origin.startsWith('chrome-extension://');

    if (allowedOrigins.includes(origin) || isExtensionOrigin) {
      callback(null, true);
      return;
    }

    const corsError = new Error(`CORS blocked for origin: ${origin}`);
    corsError.statusCode = 403;
    callback(corsError);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CraveSense API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/craving', cravingRoutes);
app.use('/api/pattern', patternRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/notification', notificationRoutes);

app.use((req, res, next) => {
  const error = new Error('Route not found.');
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

async function startServer() {
  await connectDB();

  cron.schedule('0 * * * *', () => {
    triggerDangerZoneWarningsJob().catch((error) => {
      console.error('Danger zone warning job failed:', error);
    });
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`CraveSense backend running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
