const express = require("express");
const { chromium } = require("playwright");

const app = express();

let followers = 0;

async function update() {
    let browser;

    try {

        browser = await chromium.launch({
            headless: true
        });

        const page = await browser.newPage();

        await page.goto(
            "https://www.instagram.com/reservationhataomovement/",
            {
                waitUntil: "networkidle"
            }
        );

        const html = await page.content();

        let m = html.match(/"edge_followed_by":\{"count":(\d+)\}/);

        if (!m)
            m = html.match(/"followers":\{"count":(\d+)\}/);

        if (m) {
            followers = parseInt(m[1]);
            console.log(followers);
        }
        else {
            console.log("Not Found");
        }

    } catch (e) {
        console.log(e);
    }

    if (browser)
        await browser.close();
}

update();

setInterval(update,3000);

app.get("/followers",(req,res)=>{
    res.json({followers});
});

app.listen(process.env.PORT||3000);
