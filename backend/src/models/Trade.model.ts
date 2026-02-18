import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  tradeHash: string;
  transactionHash: string;
  blockNumber: number;
  verifiedAt: Date;
}

const TradeSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  tradeHash: { type: String, required: true, unique: true },
  transactionHash: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  verifiedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITrade>('Trade', TradeSchema);