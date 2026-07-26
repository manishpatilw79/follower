const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

const USERNAME = "reservationhataomovement";

let followers = 0;

async function updateFollowers() {
  try {
    console.log("Fetching Instagram...");

    const url = `https://www.instagram.com/${USERNAME}/`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 10000
    });

    console.log("Page Length:", data.length);
    console.log(data.substring(0, 1000));

    const match = data.match(/"edge_followed_by":\{"count":(\d+)\}/);

    if (match) {
      followers = parseInt(match[1]);
      console.log("Followers:", followers);
    } else {
      console.log("Follower count NOT FOUND");
    }

  } catch (err) {
    console.log("ERROR:", err.message);
  }
}

updateFollowers();
setInterval(updateFollowers, 3000);

app.get("/", (req, res) => {
  res.send("Instagram Follower API Running");
});

app.get("/followers", (req, res) => {
  res.json({
    followers
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running on Port", PORT);
});
