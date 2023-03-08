/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

const axios = require('axios');
const mysql = require('mysql');
const cron = require('cron');

// Set up the MySQL connection
const connection = mysql.createConnection({
  host: 'database-1.c2mk4p2gvrkn.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Aer0plane',
});

// Set the URL for the Ethereum price API
const API_URL = 'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=USD&days=1&interval=daily';

// Function to fetch the latest Ethereum price data from the API
const fetchEthPrice = async () => {
  // Send a GET request to the API
  const response = await axios.get(API_URL);

  // Return the price data from the response
  return response.data.prices;
}

// Function to save the Ethereum price data to the database
const saveEthPrice = async (priceData) => {
  // Insert the price data into the 'prices' table in MySQL
  const date = new Date(priceData[0][0]);
  date.setUTCHours(0, 0, 0, 0);
  const oTimestamp = date.getTime()/1000;
  await connection.query('INSERT INTO default.ethprices (timestamp, open) VALUES (?, ?)', [oTimestamp, priceData[0][1]]);
}

// Function to update the database with the latest Ethereum price data
const updateEthPrices = async () => {
  // Fetch the latest Ethereum price data
  const priceData = await fetchEthPrice();

  // Save the price data to the database
  await saveEthPrice(priceData);

  console.log(`Updated Ethereum prices at ${new Date()}`);
}

// // Create a new cron job to run at 00:00 GMT every day
const job = new cron.CronJob('5 0 * * *', updateEthPrices);

// // Start the cron job
job.start();

module.exports = nextConfig
