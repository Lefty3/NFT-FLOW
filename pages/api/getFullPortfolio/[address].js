const Alchemy = require("alchemy-sdk");
const fs = require("fs");
const axios = require('axios')

const config = {
  apiKey: "izFKWbkrS_ZpDmLO_4J95Wc_5Uf0DV6z",
  network: Alchemy.Network.ETH_MAINNET,
};
const alchemy = new Alchemy.Alchemy(config);

// // Portfolio Address
// const address = "0xc0016f4AE265f7311B4B6991a7aafc4052A8d3E7";

async function GetFullPortfolio(address) {
  const to = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    toAddress: address,
    excludeZeroValue: false,
    category: ["erc721", "erc1155"],
    withMetadata: true,
  });

  const from = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    fromAddress: address,
    excludeZeroValue: false,
    category: ["erc721", "erc1155"],
    withMetadata: true,
  });

  var portfolio = [];

  for (let i of to.transfers) {
    var sale = [];
    var value = []
    var oResults;
    var sResults;
    for (let j of from.transfers) {
      if (
        i.rawContract.address == j.rawContract.address &&
        i.tokenId == j.tokenId
      ) {
        sale = j;
      }
    }

    const oDate = new Date(i.metadata.blockTimestamp.split("T")[0]);
    oDate.setUTCHours(0, 0, 0, 0);
    const oTimestamp = oDate.getTime()/1000;
    const mysql = require('mysql');

    // Create a connection to the MySQL database
    const connection = mysql.createConnection({
      host: 'database-1.c2mk4p2gvrkn.us-east-1.rds.amazonaws.com',
      user: 'admin',
      password: 'Aer0plane',
    });

    // Connect to the MySQL database
    connection.connect();

    const hashCount = to.transfers.reduce((count, transfer) => {
      const { hash } = transfer;
      if (hash === i.hash) {
        count++;
      }
      return count;
    }, 0);

    const hash = await alchemy.core.getTransaction(i.hash);
    //console.log(hash)
    // Query the open value from the default.ethprices table where the timestamp is 123456
    await connection.query(
      'SELECT open FROM default.ethprices WHERE timestamp = ?',
      [oTimestamp],
      (error, results) => {
        if (error) console.log(error);
        oResults = results[0].open;
        value.push([Alchemy.Utils.formatEther(hash.value)/hashCount, oResults])
      }
      
    );
    // Close the connection to the MySQL database
    connection.end();



    if (sale.length != 0) {
      const sDate = new Date(sale.metadata.blockTimestamp.split("T")[0]);
      sDate.setUTCHours(0, 0, 0, 0);
      const sTimestamp = sDate.getTime()/1000;
      const mysql = require('mysql');
  
      // Create a connection to the MySQL database
      const connection = mysql.createConnection({
        host: 'database-1.c2mk4p2gvrkn.us-east-1.rds.amazonaws.com',
        user: 'admin',
        password: 'Aer0plane',
      });
  
      // Connect to the MySQL database
      connection.connect();
      const hash = await alchemy.core.getTransaction(sale.hash);
      // Query the open value from the default.ethprices table where the timestamp is 123456
      await connection.query(
        'SELECT open FROM default.ethprices WHERE timestamp = ?',
        [sTimestamp],
        (error, results) => {
          if (error) console.log(error);
          sResults = results[0].open;
    value.push([Alchemy.Utils.formatEther(hash.value), sResults])
        }
      );
  
      // Close the connection to the MySQL database
      connection.end();

      
    }

    const metadata = await alchemy.nft.getNftMetadata(i.rawContract.address, i.tokenId).catch((e)=>console.log(e));
    const floor = await alchemy.nft.getFloorPrice(i.rawContract.address).catch((e)=>console.log(e))

    metadata ? portfolio.push([[i, sale], value, [metadata], [floor.openSea?.floorPrice || 0]]) : null;
  }

  // fs.writeFile('portfolio.json', JSON.stringify(portfolio), (err) => {
  //     if (err) throw err;
  //     console.log('The array was written to the file');
  //   });

  return portfolio;
}

export default async (req, res) => {
  console.log(req.query.address)
  const address = req.query.address;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(401).send("Invalid Request");
  try {
  const portfolio = await GetFullPortfolio(address);
  console.log()
  return res.json(portfolio);
  } catch(e) {
      console.log(e);
      return res.status(401).send("Invalid Request");
  }
}