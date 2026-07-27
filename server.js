const express = require('express');
const { chromium } = require('playwright');

const TARGET_URL = 'https://instastatistics.com/reservationhataomovement';
const PORT = process.env.PORT || 3000;

const app = express();

let latestFollowers = null;
let browser = null;
let page = null;
let isConnecting = false;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function formatDisplay(num) {
  if (num === null || num === undefined) return 'N/A';
  let suffix = '';
  let short = num;

  if (num >= 1_000_000_000) {
    short = (num / 1_000_000_000).toFixed(3);
    suffix = 'B';
  } else if (num >= 1_000_000) {
    short = (num / 1_000_000).toFixed(3);
    suffix = 'M';
  } else if (num >= 1_000) {
    short = (num / 1_000).toFixed(1);
    suffix = 'K';
  }

  short = String(short).replace(/\.?0+$/, '');
  return `${num} (${short}${suffix})`;
}

function parseFollowerText(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return parseInt(cleaned, 10);
}

async function exposeUpdateFunction() {
  await page.exposeFunction('__onFollowerUpdate', (rawText) => {
    const count = parseFollowerText(rawText);
    if (count !== null && count !== latestFollowers) {
      latestFollowers = count;
      log('Follower count updated:', count);
    }
  });
}

async function injectObserver() {
  await page.evaluate(() => {
    function scanAndReport() {
      const bodyText = document.body.innerText || '';
      const match = bodyText.match(/([\d,.]{4,})\s*(Followers|followers)/);
      if (match) {
        window.__onFollowerUpdate(match[1]);
      }
    }

    scanAndReport();

    const observer = new MutationObserver(() => {
      scanAndReport();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    window.__igObserverActive = true;
  });
}

async function launchAndObserve() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions'
      ]
    });

    browser.on('disconnected', () => {
      log('Browser disconnected. Reconnecting...');
      isConnecting = false;
      setTimeout(launchAndObserve, 2000);
    });

    const context = await browser.newContext({
      viewport: { width: 800, height: 600 }
    });

    page = await context.newPage();

    page.on('crash', () => {
      log('Page crashed. Reconnecting...');
      isConnecting = false;
      setTimeout(launchAndObserve, 2000);
    });

    page.on('close', () => {
      log('Page closed unexpectedly. Reconnecting...');
      if (!isConnecting) {
        isConnecting = false;
        setTimeout(launchAndObserve, 2000);
      }
    });

    log('Navigating to target URL (one-time load)...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });

    await exposeUpdateFunction();
    await injectObserver();

    log('DOM observer active. Follower count will update live without reloads.');
    isConnecting = false;
  } catch (err) {
    log('Error during launch/observe:', err.message);
    isConnecting = false;
    try {
      if (browser) await browser.close();
    } catch (_) {}
    setTimeout(launchAndObserve, 3000);
  }
}

app.get('/followers', (req, res) => {
  if (latestFollowers === null) {
    return res.status(503).json({ error: 'Follower count not yet available' });
  }
  res.json({
    followers: latestFollowers,
    display: formatDisplay(latestFollowers)
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    browserAlive: !!browser && browser.isConnected(),
    followers: latestFollowers
  });
});

app.listen(PORT, () => {
  log(`Server listening on port ${PORT}`);
  launchAndObserve();
});

process.on('SIGTERM', async () => {
  log('SIGTERM received, closing browser...');
  if (browser) await browser.close();
  process.exit(0);
});
