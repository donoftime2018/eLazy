const express = require('express');
const cheerio = require('cheerio')
const app = express();
const dotenv = require('dotenv')
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const { CrawlingAPI } = require('crawlbase');

const selectors = require('./selectors.js')

console.log(selectors)

dotenv.config()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   req.setTimeout(0);
//   res.setTimeout(0);
//   next();
// });
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }))

console.log(process.env.CRAWLBASE_JS)

const api = new CrawlingAPI({token: process.env.CRAWLBASE_JS})

async function crawlPage(url)
{
    console.time("crawling")
    console.log("Inside crawlPage")
    const options = { ajax_wait: true, page_wait: 5000, country: "US", 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'close'
    } };
    const response = await api.get(url, options);
    if (response.statusCode === 200) {
        // console.log(response)
        return response.body;
    }
    console.error(`Request failed: ${response.statusCode}`);
    console.timeEnd("crawling")
    return null;
}

function parseSearch(html) {
    console.time("parse")
  console.log("Inside parseSearch")
  const $ = cheerio.load(html);

  const items = [];

  const $results = Number($(selectors.SELECTORS.numberOfResults).first().text())
  const $fewerWords = $("selectors.SELECTORS.fewerWordsNotice").text()
  
  console.log($results)
//   console.log($fewerWords)
//   console.log($(selectors.SELECTORS.results).text())
//   console.log($(selectors.SELECTORS.pagination))
//   console.log($(selectors.SELECTORS.fewerWordsNotice))
//   console.log($(selectors.SELECTORS.currentPage))
//   console.log($(selectors.SELECTORS.title))
//   console.log($(selectors.SELECTORS.price))

  $(selectors.SELECTORS.results+">"+selectors.SELECTORS.card ).each((index, el) => {
        console.log(index)
          
        if (index >= $results)
            return;

        const card = $(el);
        // console.log(card.text())
        const title = card
            .find(selectors.SELECTORS.title)
            .text()
            .trim();

        items.push({
            title: card
            .find(selectors.SELECTORS.title)
            .text()
            .split("Opens in a new window or tab")[0]
            .trim(),
            
            price: card
                .find(selectors.SELECTORS.price)
                // .first()
                .text()
                .trim(),

            condition: card
                .find(selectors.SELECTORS.condition)
                .text()
                .trim(),

            itemUrl: card
                .find(selectors.SELECTORS.link)
                .attr("href")
                .split("?")[0],

            bestOffer: card
                .find(selectors.SELECTORS.bestOffer)
                .text(),
            
            deliveryFee: card
                .find(selectors.SELECTORS.deliveryFee)
                .text(),

            shippingLocation:  card
                .find(selectors.SELECTORS.location)
                .text(),

            image: card
                .find(selectors.SELECTORS.image)
                .attr("src")
        });
    });
    console.timeEnd("parse")
  return items;
}

async function scrapePages(keyword, totalPages=1) {
  const all = [];
  for (let page = 1; page <= totalPages; page++) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_pgn=${page}`;
    console.log(url)
    const html = await crawlPage(url);
    if (html) {
      fs.writeFileSync("ebay.html", html);
      const pageItems = await parseSearch(html);
      all.push(...pageItems);
    }
  }
  return all;
}


// async function main()
// {
//     try {
//         const items = await scrapePages("Thomas Plarail Stephen")
//         console.log(items)
//     } catch(err)
//     {
//         console.log(err)
//     }
// }
// main()

app.post("/api/data", async (req, res) => {
  
    console.log('Request body:', req.body);
    const { query, totalPages } = req.body
    console.log('Query:', query);
    console.log('Total Pages:', totalPages);


    if (!query) {
        res.status(400).json({ error: 'No query provided.' });
        return;
    }

    try {
        const items = await scrapePages(query, totalPages);
        // console.log(items);
        console.log(items.length)
        res.status(200).json({ items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Scraping failed.' });
    }
})

const server = app.listen(4000, () => {
  console.log("Connected!");
});

// server.setTimeout(0);          
// server.headersTimeout = 600000; 
// server.keepAliveTimeout = 610000;