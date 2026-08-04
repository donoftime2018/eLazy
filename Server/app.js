const express = require('express');
const cheerio = require('cheerio')
const app = express();
const axios = require('axios');
const dotenv = require('dotenv')
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const { CrawlingAPI } = require('crawlbase');

const selectors = require('./selectors.js')

// console.log(selectors)

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

// console.log(process.env.CRAWLBASE_JS)
// console.log(process.env.APP_ID)
// console.log(process.env.DEV_ID)

const api = new CrawlingAPI({token: process.env.CRAWLBASE_JS})

async function crawlPage(url)
{
    console.time("crawling")
    console.log("Inside crawlPage")
    const options = { ajax_wait: true, page_wait: 5000, country: "US", scraper: "ebay-serp",
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'close'
    } };
    const response = await api.get(url, options);
    if (response.statusCode === 200) {
        // console.log(response.body)
        return JSON.parse(response.body);
    }
    console.error(`Request failed: ${response.statusCode}`);
    console.timeEnd("crawling")
    return null;
}

function parseSearch(json) {
    console.time("parse")
  console.log("Inside parseSearch")
  const items = json.body.products
//   console.log(items)
//   const items = [];

  const results = json.body.resultCount
//   const $fewerWords = $("selectors.SELECTORS.fewerWordsNotice").text()
  
  console.log(Number(results))
//   console.log($fewerWords)
//   console.log($(selectors.SELECTORS.results).text())
//   console.log($(selectors.SELECTORS.pagination))
//   console.log($(selectors.SELECTORS.fewerWordsNotice))
//   console.log($(selectors.SELECTORS.currentPage))
//   console.log($(selectors.SELECTORS.title))
//   console.log($(selectors.SELECTORS.price))

//   $(selectors.SELECTORS.results+">"+selectors.SELECTORS.card ).each((index, el) => {
//         console.log(index)
          
//         if (index >= $results)
//             return;

//         const card = $(el);
//         // console.log(card.text())
//         const title = card
//             .find(selectors.SELECTORS.title)
//             .text()
//             .trim();

//         items.push({
//             title: card
//             .find(selectors.SELECTORS.title)
//             .text()
//             .split("Opens in a new window or tab")[0]
//             .trim(),
            
//             price: card
//                 .find(selectors.SELECTORS.price)
//                 // .first()
//                 .text()
//                 .trim(),

//             condition: card
//                 .find(selectors.SELECTORS.condition)
//                 .text()
//                 .trim(),

//             itemUrl: card
//                 .find(selectors.SELECTORS.link)
//                 .attr("href")
//                 .split("?")[0],

//             bestOffer: card
//                 .find(selectors.SELECTORS.bestOffer)
//                 .text(),
            
//             deliveryFee: card
//                 .find(selectors.SELECTORS.deliveryFee)
//                 .text(),

//             shippingLocation:  card
//                 .find(selectors.SELECTORS.location)
//                 .text(),

//             image: card
//                 .find(selectors.SELECTORS.image)
//                 .attr("src")
//         });
//     });
    console.timeEnd("parse")
  return items;
}

async function scrapePages(keyword, totalPages=1) {
  const all = [];
  for (let page = 1; page <= totalPages; page++) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_pgn=${page}`  //`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_pgn=${page}`;
    console.log(url)
    const json = await crawlPage(url);
    if (json) {
    fs.writeFileSync(
        "ebay.json",
        JSON.stringify(json, null, 2)
    );
      const pageItems = await parseSearch(json);
      all.push(...pageItems);
    }
  }
  return all;
}

async function getItems(keyword, priceCeil = undefined, priceFloor = undefined, newCond = false, includeDescription = false)
{
    // console.log(process.env.PROD_APP_ID)
    // console.log(process.env.PROD_CERT_ID)


    // const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(keyword)}`  //`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_pgn=${page}`;
    // console.log(url)

    const headers = {
         'Authorization': `Basic ${Buffer.from(`${process.env.PROD_APP_ID}:${process.env.PROD_CERT_ID}`).toString('base64')}`,
         'Content-Type': 'application/x-www-form-urlencoded'
    }

    const oAuth = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', new URLSearchParams({
        'grant_type': 'client_credentials',
        'scope': 'https://api.ebay.com/oauth/api_scope'
    }), { headers })
    // console.log(oAuth.data.access_token)

    console.log('Price Floor:', priceFloor)
    console.log('Price Ceiling:', priceCeil)

    const filters = [
      includeDescription ? "searchInDescription:true" : undefined,
      newCond ? "conditions:{NEW}" : undefined,
      priceCeil > 0 && priceFloor == undefined ? `price:[..${priceCeil}],priceCurrency:USD`: undefined,
      priceFloor > 0 && priceCeil == undefined ? `price:[${priceFloor}],priceCurrency:USD`: undefined,
      priceFloor > 0 && priceCeil > 0 ? `price:[${priceFloor}..${priceCeil}],priceCurrency:USD`: undefined
    ]

    const items = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
        params: { q: keyword, filter: filters.filter(f=>f!==undefined).join(',')},
        headers: {
            'Authorization': `Bearer ${oAuth.data.access_token}`,
            'Content-Type': 'application/json',
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
        }
    })

    // console.log(items)
    
    return items.data.itemSummaries
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
    const { query, newCond, priceFloor, priceCeil, desc } = req.body
    console.log('Query:', query);
    console.log('New Condition:', newCond)
    console.log('Including description:', desc);
    console.log('Price Floor:', priceFloor)
    console.log('Price Ceiling:', priceCeil)

    // console.log('Total Pages:', totalPages);


    if (!query) {
        res.status(400).json({ error: 'No query provided.' });
        return;
    }

    try {
        const items = await getItems(query, priceCeil, priceFloor, newCond, desc)/// await scrapePages(query, totalPages);
        // console.log(items);
        // console.log(items.length)
        // await scrapePages(query, totalPages)
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