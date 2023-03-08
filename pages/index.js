import Head from "next/head";
import { ConnectButton, useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { Input, useInput, Loading, Button, Text, Modal, Row, Checkbox } from "@nextui-org/react";
import { useSigner } from "wagmi";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from 'react-toastify';
import Web3 from "web3";
//const Alchemy = require("alchemy-sdk");

import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useProvider
} from 'wagmi';

const ABI = [
	{
		"inputs": [],
		"name": "payFee",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_fee",
				"type": "uint256"
			}
		],
		"name": "setFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_days",
				"type": "uint256"
			}
		],
		"name": "setTrialDays",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "startTrial",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "feePaid",
		"outputs": [
			{
				"internalType": "bool",
				"name": "_isUser",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "trialDays",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "trialUsers",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

//change to contract address on mainnet
const contractAddress = "0x7cb71787ed12F244B22d93B3c98c878ecCA53b61";
// const config = {
//   apiKey: "izFKWbkrS_ZpDmLO_4J95Wc_5Uf0DV6z",
//   //change to mainnet
//   network: Alchemy.Network.ETH_GOERLI,
// };
// const alchemy = new Alchemy.Alchemy(config);

const node_link = "https://eth-goerli.g.alchemy.com/v2/9GwOhX6bs6tGSM6dFVLaGIwycs0SrCmW"

export async function getServerSideProps(context) {
  const web3 = new Web3(node_link);
  const contract = new web3.eth.Contract(ABI, contractAddress);
  const fee = await contract.methods.fee().call();
  return {
    props: {
      fee
    }
  }
}

export default function Home({ fee }) {
  const [isLoading, setLoading] = useState(false);
  const { value: iValue, reset, bindings: iBindings } = useInput("");
  const router = useRouter();
  const { isConnected } = useAccount();

  const addRecentTransaction = useAddRecentTransaction();

  const [uAddress, setUAddress] = useState(null);
  const [trial, setTrial] = useState(false);
  const { data: signer } = useSigner();

  const web3 = new Web3(node_link);
  const contract = new web3.eth.Contract(ABI, contractAddress);

  const [visible, setVisible] = useState(false);
  const handler = () => setVisible(true);

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: ABI,
    functionName: 'payFee',
    overrides: {
      value: fee,
    },
  })
  const { data, isLoading: isBuyLoading, isError: isBuyError, isSuccess, writeAsync: buy } = useContractWrite(config)

  const { config: trialConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: ABI,
    functionName: 'startTrial',
  })
  const { data: trialData, isError: isTrialError, isLoading: isTrialLoading, isSuccess: isTrialSuccess, writeAsync: startTrial } = useContractWrite(trialConfig)

  const closeHandler = () => {
    setVisible(false);
  };

  useEffect(() => {
    async function getAddress() {
      const adddress = await signer?.getAddress();
      setUAddress(adddress || null);
      if (adddress) {
        const trialPeriod = await contract.methods.trialUsers(adddress).call();
        trialPeriod == 0 ? setTrial(true) : setTrial(false);
      }
      //setUAddress("0x4d39228995207e12D3C4F019835FDE99E6E90522")
    }

    getAddress();
  });

  // if (!/^0x[a-fA-F0-9]{40}$/.test(address))
  return (
    <div>
      <Head>
        <title>NFT Portfolio</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {/* <div className="right-0 mr-5 mt-5 absolute">
          <ConnectButton chainStatus="none" />
        </div> */}
        <div className="items-center align-middle justify-center flex m-auto h-screen flex-col">
        <Text
      h1
      size={60}
      css={{
        textGradient: "45deg, $blue600 -20%, $pink600 50%",
      }}
      weight="bold"
    >
      Real-Time NFT Financial Insights & Analytics
    </Text>
    <Text
      h1
      size={20}
      css={{
        textGradient: "45deg, $yellow600 -20%, $red600 100%",
      }}
      weight="bold"
    >
      Enter a wallet to track their NFT portfolio
    </Text>
          <div className="my-10">
            <Input
            {...iBindings}
              clearable
              
              color="primary"
              labelPlaceholder="Enter a wallet address"
              contentRight={
                isLoading ? (
                  <Loading size="xs" />
                ) : (
                  <Button
                    className="bg-black"
                    auto
                    onPress={async () => {
                      setLoading(true);
                      // if (!isConnected) {
                      if (false) {
                        setLoading(false);
                        toast.error("Please connect your wallet")
                      } else {
                      //const fee = await contract.methods.feePaid(uAddress).call();
                      if (!/^0x[a-fA-F0-9]{40}$/.test(iValue)) {
                        setLoading(false);
                        toast.error("Invalid wallet address")
                      } else if (/*!fee*/false) {
                        setLoading(false);
                        handler();
                      }  else {
                        setLoading(true);
                        router.push(`/portfolio/${iValue}`)
                      }
                    }}}
                  >
                    {"→"}
                  </Button>
                )
              }
              className="w-[60vw]"
            />
          </div>
        </div>
        <Modal
        closeButton
        aria-labelledby="modal-title"
        open={visible}
        onClose={closeHandler}
      >
        <Modal.Header>
          <Text id="modal-title" size={18} className="font-bold">
            Fee Not Paid
          </Text>
        </Modal.Header>
        <Modal.Body>
          {trial ? <Text>This product costs {web3.utils.fromWei(fee)} ETH to use. You can begin your trial below.</Text> : <Text>This product costs {web3.utils.fromWei(fee)} ETH to use. You can pay below. Once you pay, you're Ethereum address will be whitelisted for life.</Text> }
        </Modal.Body>
        <Modal.Footer>
          <Button auto flat color="error" onClick={closeHandler}>
            Close
          </Button>
          {!trial ? <Button auto color="success" onClick={async ()=>{

            await buy();
            // addRecentTransaction({
            //   hash: data.hash(),
            //   description: "Paid the fee to use the product"
            // })
            closeHandler();
          }}>
            Pay
          </Button> : <Button auto color="success" onClick={async ()=>{

await startTrial();
// addRecentTransaction({
//   hash: data.hash(),
//   description: "Paid the fee to use the product"
// })
closeHandler();
}}>
Start Trial
</Button>
}
        </Modal.Footer>
      </Modal>
      </main>
    </div>
  );
}
