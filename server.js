const express = require('express');
const axios = require('axios');
const app = express();

const USERNAME = 'reservationhataomovement';

app.get('/followers', async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}`,
      {
        headers: {
          'User-Agent': 'Instagram 219.0.0.12.117 Android',
          'x-ig-app-id': '936619743392459',
          'Accept': '*/*'
        }
      }
    );

    const count = data.data.user.edge_followed_by.count;
    res.send(String(count));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('0');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
