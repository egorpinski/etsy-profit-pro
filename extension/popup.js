function calculate() {
  const itemPrice = parseFloat(document.getElementById('itemPrice').value) || 0;
  const shippingCharge = parseFloat(document.getElementById('shippingCharge').value) || 0;
  const itemCost = parseFloat(document.getElementById('itemCost').value) || 0;
  const shippingCost = parseFloat(document.getElementById('shippingCost').value) || 0;
  const offsiteAds = document.getElementById('offsiteAds').value;

  const totalRev = itemPrice + shippingCharge;
  if (totalRev <= 0) return;

  const listingFee = 0.20;
  const transactionFee = totalRev * 0.065;
  const paymentFee = (totalRev * 0.03) + 0.25;
  let adsFee = 0;
  if (offsiteAds === 'optional') adsFee = totalRev * 0.15;
  if (offsiteAds === 'mandatory') adsFee = totalRev * 0.12;

  const totalFees = listingFee + transactionFee + paymentFee + adsFee;
  const totalCosts = itemCost + shippingCost;
  const netProfit = totalRev - totalFees - totalCosts;
  const margin = (netProfit / totalRev) * 100;

  // Break-even
  const feeRate = 0.065 + 0.03 + (offsiteAds === 'optional' ? 0.15 : (offsiteAds === 'mandatory' ? 0.12 : 0));
  const breakEven = (totalCosts + 0.45) / (1 - feeRate) - shippingCharge;

  document.getElementById('netProfit').innerText = `$${netProfit.toFixed(2)}`;
  document.getElementById('netProfit').style.color = netProfit >= 0 ? '#10b981' : '#f43f5e';
  document.getElementById('profitMargin').innerText = `${margin.toFixed(1)}%`;
  document.getElementById('totalFees').innerText = `$${totalFees.toFixed(2)}`;
  document.getElementById('breakEven').innerText = `$${Math.max(0, breakEven).toFixed(2)}`;
}

document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', calculate);
});

document.getElementById('openFullApp').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

// Auto-fill from active Etsy tab if present
chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url?.includes('etsy.com/listing')) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_ETSY_PRICE' }, (res) => {
      if (res && res.price) {
        document.getElementById('itemPrice').value = res.price;
        if (res.shipping) document.getElementById('shippingCharge').value = res.shipping;
        calculate();
      }
    });
  }
});

calculate();
