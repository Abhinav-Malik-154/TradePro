import React from 'react';

const TradeForm = () => {
  return (
    <div data-testid="mock-trade-form">
      <button>BUY</button>
      <button>SELL</button>
      <input placeholder="Price" />
      <input placeholder="Quantity" />
      <button>Buy BTC</button>
    </div>
  );
};

export default TradeForm;
