const express = require('express')
const app = express()

const {getItems} = require("../controllers/listings.controller")

app.post("/api/data", getItems)
// app.post("api/scrapeSite", scrapePages)

module.exports = app