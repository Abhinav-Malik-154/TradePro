import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';

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
    const { symbol, price, quantity, side, userId } = req.body;
    
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
      timestamp: Date.now()
    };
    
    const result = await blockchainService.verifyTrade(tradeData);
    
    return res.json({
      success: true,
      message: 'Trade verified on blockchain',
      data: result
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
    const { tradeHash } = req.params;
    
    if (!tradeHash || tradeHash.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Trade hash is required'
      });
    }
    
    const proof = await blockchainService.getTradeProof(Array.isArray(tradeHash) ? tradeHash[0] : tradeHash);
    
    return res.json({
      success: true,
      data: proof
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
    const tradeHash = Array.isArray(req.params.tradeHash) ? req.params.tradeHash[0] : req.params.tradeHash;

if (!tradeHash) {
  return res.status(400).json({
    success: false,
    error: 'Trade hash is required'
  });
}

const isVerified = await blockchainService.isTradeVerified(tradeHash);

    

    
    
    return res.json({
      success: true,
      data: {
        tradeHash,
        isVerified
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check verification'
    });
  }
});

// Get stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await blockchainService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('❌ Failed to get stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get contract statistics'
    });
  }
});

export default router;