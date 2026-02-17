// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Fixed: Added underscore to unused parameter
// app.get('/', (_req, res) => {
//   res.json({ message: 'Trading Platform API is running!' });
// });

// // Health check endpoint
// app.get('/health', (_req, res) => {
//   res.status(200).json({ status: 'OK' });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });




// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import dotenv from 'dotenv';
// import tradeRoutes from './routes/trade.routes';  // ← ADD THIS

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/api/trades', tradeRoutes);  // ← ADD THIS

// app.get('/', (_req, res) => {
//   res.json({ message: 'Trading Platform API is running!' });
// });

// app.get('/health', (_req, res) => {
//   res.status(200).json({ status: 'OK' });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });



import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trade.routes';  // ← MUST have this import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes - MUST have this line!
app.use('/api/trades', tradeRoutes);  // ← This registers all /api/trades/* routes

app.get('/', (_req, res) => {
  res.json({ message: 'Trading Platform API is running!' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});