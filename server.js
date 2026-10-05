import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { calculateEtsyProfit, calculateTargetPrice, COUNTRY_RATES } from './lib/etsyCalculator.js';
import { PRESETS } from './lib/presets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/extension', express.static(path.join(__dirname, 'extension')));

// API: Calculate Profit & Fees
app.post('/api/calculate', (req, res) => {
  try {
    const result = calculateEtsyProfit(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Calculate Target Pricing
app.post('/api/target-price', (req, res) => {
  try {
    const result = calculateTargetPrice(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Presets & Countries
app.get('/api/presets', (req, res) => {
  res.json({ success: true, data: { presets: PRESETS, countries: COUNTRY_RATES } });
});

// API: Bulk CSV calculation (Pro feature)
app.post('/api/bulk-calculate', (req, res) => {
  try {
    const { items = [] } = req.body;
    const calculated = items.map(item => ({
      name: item.name || 'Listing',
      ...calculateEtsyProfit(item)
    }));
    res.json({ success: true, data: calculated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Payment Checkout (Stripe / Lemon Squeezy ready)
app.post('/api/create-checkout', (req, res) => {
  const { plan = 'lifetime' } = req.body || {};
  
  if (process.env.CHECKOUT_URL) {
    return res.json({ success: true, checkoutUrl: process.env.CHECKOUT_URL });
  }

  // Instant demo activation
  const testLicenseKey = `ETSY-PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  res.json({
    success: true,
    mode: "demo",
    licenseKey: testLicenseKey,
    plan,
    message: "Configure CHECKOUT_URL in .env to connect live Stripe/Lemon Squeezy payments."
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EtsyProfit Pro', timestamp: new Date() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛍️ EtsyProfit Pro running at http://localhost:${PORT}`);
});
