import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trade.routes';
import { connectDatabase } from './services/database.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trades', tradeRoutes);

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
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();