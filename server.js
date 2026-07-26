const express = require("express");
const { chromium } = require("playwright");

const app = express();

const USERNAME = "reservationhataomovement";

let followers = 0;

async function updateFollowers() {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36"
    });

    await page.goto(
      `https://www.instagram.com/${USERNAME}/`,
      {
        waitUntil: "networkidle",
        timeout: 30000
      }
    );

    const html = await page.content();

    const match =
      html.match(/"edge_followed_by":\{"count":(\d+)\}/) ||
      html.match(/"followers":\{"count":(\d+)\}/);

    if (match) {
      followers = parseInt(match[1]);
      console.log("Followers:", followers);
    } else {
      console.log("Follower count not found");
    }

  } catch (e) {
    console.log(e.message);
  }

  if (browser)
    await browser.close();
}

updateFollowers();
setInterval(updateFollowers, 3000);

app.get("/", (req, res) => {
  res.send("Instagram API Running");
});

app.get("/followers", (req, res) => {
  res.json({
    followers
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("Server Started")
);
