import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trade.routes';
import authRoutes from './routes/auth.routes';
import faucetRoutes from './routes/faucet.routes';
import { connectDatabase } from './services/database.service';
import { WebSocketService } from './services/websocket.service';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in .env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// rate limiting
const authLimiter = rateLimit({
  windowMs: 60_000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down.' }
});
const tradeLimiter = rateLimit({
  windowMs: 60_000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down.' }
});

// Make WebSocket service available in routes
app.set('wsService', wsService);

// Routes (rate limiters applied before route handlers)
app.use('/api/auth',   authLimiter,  authRoutes);
app.use('/api/trades', tradeLimiter, tradeRoutes);
app.use('/api/faucet', faucetRoutes); // No rate limit for now (dev)

app.get('/', (_req, res) => {
  res.json({ message: 'Trading Platform API is running!' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server with database connection
const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('WebSocket server ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  wsService.cleanup();
  process.exit();
});

startServer();