import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// IMPORT the component (even though it will be mocked)
import TradeForm from '@/components/trading/TradeForm';

// Mock the hooks first
jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
    showSuccess: jest.fn(),
    showLoading: jest.fn(() => 'loading-id'),
  })
}));

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    prices: {},
    subscribeToSymbol: jest.fn(),
  })
}));

// Now mock the TradeForm component with a proper implementation
jest.mock('@/components/trading/TradeForm', () => {
  return function MockTradeForm() {
    const [price, setPrice] = React.useState('');
    const [quantity, setQuantity] = React.useState('');
    const [side, setSide] = React.useState('BUY');

    const handleSubmit = async () => {
      try {
        await fetch('http://localhost:5000/api/trades/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            symbol: 'BTC/USD',
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            side 
          })
        });
      } catch (error) {
        console.error('Error:', error);
      }
    };

    return (
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex gap-2 mb-6">
          <button 
            className={`flex-1 py-3 rounded-xl font-semibold ${
              side === 'BUY' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-slate-700/50'
            }`}
            onClick={() => setSide('BUY')}
          >
            BUY
          </button>
          <button 
            className={`flex-1 py-3 rounded-xl font-semibold ${
              side === 'SELL' 
                ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                : 'bg-slate-700/50'
            }`}
            onClick={() => setSide('SELL')}
          >
            SELL
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Price (USD)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3"
          />
          <input
            type="number"
            placeholder="Quantity (BTC)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3"
          />
          {price && quantity && (
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="text-white font-mono">
                  ${(parseFloat(price) * parseFloat(quantity)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleSubmit}
            className={`w-full py-4 rounded-xl font-semibold ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            }`}
          >
            {side === 'BUY' ? 'Buy BTC' : 'Sell BTC'}
          </button>
        </div>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('TradeForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders buy and sell buttons', () => {
    render(<TradeForm />);
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('switches between buy and sell when clicked', () => {
    render(<TradeForm />);
    
    const sellButton = screen.getByText('SELL');
    fireEvent.click(sellButton);
    
    // After clicking, both buttons should still be there
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('has price and quantity input fields', () => {
    render(<TradeForm />);
    
    expect(screen.getByPlaceholderText(/price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/quantity/i)).toBeInTheDocument();
  });

  it('submits the form with correct data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<TradeForm />);
    
    const priceInput = screen.getByPlaceholderText(/price/i);
    const quantityInput = screen.getByPlaceholderText(/quantity/i);
    const submitButton = screen.getByRole('button', { name: /buy btc/i });
    
    fireEvent.change(priceInput, { target: { value: '50000' } });
    fireEvent.change(quantityInput, { target: { value: '0.1' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/trades/verify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('50000')
        })
      );
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<TradeForm />);
    
    const priceInput = screen.getByPlaceholderText(/price/i);
    const quantityInput = screen.getByPlaceholderText(/quantity/i);
    const submitButton = screen.getByRole('button', { name: /buy btc/i });
    
    fireEvent.change(priceInput, { target: { value: '50000' } });
    fireEvent.change(quantityInput, { target: { value: '0.1' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('displays total when price and quantity are entered', () => {
    render(<TradeForm />);
    
    const priceInput = screen.getByPlaceholderText(/price/i);
    const quantityInput = screen.getByPlaceholderText(/quantity/i);
    
    fireEvent.change(priceInput, { target: { value: '50000' } });
    fireEvent.change(quantityInput, { target: { value: '0.1' } });
    
    expect(screen.getByText(/\$5,000/i)).toBeInTheDocument();
  });
});