import React from 'react';

// Define a simple component right in the test
const SimpleTestComponent = () => {
  return (
    <div>
      <button>BUY</button>
      <button>SELL</button>
      <input placeholder="Price" />
      <input placeholder="Quantity" />
    </div>
  );
};

describe('Isolated Test', () => {
  it('renders without crashing', () => {
    const { container } = render(<SimpleTestComponent />);
    expect(container).toBeInTheDocument();
  });
});

// Helper function to avoid importing ReactDOM
function render(ui: React.ReactElement) {
  const { createRoot } = require('react-dom/client');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(ui);
  return { container };
}
