#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 VERIFYING TRADING PLATFORM"
echo "=============================="

# Test 1: Backend Health
echo -n "1. Backend Health: "
if curl -s http://localhost:5000/health | grep -q "OK"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test 2: MongoDB Connection
echo -n "2. MongoDB Connection: "
cd backend
if node -e "require('./src/services/database.service').testConnection()" 2>/dev/null | grep -q "✅"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi
cd ..

# Test 3: Trade Routes
echo -n "3. Trade Routes: "
if curl -s http://localhost:5000/api/trades/test | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test 4: Verify a Trade
echo -n "4. Trade Verification: "
RESPONSE=$(curl -s -X POST http://localhost:5000/api/trades/verify \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSD","price":50000,"quantity":0.1,"side":"BUY","userId":"testuser"}')
if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
  TRADE_HASH=$(echo "$RESPONSE" | grep -o '"tradeHash":"[^"]*' | cut -d'"' -f4)
  echo "   Trade Hash: $TRADE_HASH"
else
  echo -e "${RED}❌${NC}"
fi

# Test 5: Database Storage
echo -n "5. Database Storage: "
if [ ! -z "$TRADE_HASH" ]; then
  if curl -s "http://localhost:5000/api/trades/verified/$TRADE_HASH" | grep -q "inDatabase.*true"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌${NC}"
  fi
else
  echo -e "${RED}❌ (No trade hash)${NC}"
fi

# Test 6: Trade History
echo -n "6. Trade History: "
if curl -s "http://localhost:5000/api/trades/history/testuser?limit=5" | grep -q "trades"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test 7: Stats Endpoint
echo -n "7. Stats Endpoint: "
if curl -s http://localhost:5000/api/trades/stats | grep -q "success"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

echo "=============================="
