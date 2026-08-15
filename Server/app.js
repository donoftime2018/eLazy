const express = require('express');
const app = express();
const dotenv = require('dotenv')

const cors = require('cors')
const bodyParser = require('body-parser')

const listings = require("./routes/listings.routes")

dotenv.config()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(listings)

const server = app.listen(4000, () => {
  console.log("Connected!");
});

// server.setTimeout(0);          
// server.headersTimeout = 600000; 
// server.keepAliveTimeout = 610000