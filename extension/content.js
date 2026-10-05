// Injects on Etsy listing pages to extract price and display floating profit pill

function extractPriceFromPage() {
  const selectors = [
    '[data-buy-box-region="price"]',
    '.wt-text-title-larger',
    '.wt-text-title-03',
    'p.wt-text-title-larger',
    '.wt-nudge-b-1',
    '[data-selector="price-only"]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText || '';
      // Find numeric pattern
      const match = text.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
      if (match && parseFloat(match[1]) > 0) {
        return parseFloat(match[1]);
      }
    }
  }

  // Fallback: search anywhere in buy box
  const buyBox = document.querySelector('[data-buy-box-region="price"], #listing-page-cart');
  if (buyBox) {
    const match = buyBox.innerText.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
    if (match) return parseFloat(match[1]);
  }

  return 28.00; // Default fallback
}

function injectProfitBadge() {
  if (document.getElementById('etsy-profit-pro-badge')) return;

  const price = extractPriceFromPage();
  const estFees = (price * 0.095) + 0.45;
  const estNet = price - estFees;
  const marginPct = ((estNet / price) * 100).toFixed(0);

  const badge = document.createElement('div');
  badge.id = 'etsy-profit-pro-badge';
  badge.style.cssText = `
    position: fixed !important;
    bottom: 30px !important;
    right: 30px !important;
    background: #0f172a !important;
    color: #f8fafc !important;
    border: 2px solid #f97316 !important;
    padding: 12px 20px !important;
    border-radius: 99px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    box-shadow: 0 12px 35px rgba(0,0,0,0.7), 0 0 20px rgba(249,115,22,0.3) !important;
    z-index: 2147483647 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    transition: transform 0.2s ease !important;
  `;

  badge.innerHTML = `
    <span style="background: #f97316; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; box-shadow: 0 0 10px #f97316;">⚡</span>
    <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
      <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">EtsyProfit Pro</span>
      <span style="font-size: 13px; color: #fff;">Est. Net: <strong style="color: #34d399;">$${estNet.toFixed(2)}</strong> (${marginPct}% margin)</span>
    </div>
    <span style="background: #1e293b; color: #fb923c; padding: 4px 8px; border-radius: 6px; font-size: 11px; margin-left: 4px; border: 1px solid #334155;">Calculate ↗</span>
  `;

  badge.onmouseenter = () => { badge.style.transform = 'scale(1.05)'; };
  badge.onmouseleave = () => { badge.style.transform = 'scale(1.0)'; };

  badge.addEventListener('click', () => {
    window.open(`https://etsy-profit-pro.onrender.com/?price=${price}`, '_blank');
  });

  document.body.appendChild(badge);
}

// Auto-run with observer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(injectProfitBadge, 1000));
} else {
  setTimeout(injectProfitBadge, 500);
}

// Polling fallback
let attempts = 0;
const interval = setInterval(() => {
  attempts++;
  if (document.getElementById('etsy-profit-pro-badge') || attempts > 10) {
    clearInterval(interval);
  } else {
    injectProfitBadge();
  }
}, 1000);
