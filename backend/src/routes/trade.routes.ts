import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import Trade from '../models/Trade.model';
import User from '../models/User.model';

const router = Router();
const blockchainService = new BlockchainService();

// Test route
router.get('/test', (_req: Request, res: Response) => {
  return res.json({ 
    success: true, 
    message: 'Trade routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Verify a trade
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { symbol, price, quantity, side, userId, walletAddress } = req.body;
    
    if (!symbol || !price || !quantity || !side) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, price, quantity, side'
      });
    }
    
    const tradeData = {
      symbol,
      price,
      quantity,
      side,
      userId: userId || 'anonymous',
      walletAddress: walletAddress || null,
      timestamp: Date.now()
    };
    
    // Verify on blockchain
    const result = await blockchainService.verifyTrade(tradeData);
    
    // Save to database
    const newTrade = new Trade({
      userId: tradeData.userId,
      walletAddress: tradeData.walletAddress,
      symbol: tradeData.symbol,
      side: tradeData.side,
      price: tradeData.price,
      quantity: tradeData.quantity,
      tradeHash: result.tradeHash,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      verifiedAt: new Date()
    });
    
    await newTrade.save();
    console.log('💾 Trade saved to database');
    
    // Update or create user
    if (walletAddress) {
      await User.findOneAndUpdate(
        { walletAddress },
        { 
          $set: { lastLogin: new Date() },
          $setOnInsert: { 
            walletAddress,
            createdAt: new Date(),
            username: userId || null
          },
          $inc: { tradeCount: 1, totalVolume: price * quantity }
        },
        { upsert: true }
      );
    }
    
    return res.json({
      success: true,
      message: 'Trade verified on blockchain and saved to database',
      data: {
        ...result,
        dbId: newTrade._id
      }
    });
  } catch (error: any) {
    console.error('❌ Trade verification failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify trade'
    });
  }
});

// Get trade proof
router.get('/proof/:tradeHash', async (req: Request, res: Response) => {
  try {
    const tradeHashParam = req.params.tradeHash;
    const tradeHash = Array.isArray(tradeHashParam) ? tradeHashParam[0] : tradeHashParam;
    
    if (!tradeHash) {
      return res.status(400).json({
        success: false,
        error: 'Trade hash is required'
      });
    }
    
    // Get from blockchain
    const proof = await blockchainService.getTradeProof(tradeHash);
    
    // Also get from database if exists
    const dbTrade = await Trade.findOne({ tradeHash });
    
    return res.json({
      success: true,
      data: {
        blockchain: proof,
        database: dbTrade || null
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade proof:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade proof'
    });
  }
});

// Check if trade is verified
router.get('/verified/:tradeHash', async (req: Request, res: Response) => {
  try {
    const tradeHashParam = req.params.tradeHash;
    const tradeHash = Array.isArray(tradeHashParam) ? tradeHashParam[0] : tradeHashParam;

    if (!tradeHash) {
      return res.status(400).json({
        success: false,
        error: 'Trade hash is required'
      });
    }

    // Check on blockchain
    const isVerified = await blockchainService.isTradeVerified(tradeHash);
    
    // Check in database
    const dbTrade = await Trade.findOne({ tradeHash });
    
    return res.json({
      success: true,
      data: {
        tradeHash,
        isVerified,
        inDatabase: !!dbTrade,
        dbRecord: dbTrade || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check verification'
    });
  }
});

// Get trade history for a user
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Safely parse query parameters
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    
    // Convert to numbers safely
    let limit = 50;
    let offset = 0;
    
    if (typeof limitParam === 'string') {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // Cap at 100
      }
    }
    
    if (typeof offsetParam === 'string') {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const trades = await Trade.find({ userId })
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .skip(offset);
    
    const total = await Trade.countDocuments({ userId });
    
    return res.json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade history'
    });
  }
});

// Get trades by wallet address
router.get('/wallet/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    // Safely parse query parameters
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    
    // Convert to numbers safely
    let limit = 50;
    let offset = 0;
    
    if (typeof limitParam === 'string') {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100);
      }
    }
    
    if (typeof offsetParam === 'string') {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const trades = await Trade.find({ walletAddress })
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .skip(offset);
    
    const total = await Trade.countDocuments({ walletAddress });
    
    return res.json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get wallet trades:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet trades'
    });
  }
});

// Get stats (combined blockchain + database)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Blockchain stats
    let blockchainStats = null;
    try {
      blockchainStats = await blockchainService.getStats();
    } catch (error) {
      console.warn('⚠️ Could not fetch blockchain stats:', error);
      blockchainStats = { error: 'Blockchain stats unavailable' };
    }
    
    // Database stats
    const totalTradesDB = await Trade.countDocuments();
    const totalUsersDB = await User.countDocuments();
    const recentTrades = await Trade.find().sort({ verifiedAt: -1 }).limit(5);
    
    // Get volume stats
    const volumeStats = await Trade.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    return res.json({
      success: true,
      data: {
        blockchain: blockchainStats,
        database: {
          totalTrades: totalTradesDB,
          totalUsers: totalUsersDB,
          recentTrades,
          volume: volumeStats[0] || { totalVolume: 0, avgPrice: 0, totalQuantity: 0 }
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics'
    });
  }
});

// Get single trade by ID
router.get('/:tradeId', async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    
    const trade = await Trade.findById(tradeId);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    return res.json({
      success: true,
      data: trade
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade'
    });
  }
});

export default router;