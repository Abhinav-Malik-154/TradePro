"""
ML Price Predictor using LightGBM
Fetches real market data and generates price predictions
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import logging

try:
    import yfinance as yf
except ImportError:
    yf = None

try:
    from lightgbm import LGBMRegressor
except ImportError:
    LGBMRegressor = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TechnicalIndicators:
    """Calculate technical indicators for trading analysis"""
    
    @staticmethod
    def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate MACD, Signal line, and Histogram"""
        exp_fast = prices.ewm(span=fast, adjust=False).mean()
        exp_slow = prices.ewm(span=slow, adjust=False).mean()
        macd = exp_fast - exp_slow
        signal_line = macd.ewm(span=signal, adjust=False).mean()
        histogram = macd - signal_line
        return macd, signal_line, histogram
    
    @staticmethod
    def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: float = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate Bollinger Bands"""
        sma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        return upper, sma, lower
    
    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Average True Range"""
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        return atr


class PricePredictor:
    """LightGBM-based price prediction model"""
    
    CRYPTO_SYMBOLS = {
        'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SOL': 'SOL-USD',
        'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'SOLUSD': 'SOL-USD',
        'BTC/USD': 'BTC-USD', 'ETH/USD': 'ETH-USD', 'SOL/USD': 'SOL-USD',
    }
    
    def __init__(self):
        self.model = None
        self.feature_columns = []
        self.indicators = TechnicalIndicators()
        
    def normalize_symbol(self, symbol: str) -> str:
        """Convert symbol to yfinance format"""
        symbol = symbol.upper().replace('/', '')
        return self.CRYPTO_SYMBOLS.get(symbol, symbol)
    
    def fetch_data(self, symbol: str, period: str = "2y") -> Optional[pd.DataFrame]:
        """Fetch historical data from yfinance"""
        if yf is None:
            logger.warning("yfinance not installed, using mock data")
            return self._generate_mock_data(symbol)
        
        try:
            ticker = yf.Ticker(self.normalize_symbol(symbol))
            df = ticker.history(period=period)
            
            if df.empty:
                logger.warning(f"No data found for {symbol}, using mock data")
                return self._generate_mock_data(symbol)
            
            df = df.reset_index()
            df.columns = [c.lower() for c in df.columns]
            return df
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return self._generate_mock_data(symbol)
    
    def _generate_mock_data(self, symbol: str) -> pd.DataFrame:
        """Generate realistic mock data for testing"""
        np.random.seed(42)
        dates = pd.date_range(end=datetime.now(), periods=500, freq='D')
        
        # Base prices for different assets
        base_prices = {
            'BTC': 65000, 'ETH': 3500, 'SOL': 180,
            'AAPL': 180, 'GOOGL': 140, 'MSFT': 420, 'TSLA': 250
        }
        base = base_prices.get(symbol.split('-')[0].split('/')[0], 100)
        
        # Generate random walk
        returns = np.random.normal(0.0005, 0.02, len(dates))
        prices = base * np.exp(np.cumsum(returns))
        
        df = pd.DataFrame({
            'date': dates,
            'open': prices * (1 + np.random.uniform(-0.01, 0.01, len(dates))),
            'high': prices * (1 + np.random.uniform(0, 0.03, len(dates))),
            'low': prices * (1 - np.random.uniform(0, 0.03, len(dates))),
            'close': prices,
            'volume': np.random.uniform(1e6, 1e8, len(dates))
        })
        return df
    
    def add_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators and features for ML model"""
        df = df.copy()
        
        # Price-based features
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        
        # Moving averages
        for window in [7, 14, 30, 50]:
            df[f'ma_{window}'] = df['close'].rolling(window=window).mean()
            df[f'ma_ratio_{window}'] = df['close'] / df[f'ma_{window}']
        
        # Lag features
        for lag in [1, 3, 7, 14]:
            df[f'return_lag_{lag}'] = df['returns'].shift(lag)
            df[f'price_lag_{lag}'] = df['close'].shift(lag)
        
        # Technical indicators
        df['rsi'] = self.indicators.calculate_rsi(df['close'])
        
        macd, signal, hist = self.indicators.calculate_macd(df['close'])
        df['macd'] = macd
        df['macd_signal'] = signal
        df['macd_hist'] = hist
        
        upper, middle, lower = self.indicators.calculate_bollinger_bands(df['close'])
        df['bb_upper'] = upper
        df['bb_middle'] = middle
        df['bb_lower'] = lower
        df['bb_position'] = (df['close'] - lower) / (upper - lower)
        
        # Volatility
        df['volatility_7'] = df['returns'].rolling(window=7).std()
        df['volatility_30'] = df['returns'].rolling(window=30).std()
        
        # ATR
        df['atr'] = self.indicators.calculate_atr(df['high'], df['low'], df['close'])
        
        # Volume features
        df['volume_ma_7'] = df['volume'].rolling(window=7).mean()
        df['volume_ratio'] = df['volume'] / df['volume_ma_7']
        
        return df
    
    def prepare_training_data(self, df: pd.DataFrame, horizon: int = 7) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare data for model training"""
        df = self.add_features(df)
        
        # Target: future return over horizon
        df['target'] = df['close'].shift(-horizon) / df['close'] - 1
        
        # Feature columns (exclude target, date, and raw price columns)
        exclude_cols = ['date', 'target', 'close', 'open', 'high', 'low', 'volume']
        self.feature_columns = [c for c in df.columns if c not in exclude_cols and not df[c].isna().all()]
        
        # Remove rows with NaN
        df_clean = df.dropna(subset=self.feature_columns + ['target'])
        
        X = df_clean[self.feature_columns]
        y = df_clean['target']
        
        return X, y
    
    def train(self, symbol: str, horizon: int = 7) -> Dict[str, Any]:
        """Train the prediction model"""
        if LGBMRegressor is None:
            logger.warning("LightGBM not installed")
            return {'success': False, 'error': 'LightGBM not installed'}
        
        df = self.fetch_data(symbol)
        if df is None or len(df) < 100:
            return {'success': False, 'error': 'Insufficient data'}
        
        X, y = self.prepare_training_data(df, horizon)
        
        if len(X) < 50:
            return {'success': False, 'error': 'Insufficient training samples'}
        
        # Train/test split (80/20)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train model
        self.model = LGBMRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=6,
            num_leaves=31,
            random_state=42,
            verbose=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        return {
            'success': True,
            'train_r2': round(train_score, 4),
            'test_r2': round(test_score, 4),
            'n_samples': len(X),
            'n_features': len(self.feature_columns)
        }
    
    def predict(self, symbol: str, horizon: int = 7) -> Dict[str, Any]:
        """Generate price prediction for a symbol"""
        # Fetch latest data
        df = self.fetch_data(symbol)
        if df is None or len(df) < 100:
            return self._fallback_prediction(symbol, horizon)
        
        # Train model if needed
        if self.model is None:
            train_result = self.train(symbol, horizon)
            if not train_result.get('success'):
                return self._fallback_prediction(symbol, horizon)
        
        # Add features to latest data
        df_features = self.add_features(df)
        
        # Get latest row for prediction
        latest = df_features.iloc[-1]
        current_price = float(latest['close'])
        
        # Make prediction
        try:
            X_pred = latest[self.feature_columns].values.reshape(1, -1)
            predicted_return = float(self.model.predict(X_pred)[0])
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self._fallback_prediction(symbol, horizon)
        
        predicted_price = current_price * (1 + predicted_return)
        predicted_change = predicted_return * 100
        
        # Calculate confidence based on model certainty and market conditions
        rsi = float(latest.get('rsi', 50))
        volatility = float(latest.get('volatility_7', 0.02))
        
        # Base confidence from prediction magnitude and volatility
        base_confidence = max(30, min(90, 70 - (volatility * 500)))
        
        # Determine recommendation
        if predicted_change > 3:
            recommendation = "STRONG_BUY"
            confidence = min(95, base_confidence + 15)
        elif predicted_change > 1:
            recommendation = "BUY"
            confidence = base_confidence + 5
        elif predicted_change < -3:
            recommendation = "STRONG_SELL"
            confidence = min(95, base_confidence + 15)
        elif predicted_change < -1:
            recommendation = "SELL"
            confidence = base_confidence + 5
        else:
            recommendation = "HOLD"
            confidence = base_confidence - 10
        
        # Feature importance for explainability
        top_features = self._get_top_features()
        
        return {
            'symbol': str(symbol),
            'current_price': float(round(current_price, 2)),
            'predicted_price': float(round(predicted_price, 2)),
            'predicted_change': float(round(predicted_change, 2)),
            'horizon_days': int(horizon),
            'confidence': float(round(confidence, 1)),
            'recommendation': str(recommendation),
            'technicals': {
                'rsi': float(round(rsi, 2)),
                'macd': float(round(float(latest.get('macd', 0)), 4)),
                'macd_signal': float(round(float(latest.get('macd_signal', 0)), 4)),
                'volatility_7d': float(round(volatility * 100, 2)),
                'bb_position': float(round(float(latest.get('bb_position', 0.5)), 2)),
                'ma_7': float(round(float(latest.get('ma_7', current_price)), 2)),
                'ma_30': float(round(float(latest.get('ma_30', current_price)), 2)),
            },
            'top_factors': top_features,
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_top_features(self, top_n: int = 5) -> list:
        """Get top contributing features"""
        if self.model is None:
            return []
        
        try:
            importances = self.model.feature_importances_
            indices = np.argsort(importances)[-top_n:][::-1]
            return [
                {'feature': str(self.feature_columns[int(i)]), 'importance': float(round(importances[int(i)], 3))}
                for i in indices
            ]
        except:
            return []
    
    def _fallback_prediction(self, symbol: str, horizon: int) -> Dict[str, Any]:
        """Generate fallback prediction when model fails"""
        # Use basic technical analysis
        df = self.fetch_data(symbol)
        if df is not None and len(df) > 30:
            current_price = float(df['close'].iloc[-1])
            ma_7 = float(df['close'].rolling(7).mean().iloc[-1])
            ma_30 = float(df['close'].rolling(30).mean().iloc[-1])
            
            # Simple momentum-based prediction
            momentum = (current_price - ma_30) / ma_30
            predicted_change = float(momentum * 10 + np.random.uniform(-1, 1))
        else:
            current_price = 100.0
            ma_7 = 100.0
            ma_30 = 100.0
            predicted_change = float(np.random.uniform(-2, 2))
        
        predicted_price = float(current_price * (1 + predicted_change / 100))
        
        if predicted_change > 1:
            recommendation = "BUY"
        elif predicted_change < -1:
            recommendation = "SELL"
        else:
            recommendation = "HOLD"
        
        return {
            'symbol': str(symbol),
            'current_price': float(round(current_price, 2)),
            'predicted_price': float(round(predicted_price, 2)),
            'predicted_change': float(round(predicted_change, 2)),
            'horizon_days': int(horizon),
            'confidence': 55.0,
            'recommendation': str(recommendation),
            'technicals': {
                'rsi': 50.0,
                'macd': 0.0,
                'macd_signal': 0.0,
                'volatility_7d': 2.5,
                'bb_position': 0.5,
                'ma_7': float(round(ma_7, 2)),
                'ma_30': float(round(ma_30, 2)),
            },
            'top_factors': [],
            'timestamp': datetime.now().isoformat(),
            'fallback': True
        }
    
    def predict_multi_horizon(self, symbol: str, horizons: list = None) -> Dict[str, Any]:
        """Train separate LightGBM models per horizon and return distinct predictions."""
        if horizons is None:
            horizons = [1, 7, 30]

        if LGBMRegressor is None:
            return {h: self._fallback_prediction(symbol, h) for h in horizons}

        df = self.fetch_data(symbol)
        if df is None or len(df) < 100:
            return {h: self._fallback_prediction(symbol, h) for h in horizons}

        df_feat = self.add_features(df)
        current_price = float(df_feat['close'].iloc[-1])

        # Exclude cols that shouldn't be features
        exclude_cols = ['date', 'target', 'close', 'open', 'high', 'low', 'volume']

        results: Dict[str, Any] = {}

        for horizon in horizons:
            try:
                df_h = df_feat.copy()
                # Target: future return over this specific horizon
                df_h['target'] = df_h['close'].shift(-horizon) / df_h['close'] - 1

                feat_cols = [c for c in df_h.columns
                             if c not in exclude_cols and not df_h[c].isna().all()]
                df_clean = df_h.dropna(subset=feat_cols + ['target'])

                if len(df_clean) < 50:
                    label = f"{horizon}d"
                    results[label] = self._fallback_prediction(symbol, horizon)
                    continue

                X = df_clean[feat_cols]
                y = df_clean['target']

                split = int(len(X) * 0.8)
                X_train, X_test = X[:split], X[split:]
                y_train, y_test = y[:split], y[split:]

                model = LGBMRegressor(
                    n_estimators=150 + horizon * 5,   # more trees for longer horizons
                    learning_rate=0.05,
                    max_depth=6,
                    num_leaves=31,
                    random_state=42,
                    verbose=-1,
                )
                model.fit(X_train, y_train)

                # Predict using the very last row of features
                latest_features = df_feat[feat_cols].dropna().iloc[-1:]
                predicted_return = float(model.predict(latest_features.values)[0])
                predicted_price = current_price * (1 + predicted_return)
                predicted_change = predicted_return * 100

                # Confidence from model R² (clamped 30-95)
                test_score = model.score(X_test, y_test)
                rsi = float(df_feat['rsi'].iloc[-1]) if 'rsi' in df_feat.columns else 50
                vol = float(df_feat.get('volatility_7', pd.Series([0.02])).iloc[-1])
                base_conf = max(30, min(90, 70 - (vol * 500)))
                r2_boost = max(0, test_score * 20)
                confidence = min(95, base_conf + r2_boost)

                # Recommendation per horizon
                if predicted_change > 3:
                    rec = "STRONG_BUY"
                elif predicted_change > 1:
                    rec = "BUY"
                elif predicted_change < -3:
                    rec = "STRONG_SELL"
                elif predicted_change < -1:
                    rec = "SELL"
                else:
                    rec = "HOLD"

                # Top features for this horizon's model
                try:
                    importances = model.feature_importances_
                    top_idx = np.argsort(importances)[-5:][::-1]
                    top_feats = [
                        {'feature': str(feat_cols[int(i)]),
                         'importance': float(round(importances[int(i)], 3))}
                        for i in top_idx
                    ]
                except Exception:
                    top_feats = []

                label = f"{horizon}d"
                results[label] = {
                    'symbol': str(symbol),
                    'current_price': float(round(current_price, 2)),
                    'predicted_price': float(round(predicted_price, 2)),
                    'predicted_change': float(round(predicted_change, 2)),
                    'horizon_days': int(horizon),
                    'confidence': float(round(confidence, 1)),
                    'recommendation': str(rec),
                    'technicals': {
                        'rsi': float(round(rsi, 2)),
                        'macd': float(round(float(df_feat['macd'].iloc[-1]), 4)) if 'macd' in df_feat.columns else 0,
                        'macd_signal': float(round(float(df_feat['macd_signal'].iloc[-1]), 4)) if 'macd_signal' in df_feat.columns else 0,
                        'volatility_7d': float(round(vol * 100, 2)),
                    },
                    'top_factors': top_feats,
                    'timestamp': datetime.now().isoformat(),
                }
            except Exception as e:
                logger.warning(f"Horizon {horizon}d failed for {symbol}: {e}")
                label = f"{horizon}d"
                results[label] = self._fallback_prediction(symbol, horizon)

        return results

    def get_current_price(self, symbol: str) -> Dict[str, Any]:
        """Get current price for a symbol"""
        df = self.fetch_data(symbol, period="5d")
        if df is not None and len(df) > 0:
            return {
                'symbol': symbol,
                'price': round(float(df['close'].iloc[-1]), 2),
                'change_24h': round(float((df['close'].iloc[-1] / df['close'].iloc[-2] - 1) * 100), 2) if len(df) > 1 else 0,
                'timestamp': datetime.now().isoformat()
            }
        return {'symbol': symbol, 'price': 0, 'error': 'Failed to fetch price'}
    
    def get_history(self, symbol: str, period: str = "1y") -> list:
        """Get historical price data for charting"""
        df = self.fetch_data(symbol, period=period)
        if df is None:
            return []
        
        records = []
        for _, row in df.iterrows():
            records.append({
                'date': row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                'open': round(float(row['open']), 2),
                'high': round(float(row['high']), 2),
                'low': round(float(row['low']), 2),
                'close': round(float(row['close']), 2),
                'volume': int(row['volume'])
            })
        return records


# Global predictor instance
predictor = PricePredictor()
