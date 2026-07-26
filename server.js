const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

const USERNAME = "reservationhataomovement";

let followers = 0;

async function updateFollowers() {
  try {
    const url = `https://www.instagram.com/${USERNAME}/`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);

    const html = $.html();

    const match = html.match(/"edge_followed_by":\{"count":(\d+)\}/);

    if (match) {
      followers = parseInt(match[1]);
      console.log("Followers:", followers);
    }

  } catch (e) {
    console.log(e.message);
  }
}

updateFollowers();

setInterval(updateFollowers, 3000);

app.get("/followers", (req, res) => {
  res.json({
    followers
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running");
});
