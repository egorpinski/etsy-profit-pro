// EtsyProfit Pro — Client-side Real-time Calculator Logic

let presetsData = {};
let currentCurrency = "$";

const elements = {
  itemPrice: document.getElementById('itemPrice'),
  shippingCharge: document.getElementById('shippingCharge'),
  itemCost: document.getElementById('itemCost'),
  shippingCost: document.getElementById('shippingCost'),
  offsiteAds: document.getElementById('offsiteAds'),
  etsyAdsCost: document.getElementById('etsyAdsCost'),
  countrySelect: document.getElementById('countrySelect'),
  targetMarginSlider: document.getElementById('targetMarginSlider'),
  
  // Displays
  netProfitDisplay: document.getElementById('netProfitDisplay'),
  marginBadge: document.getElementById('marginBadge'),
  breakEvenDisplay: document.getElementById('breakEvenDisplay'),
  totalFeesDisplay: document.getElementById('totalFeesDisplay'),
  roiDisplay: document.getElementById('roiDisplay'),
  recommendedPriceDisplay: document.getElementById('recommendedPriceDisplay'),
  sliderMarginText: document.getElementById('sliderMarginText'),
  targetMarginLabel: document.getElementById('targetMarginLabel'),
  takeRateBadge: document.getElementById('takeRateBadge'),

  // Bar
  barProfit: document.getElementById('barProfit'),
  barFees: document.getElementById('barFees'),
  barCosts: document.getElementById('barCosts'),
  barProfitLabel: document.getElementById('barProfitLabel'),
  barFeesLabel: document.getElementById('barFeesLabel'),
  barCostsLabel: document.getElementById('barCostsLabel'),

  // Accordion fees
  feeListing: document.getElementById('feeListing'),
  feeTransaction: document.getElementById('feeTransaction'),
  feePayment: document.getElementById('feePayment'),
  feeOffsiteAds: document.getElementById('feeOffsiteAds'),
  feeSellerCosts: document.getElementById('feeSellerCosts'),

  // Badges
  itemPriceBadge: document.getElementById('itemPriceBadge'),
  shippingChargeBadge: document.getElementById('shippingChargeBadge'),
  itemCostBadge: document.getElementById('itemCostBadge'),
  shippingCostBadge: document.getElementById('shippingCostBadge'),
  pricingModal: document.getElementById('pricingModal')
};

document.addEventListener('DOMContentLoaded', async () => {
  // Check URL query parameters (e.g. from Chrome extension ?price=25)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('price')) {
    elements.itemPrice.value = parseFloat(urlParams.get('price')) || 32.00;
  }

  // Load presets
  try {
    const res = await fetch('/api/presets');
    const json = await res.json();
    if (json.success) {
      presetsData = json.data;
    }
  } catch (e) {
    console.warn('Could not load presets:', e);
  }

  // Attach event listeners
  const inputList = [
    elements.itemPrice, elements.shippingCharge, elements.itemCost,
    elements.shippingCost, elements.offsiteAds, elements.etsyAdsCost,
    elements.countrySelect
  ];

  inputList.forEach(input => {
    input.addEventListener('input', runCalculations);
  });

  elements.targetMarginSlider.addEventListener('input', updateTargetPrice);
  elements.countrySelect.addEventListener('change', updateCurrencySymbols);

  runCalculations();
});

function updateCurrencySymbols() {
  const country = elements.countrySelect.value;
  const symbols = { US: '$', UK: '£', CA: 'CA$', AU: 'A$', EU: '€' };
  currentCurrency = symbols[country] || '$';

  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.innerText = currentCurrency;
  });
  runCalculations();
}

function runCalculations() {
  const itemPrice = parseFloat(elements.itemPrice.value) || 0;
  const shippingCharge = parseFloat(elements.shippingCharge.value) || 0;
  const itemCost = parseFloat(elements.itemCost.value) || 0;
  const shippingCost = parseFloat(elements.shippingCost.value) || 0;
  const country = elements.countrySelect.value;
  const offsiteAds = elements.offsiteAds.value;
  const etsyAdsCost = parseFloat(elements.etsyAdsCost.value) || 0;

  // Update input badges
  elements.itemPriceBadge.innerText = `${currentCurrency}${itemPrice.toFixed(2)}`;
  elements.shippingChargeBadge.innerText = `${currentCurrency}${shippingCharge.toFixed(2)}`;
  elements.itemCostBadge.innerText = `${currentCurrency}${itemCost.toFixed(2)}`;
  elements.shippingCostBadge.innerText = `${currentCurrency}${shippingCost.toFixed(2)}`;

  const totalRev = itemPrice + shippingCharge;
  if (totalRev <= 0) return;

  // Rates
  const rates = {
    US: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    UK: { pPct: 0.04, pFlat: 0.20, reg: 0.0025 },
    CA: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    AU: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    EU: { pPct: 0.04, pFlat: 0.30, reg: 0.0035 }
  }[country] || { pPct: 0.03, pFlat: 0.25, reg: 0 };

  const listingFee = 0.20;
  const transactionFee = totalRev * 0.065;
  const paymentFee = (totalRev * rates.pPct) + rates.pFlat;
  
  let adsFee = 0;
  if (offsiteAds === 'optional') adsFee = totalRev * 0.15;
  if (offsiteAds === 'mandatory') adsFee = totalRev * 0.12;
  const regFee = totalRev * rates.reg;

  const totalEtsyFees = listingFee + transactionFee + paymentFee + adsFee + regFee + etsyAdsCost;
  const totalSellerCosts = itemCost + shippingCost;
  const totalExpenses = totalEtsyFees + totalSellerCosts;
  const netProfit = totalRev - totalExpenses;
  const marginPct = (netProfit / totalRev) * 100;
  const roiPct = totalSellerCosts > 0 ? (netProfit / totalSellerCosts) * 100 : marginPct;

  // Break-even
  const combinedFeeRate = 0.065 + rates.pPct + (offsiteAds === 'optional' ? 0.15 : (offsiteAds === 'mandatory' ? 0.12 : 0)) + rates.reg;
  const fixedDeductions = listingFee + rates.pFlat + etsyAdsCost + totalSellerCosts;
  const breakEvenRev = (1 - combinedFeeRate > 0) ? (fixedDeductions / (1 - combinedFeeRate)) : 0;
  const breakEvenPrice = Math.max(0, breakEvenRev - shippingCharge);

  // Update DOM Display
  elements.netProfitDisplay.innerText = `${currentCurrency}${netProfit.toFixed(2)}`;
  elements.netProfitDisplay.className = `text-5xl sm:text-6xl font-black font-mono tracking-tight ${
    netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
  }`;

  elements.marginBadge.innerText = `${marginPct.toFixed(1)}% Margin`;
  elements.marginBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${
    marginPct >= 30 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    (marginPct >= 10 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')
  }`;

  elements.breakEvenDisplay.innerText = `${currentCurrency}${breakEvenPrice.toFixed(2)}`;
  elements.totalFeesDisplay.innerText = `${currentCurrency}${totalEtsyFees.toFixed(2)}`;
  elements.roiDisplay.innerText = `${roiPct.toFixed(1)}%`;
  elements.takeRateBadge.innerText = `Etsy Take Rate: ${((totalEtsyFees / totalRev) * 100).toFixed(1)}%`;

  // Itemized List
  elements.feeListing.innerText = `${currentCurrency}${listingFee.toFixed(2)}`;
  elements.feeTransaction.innerText = `${currentCurrency}${transactionFee.toFixed(2)}`;
  elements.feePayment.innerText = `${currentCurrency}${paymentFee.toFixed(2)}`;
  elements.feeOffsiteAds.innerText = `${currentCurrency}${adsFee.toFixed(2)}`;
  elements.feeSellerCosts.innerText = `${currentCurrency}${totalSellerCosts.toFixed(2)}`;

  // Bar Graph Visualization
  const safeProfit = Math.max(0, netProfit);
  const totalBarSum = safeProfit + totalEtsyFees + totalSellerCosts;
  if (totalBarSum > 0) {
    const profitWidth = (safeProfit / totalBarSum) * 100;
    const feesWidth = (totalEtsyFees / totalBarSum) * 100;
    const costsWidth = (totalSellerCosts / totalBarSum) * 100;

    elements.barProfit.style.width = `${profitWidth}%`;
    elements.barFees.style.width = `${feesWidth}%`;
    elements.barCosts.style.width = `${costsWidth}%`;

    elements.barProfitLabel.innerText = `Profit: ${currentCurrency}${safeProfit.toFixed(2)}`;
    elements.barFeesLabel.innerText = `Etsy: ${currentCurrency}${totalEtsyFees.toFixed(2)}`;
    elements.barCostsLabel.innerText = `Costs: ${currentCurrency}${totalSellerCosts.toFixed(2)}`;
  }

  updateTargetPrice();
}

function updateTargetPrice() {
  const targetPct = parseInt(elements.targetMarginSlider.value, 10);
  elements.targetMarginLabel.innerText = `${targetPct}%`;
  elements.sliderMarginText.innerText = `${targetPct}%`;

  const itemCost = parseFloat(elements.itemCost.value) || 0;
  const shippingCost = parseFloat(elements.shippingCost.value) || 0;
  const shippingCharge = parseFloat(elements.shippingCharge.value) || 0;
  const country = elements.countrySelect.value;
  const offsiteAds = elements.offsiteAds.value;
  const etsyAdsCost = parseFloat(elements.etsyAdsCost.value) || 0;

  const rates = {
    US: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    UK: { pPct: 0.04, pFlat: 0.20, reg: 0.0025 },
    CA: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    AU: { pPct: 0.03, pFlat: 0.25, reg: 0 },
    EU: { pPct: 0.04, pFlat: 0.30, reg: 0.0035 }
  }[country] || { pPct: 0.03, pFlat: 0.25, reg: 0 };

  const adsPct = offsiteAds === 'optional' ? 0.15 : (offsiteAds === 'mandatory' ? 0.12 : 0);
  const combinedFeeRate = 0.065 + rates.pPct + adsPct + rates.reg;
  const targetMarginRate = targetPct / 100;
  const fixedDeductions = 0.20 + rates.pFlat + etsyAdsCost + itemCost + shippingCost;

  const denom = 1 - combinedFeeRate - targetMarginRate;
  if (denom <= 0) {
    elements.recommendedPriceDisplay.innerText = "N/A";
    return;
  }

  const targetRev = fixedDeductions / denom;
  const recPrice = Math.max(0, targetRev - shippingCharge);
  elements.recommendedPriceDisplay.innerText = `${currentCurrency}${recPrice.toFixed(2)}`;
}

// Preset application
window.applyPreset = function(presetId) {
  const presets = {
    "digital-download": { itemPrice: 14.99, shippingCharge: 0, itemCost: 0, shippingCost: 0, offsiteAds: "none", etsyAdsCost: 0 },
    "print-on-demand": { itemPrice: 28.50, shippingCharge: 0, itemCost: 12.80, shippingCost: 4.50, offsiteAds: "optional", etsyAdsCost: 0.50 },
    "handmade-craft": { itemPrice: 42.00, shippingCharge: 4.99, itemCost: 8.50, shippingCost: 4.25, offsiteAds: "none", etsyAdsCost: 0 },
    "vintage-decor": { itemPrice: 89.00, shippingCharge: 12.00, itemCost: 24.00, shippingCost: 11.50, offsiteAds: "mandatory", etsyAdsCost: 1.00 }
  };

  const p = presets[presetId];
  if (!p) return;

  elements.itemPrice.value = p.itemPrice;
  elements.shippingCharge.value = p.shippingCharge;
  elements.itemCost.value = p.itemCost;
  elements.shippingCost.value = p.shippingCost;
  elements.offsiteAds.value = p.offsiteAds;
  elements.etsyAdsCost.value = p.etsyAdsCost;

  runCalculations();
};

// Modal controls
window.openPricingModal = function() {
  elements.pricingModal.classList.remove('hidden');
};

window.closePricingModal = function() {
  elements.pricingModal.classList.add('hidden');
};

// Checkout
window.startCheckout = async function(plan) {
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const data = await res.json();

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      closePricingModal();
      alert(`🎉 Pro License Activated!\n\nPlan: ${plan.toUpperCase()}\nLicense: ${data.licenseKey}\n\nBulk CSV upload & competitor analysis tools unlocked.`);
    }
  } catch (e) {
    alert('Payment gateway initialization error.');
  }
};
