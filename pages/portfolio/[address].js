import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic';
const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

import {
  Card,
  Row,
  Text,
  Checkbox,
  Modal,
  useModal,
  Button,
  Collapse,
  Input,
  useInput,
  Table,
  Tooltip
} from "@nextui-org/react";
import { useState, useMemo, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
const axios = require("axios");

export async function getServerSideProps(context) {
  const address = context.query.address;
  console.log(context.req.url)
  // if (!(context.req.url.includes("/_next/")) ) {
    if (false ) {
    return {
      props: {
        portfolio: null,
        currentOwned: null,
        prevOwned: null,
        price: null,
        prevOwnedNoUnknown: null,
        currentOwnedNoUnknown: null,
        currentPNL: null,
        previousPNL: null,
        longestItem: null,
      }, // will be passed to the page component as props
    };
  } else {

  var config = {
    method: "get",
    url: `https://nftflow.pro/api/getFullPortfolio/${address}`,
    headers: {},
  };

  const portfolioAx = await axios(config);
  const portfolio = portfolioAx.data;
  var currentOwned = [];
  var prevOwned = [];
  var currentOwnedNoUnknown = [];
  var prevOwnedNoUnknown = [];

  if (portfolio.length <= 0) {
    return {
      props: {
        portfolio: [],
        currentOwned: [],
        prevOwned: [],
        price: 0,
        prevOwnedNoUnknown: [],
        currentOwnedNoUnknown: [],
        currentPNL: 0,
        previousPNL: 0,
        longestItem: null,
      }, // will be passed to the page component as props
    };
  }

  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const price = parseFloat(response.data.ethereum.usd);
  for (var i of portfolio) {
    var done = false;
    if (!done) {
      i[0][1].length == 0 ? currentOwned.push(i) : prevOwned.push(i);
      (i[0][0].asset || i[2][0].contract.name) && i[0][1].length == 0
        ? currentOwnedNoUnknown.push(i)
        : null;
      (i[0][0].asset || i[2][0].contract.name) && i[0][1].length != 0
        ? prevOwnedNoUnknown.push(i)
        : null;
      done = true;
    }
  }
  var currentPNL = 0.0;
  var previousPNL = 0.0;
  for (var i of currentOwned) {
    const value =
      parseFloat(i[3][0]) * price - parseFloat(i[1][0][0]) * parseFloat(i[1][0][1]);
    currentPNL += value;
  }

  for (var i of prevOwned) {
    const value =
      parseFloat(i[1][1][0] || 0) * (i[1][1][1] || 0) - parseFloat(i[1][0][0]) * parseFloat(i[1][0][1]);
    previousPNL += value;
  }

  var graphData = [];

  /*
                {
                name: 'TEAM 2',
                data: generateDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 20, {
                  min: 10,
                  max: 60
                })
              }
  */

  var totalAmount = 0;            
  for (var item of portfolio) {
    const name = item[2][0].contract.name ? item[2][0].contract.name : item[0][0].asset || "Unknown Name";
    if (item[0][0].to) {
      totalAmount -= (parseFloat(item[1][0][0]) * parseFloat(item[1][0][1]));
      const point = {
        name: "Bought: " + name,
        x: new Date(item[0][0].metadata.blockTimestamp).getTime(),
        y: totalAmount,
        amount: 0 -(parseFloat(item[1][0][0]) * parseFloat(item[1][0][1]))
      }
      graphData.push(point);
    }
    if (item[0][1].to) {
      totalAmount += (parseFloat(item[1][1][0]) * parseFloat(item[1][1][1]));
      const point = {
        name: "Sold: " + name,
        x: new Date(item[0][1].metadata.blockTimestamp).getTime(),
        y: totalAmount,
        amount: (parseFloat(item[1][1][0]) * parseFloat(item[1][1][1]))
      }
      graphData.push(point);
    }
  }
  function compareTimestamps(a, b) {
    if (new Date(a.x) < new Date(b.x)) return -1;
    if (new Date(a.x) > new Date(b.x)) return 1;
    return 0;
  }

  graphData = graphData.sort(compareTimestamps);

  const longestItem = portfolio
    .map((item) => {
      const start = new Date(item[0][0].metadata.blockTimestamp.split("T")[0]);
      const end = new Date(
        item[0][1] && item[0][1].metadata
          ? item[0][1].metadata.blockTimestamp.split("T")[0]
          : Date.now()
      );
      return { ...item, duration: end - start };
    })
    .reduce((longest, item) => {
      if (item.duration > longest.duration) {
        return item;
      }
      return longest;
    });

  return {
    props: {
      portfolio,
      currentOwned,
      prevOwned,
      price,
      prevOwnedNoUnknown,
      currentOwnedNoUnknown,
      currentPNL,
      previousPNL,
      longestItem,
      graphData,
    }, // will be passed to the page component as props
  };
}
}

export default function Home({
  portfolio,
  currentOwned,
  prevOwned,
  price,
  prevOwnedNoUnknown,
  currentOwnedNoUnknown,
  currentPNL,
  previousPNL,
  longestItem,
  graphData,
}) {
  const [showCurrentUnknown, setShowCurrentUnknown] = useState(false);
  const [showPrevUnknown, setShowPrevUnknown] = useState(false);
  const [validStake, setValidStake] = useState(false);
  const [currentItemModal, setCurrentItemModal] = useState(null);
  const [currentItemOwned, setCurrentItemOwned] = useState(null);
  const { setVisible, bindings } = useModal();
  const { value: iValue, reset, bindings: iBindings } = useInput("");

  const [currentStakeArrayTo, setCurrentStakeArrayTo] = useState(null);
  const [currentStakeArrayFrom, setCurrentStakeArrayFrom] = useState(null);

  const router = useRouter();

  useEffect(() => {
      
    if (portfolio == null) {
      router.push("/");
    }
  
  }, [])

  

  function compareTimestamps(a, b) {
    if (new Date(a.metadata.blockTimestamp) < new Date(b.metadata.blockTimestamp)) return -1;
    if (new Date(a.metadata.blockTimestamp) > new Date(b.metadata.blockTimestamp)) return 1;
    return 0;
  }

  function StakeArray(contract) {
    setCurrentStakeArrayFrom(null);
    const to = portfolio.filter(i => i[0][1].to && i[0][1].to.toLowerCase().trim() === contract.toLowerCase().trim());
    const from = portfolio.filter(i => i[0][0].from.toLowerCase().trim()=== contract.toLowerCase().trim());
    const fromFilter = from.map((subArray) => subArray[0]);
    const fromFlat = [].concat(...fromFilter);
    const fromSort = Array.from(new Set(fromFlat.sort(compareTimestamps).reverse()))
    const toFilter = to.map((subArray) => subArray[0]);
    const toFlat = [].concat(...toFilter);
    const toFlatFilter = toFlat.filter(item => item.to.trim() == iValue.toLocaleLowerCase().trim()).filter(obj1 => !fromSort.find(obj2 => obj2.tokenId === obj1.tokenId));
    const toSort = Array.from(new Set(toFlatFilter.sort(compareTimestamps).reverse()))
    setCurrentStakeArrayFrom(fromSort);
    setCurrentStakeArrayTo(toSort);
    console.log(fromSort)
  }

  var options = {
    series: [{
    name: 'Profit / Loss',
    data: graphData,
    colors: ['#FFFFFF', '#66DA26', '#546E7A', '#E91E63', '#FF9800']
  }],
    chart: {
      background: '0',
    type: 'area',
    stacked: false,
    height: 350,
    zoom: {
      type: 'x',
      enabled: true,
      autoScaleYaxis: true
    },

  },
  dataLabels: {
    enabled: false
  },
  markers: {
    size: 0,
  },
  title: {
    text: 'Profit / Loss',
    align: 'center'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 90, 100]
    },
  },
  colors: ['#2E93fA', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFFF'],
  yaxis: {
    labels: {
      formatter: function (val) {
        return (val).toFixed(2);
      },
    },
    title: {
      text: 'Price'
    },
  },
  xaxis: {
    type: 'datetime',
  },

  theme: {
    mode: 'dark', 
    
    palette: 'palette2', 
 
},
  tooltip: {
    shared: false,
    custom: function({series, seriesIndex, dataPointIndex, w}) {
      return '<div class="arrow_box">' +
      '<p> 🔵 '+ " " + new Date (graphData[dataPointIndex].x).toLocaleDateString() + '</p>' +
        '<span>' + graphData[dataPointIndex].name + '</span><br/>' +
        '<span> Change: $' + graphData[dataPointIndex].amount.toFixed(2) + '</span>' +
        '</div>'
    },
    y: {
      formatter: function (val) {
        return (val).toFixed(2)
      }
    },
  }
  };

  const columns = [
    {
      key: "date",
      label: "Date",
    },
    {
      key: "action",
      label: "Action",
    },
  ];

  const validateContract = async (value) => {
    if (value.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
      const Web3 = require("web3");

      // Connect to an Ethereum node
      const web3 = new Web3(
        "https://eth-mainnet.g.alchemy.com/v2/izFKWbkrS_ZpDmLO_4J95Wc_5Uf0DV6z"
      );

      // The Ethereum address to check
      const address = value;

      // Get the code at the given address
      await web3.eth.getCode(address, (error, result) => {
        const isContract = result !== "0x";
        if (error) {
            setValidStake(false);
          return false;
        } else {
          // Check if the address is a smart contract
        console.log(isContract)
          if (isContract) {
              setValidStake(true);
            return true;
          } else {
            setValidStake(false);
            return false;
          }
        }
      });
    } else {
        setValidStake(false);
    return false;
    }
  };

  const helper = useMemo(async () => {
    if (!iValue)
      return {
        text: "",
        color: "",
      };
    const isValid = await validateContract(iValue);
    return {
      text: validStake ? "Correct contract" : "Enter a valid contract",
      color: validStake ? "success" : "error",
    };
  }, [iValue, validStake]);

  return (
    <div> { portfolio ?
    <div>
      <Head>
        <title>NFT Portfolio</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css" integrity="sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      </Head>

      <main>


        {/* <ConnectButton/> */}
        <Button
          className="bg-black bg-opacity-50 flex text-center justify-center sm:ml-5 mt-5 m-auto"
          auto
          onClick={()=>router.push("/")}
        >
          ⭠ {"   "}Back
        </Button>
        <div className="overflow-y-scroll w-3/4 m-auto">
          <div className="flex justify-center gap-2 mt-10 mb-20 align-middle h-auto">
            {" "}
            <h1 className="flex text-center justify-center font-bold text-5xl">
              My Portfolio
            </h1>{" "}
            <Tooltip content={"ERC20 sales are not included"}>
              <i class="fa-solid fa-circle-info align-middle flex m-auto pt-2 text-blue-500 "></i>
    </Tooltip>
          </div>

          <ApexCharts options={options} series={options.series} type="area" height={350}/>

          <div className="grid sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2 gap-5">
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Total Profit / Loss</Text>
                <Text>
                  <span
                    className={
                      currentPNL + previousPNL > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    ${(currentPNL + previousPNL).toFixed(2)}
                  </span>
                </Text>
              </Card.Body>
            </Card>
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Unrealized Profit / Loss</Text>
                <Text>
                  <span
                    className={
                      currentPNL > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    ${currentPNL.toFixed(2)}
                  </span>
                </Text>
              </Card.Body>
            </Card>
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Realized Profit / Loss</Text>
                <Text>
                  <span
                    className={
                      previousPNL > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    ${previousPNL.toFixed(2)}
                  </span>
                </Text>
              </Card.Body>
            </Card>
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Currently Owned NFTs</Text>
                <Text>{currentOwned.length} NFTs</Text>
              </Card.Body>
            </Card>
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Lifetime Owned NFTs</Text>
                <Text> </Text>
                <Text>{portfolio.length}</Text>
              </Card.Body>
            </Card>
            <Card variant="bordered " className="bg-transparent">
              <Card.Body>
                <Text className="font-bold">Longest Held NFT</Text>
                <Text> </Text>
                <Text>
                  {longestItem ? longestItem[2][0].contract.name
                    ? longestItem[2][0].contract.name
                    : longestItem[0][0].asset || (
                        <a
                          className="text-blue-800"
                          target="_blank"
                          href={
                            "https://etherscan.io/token/" +
                            longestItem[0][0].rawContract.address
                          }
                        >
                          {longestItem[0][0].rawContract.address.substring(
                            0,
                            5
                          )}
                          ...
                          {longestItem[0][0].rawContract.address.substring(
                            longestItem[0][0].rawContract.address.length - 7
                          )}{" "}
                          ↗
                        </a>
                      ) : "N/A"}
                  {"  "}{longestItem ? <div>({(longestItem.duration / 86400000).toFixed(2)} Days)</div> : null}
                </Text>
              </Card.Body>
            </Card>
          </div>

          <Collapse
            bordered
            className="overflow-y-scroll my-10"
            title="Currently Owned"
            subtitle="Currently owned NFTs with an unrealized profit / loss"
          >
            <div className="mx-auto w-max mb-10 text-white">
              <Checkbox
                defaultSelected={false}
                css={{ color: "white" }}
                className="text-white"
                onChange={(selected) => setShowCurrentUnknown(selected)}
              >
                Show Unknown Items
              </Checkbox>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-scroll">
              {showCurrentUnknown
                ? currentOwned.map((item) => (
                    <div>
                      {
                        <Card
                          isPressable
                          onClick={() => {
                            setCurrentItemModal(item);
                            setCurrentItemOwned(true);
                            setVisible(true);
                          }}
                          className=""
                        >
                          <Card.Body css={{ p: 0 }}>
                            <Card.Image
                              className="aspect-square"
                              src={
                                item[2][0].media.length > 0
                                  ? item[2][0].media[0].gateway
                                  : "/images/unknown.jpeg"
                              }
                              objectFit="scale-down"
                              width="100%"
                              alt={
                                item[2][0].contract.name
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"
                              }
                            />
                          </Card.Body>
                          <Card.Footer css={{ justifyItems: "flex-start" }}>
                            <Row
                              wrap="wrap"
                              justify="space-between"
                              align="center"
                            >
                              <Text b>
                                {item[2][0].contract.name &&
                                item[2][0].contract.name.length < 15
                                  ? item[2][0].contract.name
                                  : item[0][0].asset ||
                                    item[2][0].contract.symbol ||
                                    "Unknown Name"}
                              </Text>

                              <Text
                                css={{
                                  color: "$accents7",
                                  fontWeight: "$semibold",
                                  fontSize: "$sm",
                                }}
                              >
                                P/L: $
                                {(
                                  parseFloat(item[3][0]) * price -
                                  parseFloat(item[1][0][0]) * parseFloat(item[1][0][1])
                                ).toFixed(2)}
                              </Text>
                            </Row>
                          </Card.Footer>
                        </Card>
                      }
                      {/* 
            {item[0][1].length == 0 ? (
              <div>{ç}  || Bought Price: ${parseFloat(item[1][0][0])*parseFloat(item[1][0][1])} </div>
            ) : null} */}
                    </div>
                  ))
                : currentOwnedNoUnknown.map((item) => (
                    <div>
                      {
                        <Card
                          isPressable
                          onClick={() => {
                            setCurrentItemModal(item);
                            setCurrentItemOwned(true);
                            setVisible(true);
                          }}
                          className=""
                        >
                          <Card.Body css={{ p: 0 }}>
                            <Card.Image
                              className="aspect-square"
                              src={
                                item[2][0].media.length > 0
                                  ? item[2][0].media[0].gateway
                                  : "/images/unknown.jpeg"
                              }
                              objectFit="scale-down"
                              width="100%"
                              alt={
                                item[2][0].contract.name
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"
                              }
                            />
                          </Card.Body>
                          <Card.Footer css={{ justifyItems: "flex-start" }}>
                            <Row
                              wrap="wrap"
                              justify="space-between"
                              align="center"
                            >
                              <Text b>
                                {item[2][0].contract.name &&
                                item[2][0].contract.name.length < 15
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"}
                              </Text>
                              <Text
                                css={{
                                  color: "$accents7",
                                  fontWeight: "$semibold",
                                  fontSize: "$sm",
                                }}
                              >
                                P/L: $
                                {(
                                  parseFloat(item[3][0]) * price -
                                  parseFloat(item[1][0][0]) * parseFloat(item[1][0][1])
                                ).toFixed(2)}
                              </Text>
                            </Row>
                          </Card.Footer>
                        </Card>
                      }
                      {/* 
              {item[0][1].length == 0 ? (
                <div>{ç}  || Bought Price: ${parseFloat(item[1][0][0])*parseFloat(item[1][0][1])} </div>
              ) : null} */}
                    </div>
                  ))}
            </div>
          </Collapse>
          <Collapse
            bordered
            title="Previously Owned"
            subtitle="Previously owned NFTs with a realized profit / loss"
          >
            <div className="mx-auto w-max pb-10">
              <Checkbox
                defaultSelected={false}
                labelColor="#FFFFFF"
                className="text-white"
                onChange={(selected) => setShowPrevUnknown(selected)}
              >
                Show Unknown Items
              </Checkbox>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-scroll">
              {showPrevUnknown
                ? prevOwned.map((item) => (
                    <div>
                      {
                        <Card
                          isPressable
                          onClick={() => {
                            setCurrentItemModal(item);
                            setCurrentItemOwned(false);
                            setVisible(true);
                          }}
                          className=""
                        >
                          <Card.Body css={{ p: 0 }}>
                            <Card.Image
                              className="aspect-square"
                              src={
                                item[2][0].media.length > 0
                                  ? item[2][0].media[0].gateway
                                  : "/images/unknown.jpeg"
                              }
                              objectFit="scale-down"
                              width="100%"
                              alt={
                                item[2][0].contract.name
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"
                              }
                            />
                          </Card.Body>
                          <Card.Footer css={{ justifyItems: "flex-start" }}>
                            <Row
                              wrap="wrap"
                              justify="space-between"
                              align="center"
                            >
                              <Text b>
                                {item[2][0].contract.name &&
                                item[2][0].contract.name.length < 15
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"}
                              </Text>
                              <Text
                                css={{
                                  color: "$accents7",
                                  fontWeight: "$semibold",
                                  fontSize: "$sm",
                                }}
                              >
                                P/L: $
                                {(
                                  parseFloat(item[1][1][0]) * parseFloat(item[1][1][1]) -
                                  parseFloat(item[1][0][0]) * parseFloat(item[1][0][1])
                                ).toFixed(2)}
                              </Text>
                            </Row>
                          </Card.Footer>
                        </Card>
                      }
                      {/* 
            {item[0][1].length == 0 ? (
              <div>{ç}  || Bought Price: ${parseFloat(item[1][0][0])*parseFloat(item[1][0][1])} </div>
            ) : null} */}
                    </div>
                  ))
                : prevOwnedNoUnknown.map((item) => (
                    <div>
                      {
                        <Card
                          isPressable
                          onClick={() => {
                            setCurrentItemModal(item);
                            setCurrentItemOwned(false);
                            setVisible(true);
                          }}
                          className=""
                        >
                          <Card.Body css={{ p: 0 }}>
                            <Card.Image
                              className="aspect-square"
                              src={
                                item[2][0].media.length > 0
                                  ? item[2][0].media[0].gateway
                                  : "/images/unknown.jpeg"
                              }
                              objectFit="scale-down"
                              width="100%"
                              alt={
                                item[2][0].contract.name
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"
                              }
                            />
                          </Card.Body>
                          <Card.Footer css={{ justifyItems: "flex-start" }}>
                            <Row
                              wrap="wrap"
                              justify="space-between"
                              align="center"
                            >
                              <Text b>
                                {item[2][0].contract.name &&
                                item[2][0].contract.name.length < 15
                                  ? item[2][0].contract.name
                                  : item[0][0].asset || "Unknown Name"}
                              </Text>
                              <Text
                                css={{
                                  color: "$accents7",
                                  fontWeight: "$semibold",
                                  fontSize: "$sm",
                                }}
                              >
                                P/L: $
                                {(
                                  parseFloat(item[1][1][0]) * parseFloat(item[1][1][1]) -
                                  parseFloat(item[1][0][0]) * parseFloat(item[1][0][1])
                                ).toFixed(2)}
                              </Text>
                            </Row>
                          </Card.Footer>
                        </Card>
                      }
                      {/* 
              {item[0][1].length == 0 ? (
                <div>{ç}  || Bought Price: ${parseFloat(item[1][0][0])*parseFloat(item[1][0][1])} </div>
              ) : null} */}
                    </div>
                  ))}
            </div>
          </Collapse>

          <Collapse
            bordered
            className="overflow-y-scroll my-10"
            title="Staking Details"
            subtitle="Get details on any staked NFTs in a contract"
          >
            <div className="flex justify-center py-5">
              <Input
                {...iBindings}
                shadow={false}
                onClearClick={reset}
                status={iValue.length > 0 ? validStake ? "success" : "error" : null}
                color={iValue.length > 0 ? validStake ? "success" : "error" : null}
                helperColor={iValue.length > 0 ? validStake ? "success" : "error" : null}
                helperText={iValue.length > 0 ? validStake ? "Correct contract" : "Enter a valid contract" : null}
                type="email"
                label="Staking Contract"
                placeholder="Enter a staking contract to track"
                width="80%"
                contentRight={
                  <Button
                    className="bg-black"
                    auto
                    onPress={() => {
                      if (validStake && iValue.length > 0) {
                          StakeArray(iValue);
                      }
                    }}
                  >
                    {"→"}
                  </Button>
                }
              />
            </div>
            <div className="py-5">
                {currentStakeArrayFrom && currentStakeArrayTo ? <Table
      css={{
        height: "auto",
        minWidth: "100%",
        border: "none"
      }}
    >
      <Table.Header columns={columns}>
        {(column) => (
          <Table.Column key={column.key}>{column.label}</Table.Column>
        )}
      </Table.Header>
      <Table.Body items={currentStakeArrayTo}>
        {currentStakeArrayTo.length > 0 ? (item) => (
          <Table.Row key={item.uniqueId}>
            <Table.Cell><Tooltip content={item.metadata.blockTimestamp.split("T")[0]}>{((Date.now() - new Date(item.metadata.blockTimestamp.split("T")[0]))/ (1000 * 60 * 60 * 24)).toFixed(0)} Days Ago</Tooltip></Table.Cell>
            <Table.Cell><a
                      className="text-white underline decoration-sky-500"
                      target="_blank"
                      href={
                        "https://etherscan.io/tx/" +
                        item.hash
                      }
                    >{item.to.trim() == iValue.toLocaleLowerCase().trim() ? "Staked NFT ID:" : "Unstaked NFT ID:"}{" " + parseInt(item.tokenId) + " "}
                    ↗</a></Table.Cell>
          </Table.Row>
        ) : <Table.Row><Table.Cell>None found</Table.Cell><Table.Cell>None found</Table.Cell></Table.Row>}
      </Table.Body>
    </Table> : null}
            </div>
            {/* <Button onClick={()=>console.log(iBindings)}>Sumbit</Button> */}
          </Collapse>
        </div>

        <Modal
          scroll
          width="600px"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          {...bindings}
        >
          <Modal.Header>
            <Text id="modal-title" size={32}>
              {currentItemModal
                ? currentItemModal[2][0].contract.name
                  ? currentItemModal[2][0].contract.name
                  : currentItemModal[0][0].asset || "Unknown Name"
                : null}
            </Text>
          </Modal.Header>
          <Modal.Body>
            {currentItemModal ? (
              <div className="flex justify-center gap-3 mx-auto">
                <img
                  src={
                    currentItemModal[2][0].media.length > 0
                      ? currentItemModal[2][0].media[0].gateway
                      : "/images/unknown.jpeg"
                  }
                  className="w-1/2 h-1/2"
                ></img>
                <div>
                  <p>
                    <span className="font-bold">Token ID:</span>{" "}
                    {currentItemModal[2][0].tokenId.substring(0, 5)}
                    {currentItemModal[2][0].tokenId.length > 5 ? "..." : null}
                  </p>
                  <p>
                    <span className="font-bold">Symbol:</span>{" "}
                    {currentItemModal[2][0].contract.name
                      ? currentItemModal[2][0].contract.symbol
                      : currentItemModal[0][0].asset || "Unknown Symbol"}
                  </p>
                  <p>
                    <span className="font-bold">Contract:</span>{" "}
                    <a
                      className="text-blue-800"
                      target="_blank"
                      href={
                        "https://etherscan.io/token/" +
                        currentItemModal[0][0].rawContract.address
                      }
                    >
                      {currentItemModal[0][0].rawContract.address.substring(
                        0,
                        5
                      )}
                      ...
                      {currentItemModal[0][0].rawContract.address.substring(
                        currentItemModal[0][0].rawContract.address.length - 7
                      )}{" "}
                      ↗
                    </a>
                  </p>
                  <p>
                    <span className="font-bold">Floor Price:</span> $
                    {(currentItemModal[3][0] * price).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-bold">Bought Date:</span>{" "}
                    {
                      currentItemModal[0][0].metadata.blockTimestamp.split(
                        "T"
                      )[0]
                    }
                  </p>
                  <p>
                    <span className="font-bold">Bought Price:</span> $
                    {(
                      parseFloat(currentItemModal[1][0][0]) *
                      currentItemModal[1][0][1]
                    ).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-bold">Sold Date:</span>{" "}
                    {currentItemOwned
                      ? "N/A"
                      : currentItemModal[0][1].metadata.blockTimestamp.split(
                          "T"
                        )[0]}
                  </p>
                  <p>
                    <span className="font-bold">Sold Price:</span>{" "}
                    {currentItemOwned
                      ? "N/A"
                      : "$" +
                        (
                          parseFloat(currentItemModal[1][1][0]) *
                          currentItemModal[1][1][1]
                        ).toFixed(2)}
                  </p>
                  {currentItemOwned ? (
                    <p>
                      <span className="font-bold">uP/L:</span>{" "}
                      <span
                        className={
                          parseFloat(currentItemModal[3][0]) * price -
                            parseFloat(currentItemModal[1][0][0]) *
                              currentItemModal[1][0][1] >
                          0
                            ? "text-green-500"
                            : "text-red-600"
                        }
                      >
                        $
                        {(
                          parseFloat(currentItemModal[3][0]) * price -
                          parseFloat(currentItemModal[1][0][0]) *
                            currentItemModal[1][0][1]
                        ).toFixed(2)}
                      </span>
                    </p>
                  ) : (
                    <p>
                      <span className="font-bold">P/L:</span>{" "}
                      <span
                        className={
                          parseFloat(currentItemModal[1][1][0]) *
                            currentItemModal[1][1][1] -
                            parseFloat(currentItemModal[1][0][0]) *
                              currentItemModal[1][0][1] >
                          0
                            ? "text-green-500"
                            : "text-red-600"
                        }
                      >
                        $
                        {(
                          parseFloat(currentItemModal[1][1][0]) *
                            currentItemModal[1][1][1] -
                          parseFloat(currentItemModal[1][0][0]) *
                            currentItemModal[1][0][1]
                        ).toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button auto flat color="error" onClick={() => setVisible(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </main>
    </div> : null } </div>
  );
}
