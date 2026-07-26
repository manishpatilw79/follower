const express = require('express');
const axios = require('axios');
const app = express();

const USERNAME = 'reservationhataomovement';

app.get('/followers', async (req, res) => {
  try {
    const { data } = await axios.get(`https://www.instagram.com/${USERNAME}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });

    const match = data.match(/"edge_followed_by":\{"count":(\d+)\}/);
    if (match) {
      res.send(match[1]);
    } else {
      const metaMatch = data.match(/([\d,.]+)\s+Followers/i);
      if (metaMatch) {
        res.send(metaMatch[1].replace(/[,.]/g, ''));
      } else {
        res.status(500).send('0');
      }
    }
  } catch (err) {
    res.status(500).send('0');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
