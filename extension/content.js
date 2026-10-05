// Injects on Etsy listing pages to extract price and display floating profit pill

function getPrice() {
  const priceEl = document.querySelector('[data-buy-box-region="price"], [data-buy-box-region="price"] span, .wt-text-title-larger, .wt-text-title-03');
  if (!priceEl) return 0;
  const match = priceEl.innerText.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Listen for message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_ETSY_PRICE') {
    sendResponse({ price: getPrice(), shipping: 0 });
  }
});

// Create unobtrusive floating badge
function injectProfitBadge() {
  const price = getPrice();
  if (!price || document.getElementById('etsy-profit-pro-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'etsy-profit-pro-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #f97316;
    padding: 10px 14px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    z-index: 999999;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, sans-serif;
  `;

  // Quick default calculation (standard 30% margin heuristic)
  const estEtsyFees = (price * 0.095) + 0.45;
  badge.innerHTML = `
    <span style="background: #f97316; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">⚡</span>
    <span>Etsy Fees: <strong style="color: #fb923c;">$${estEtsyFees.toFixed(2)}</strong></span>
  `;

  badge.addEventListener('click', () => {
    window.open(`https://etsy-profit-pro.onrender.com/?price=${price}`, '_blank');
  });

  document.body.appendChild(badge);
}

setTimeout(injectProfitBadge, 1500);
