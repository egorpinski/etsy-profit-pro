// Accurate Etsy Fee & Profit Calculation Engine (Updated for 2026 Fee Schedule)

export const COUNTRY_RATES = {
  US: { name: "United States (USD)", currency: "$", paymentPct: 0.03, paymentFlat: 0.25, regulatoryPct: 0.00 },
  UK: { name: "United Kingdom (GBP)", currency: "£", paymentPct: 0.04, paymentFlat: 0.20, regulatoryPct: 0.0025 },
  CA: { name: "Canada (CAD)", currency: "CA$", paymentPct: 0.03, paymentFlat: 0.25, regulatoryPct: 0.00 },
  AU: { name: "Australia (AUD)", currency: "A$", paymentPct: 0.03, paymentFlat: 0.25, regulatoryPct: 0.00 },
  EU: { name: "European Union (EUR)", currency: "€", paymentPct: 0.04, paymentFlat: 0.30, regulatoryPct: 0.0035 }
};

export function calculateEtsyProfit(params) {
  const itemPrice = parseFloat(params.itemPrice) || 0;
  const shippingCharge = parseFloat(params.shippingCharge) || 0; // Charged to buyer
  const itemCost = parseFloat(params.itemCost) || 0;             // Cost of goods (materials/POD)
  const shippingCost = parseFloat(params.shippingCost) || 0;     // Actual cost to ship
  const country = params.country || 'US';
  const offsiteAds = params.offsiteAds || 'none'; // 'none', 'optional' (15%), 'mandatory' (12%)
  const etsyAdsCost = parseFloat(params.etsyAdsCost) || 0;       // Cost per sale in on-site ads
  const listingQuantity = parseInt(params.listingQuantity, 10) || 1;

  const rates = COUNTRY_RATES[country] || COUNTRY_RATES.US;

  // 1. Revenue
  const totalRevenue = itemPrice + shippingCharge;

  if (totalRevenue <= 0) {
    return {
      totalRevenue: 0,
      totalEtsyFees: 0,
      totalCosts: 0,
      netProfit: 0,
      profitMargin: 0,
      breakEvenPrice: 0,
      breakdown: {}
    };
  }

  // 2. Etsy Listing Fee ($0.20 USD)
  const listingFee = 0.20;

  // 3. Etsy Transaction Fee (6.5% on item price + shipping charge)
  const transactionFee = totalRevenue * 0.065;

  // 4. Payment Processing Fee (e.g. US: 3.0% + $0.25)
  const paymentProcessingFee = (totalRevenue * rates.paymentPct) + rates.paymentFlat;

  // 5. Offsite Ads Fee
  let offsiteAdsPct = 0;
  if (offsiteAds === 'optional') offsiteAdsPct = 0.15;
  if (offsiteAds === 'mandatory') offsiteAdsPct = 0.12;
  const offsiteAdsFee = totalRevenue * offsiteAdsPct;

  // 6. Regulatory Operating Fee (for UK, France, etc.)
  const regulatoryFee = totalRevenue * rates.regulatoryPct;

  // Total Fees
  const totalEtsyFees = listingFee + transactionFee + paymentProcessingFee + offsiteAdsFee + regulatoryFee + etsyAdsCost;
  const totalSellerCosts = itemCost + shippingCost;
  const totalExpenses = totalEtsyFees + totalSellerCosts;

  // Net Profit & Margins
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const roi = (itemCost + shippingCost) > 0 ? (netProfit / (itemCost + shippingCost)) * 100 : profitMargin;

  // Calculate Break-Even Price (Sale price needed so netProfit = 0)
  // Total Fee % on Revenue = 0.065 + paymentPct + offsiteAdsPct + regulatoryPct
  const combinedFeeRate = 0.065 + rates.paymentPct + offsiteAdsPct + rates.regulatoryPct;
  const fixedDeductions = listingFee + rates.paymentFlat + etsyAdsCost + itemCost + shippingCost;
  
  // (P + S_c) * (1 - combinedFeeRate) = fixedDeductions
  let breakEvenRevenue = 0;
  if (1 - combinedFeeRate > 0) {
    breakEvenRevenue = fixedDeductions / (1 - combinedFeeRate);
  }
  const breakEvenPrice = Math.max(0, breakEvenRevenue - shippingCharge);

  return {
    currency: rates.currency,
    totalRevenue: round(totalRevenue),
    totalEtsyFees: round(totalEtsyFees),
    totalSellerCosts: round(totalSellerCosts),
    totalExpenses: round(totalExpenses),
    netProfit: round(netProfit),
    profitMargin: round(profitMargin),
    roi: round(roi),
    breakEvenPrice: round(breakEvenPrice),
    breakdown: {
      listingFee: round(listingFee),
      transactionFee: round(transactionFee),
      paymentProcessingFee: round(paymentProcessingFee),
      offsiteAdsFee: round(offsiteAdsFee),
      regulatoryFee: round(regulatoryFee),
      etsyAdsCost: round(etsyAdsCost),
      itemCost: round(itemCost),
      shippingCost: round(shippingCost),
      effectiveEtsyTakeRatePct: round((totalEtsyFees / totalRevenue) * 100)
    }
  };
}

export function calculateTargetPrice(params) {
  const targetMarginPct = (parseFloat(params.targetMarginPct) || 30) / 100;
  const shippingCharge = parseFloat(params.shippingCharge) || 0;
  const itemCost = parseFloat(params.itemCost) || 0;
  const shippingCost = parseFloat(params.shippingCost) || 0;
  const country = params.country || 'US';
  const offsiteAds = params.offsiteAds || 'none';
  const etsyAdsCost = parseFloat(params.etsyAdsCost) || 0;

  const rates = COUNTRY_RATES[country] || COUNTRY_RATES.US;
  let offsiteAdsPct = 0;
  if (offsiteAds === 'optional') offsiteAdsPct = 0.15;
  if (offsiteAds === 'mandatory') offsiteAdsPct = 0.12;

  const combinedFeeRate = 0.065 + rates.paymentPct + offsiteAdsPct + rates.regulatoryPct;
  const fixedDeductions = 0.20 + rates.paymentFlat + etsyAdsCost + itemCost + shippingCost;

  // NetProfit = Revenue * (1 - combinedFeeRate) - fixedDeductions
  // Desired: NetProfit / Revenue = targetMarginPct
  // Revenue * (1 - combinedFeeRate - targetMarginPct) = fixedDeductions
  const denominator = 1 - combinedFeeRate - targetMarginPct;
  if (denominator <= 0) {
    return { error: "Target margin is mathematically impossible with these fees." };
  }

  const targetRevenue = fixedDeductions / denominator;
  const recommendedPrice = Math.max(0, targetRevenue - shippingCharge);

  return {
    targetMarginPct: round(targetMarginPct * 100),
    recommendedPrice: round(recommendedPrice),
    targetRevenue: round(targetRevenue)
  };
}

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
