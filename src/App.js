import React, { useEffect, useState } from 'react';
import './App.css';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";


// this next import will only be for me... will cover how to deal with .envs in replit in tutorial
import dotenv from "dotenv";
dotenv.config();

const App = () => {
  const [currentAccount, setCurrentAccount] = useState();
  const [Count1, setCount1] = useState(0);
  const [Count2, setCount2] = useState(0);
  const [walletbalance, setwalletbalance] = useState();
  const [connector, setConnector] = useState();
  const [connected, setConnected] = useState(false);

  const app_address = 76747531;
  const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const port = '';
    const token = {
        'X-API-Key': process.env.REACT_APP_API_KEY
    }
    const algodClient = new algosdk.Algodv2(token, baseServer, port);

    const checkIfWalletIsConnected = async () => {
      try {
        if (!connected) {
          console.log("No connection");
          return;
        } else {
          console.log("We have connection", connector);
        }

        const { accounts }  = connector;
  
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
          // await getAllRecs(); IMPORTANT FOR FUNCTIONALITY LATER
        } else {
          setCurrentAccount();
          console.log("No authorized account found");
        }
      } catch (error) {
        console.log(error);
      }
    }

    const disconnectWallet = async () => {
      connector.killSession();
      console.log("Killing session for wallet with address: ", currentAccount);
      setCurrentAccount();
      setConnector();
      setConnected(false);
    }
  
    const connectWallet = async () => {
      try {
        const bridge = "https://bridge.walletconnect.org";
        const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
        setConnector(connector);

        if (!connector.connected) {
          await connector.createSession();
          console.log("Creating new connector session");
        }

        connector.on("connect", (error, payload) => {
          if (error) {
            throw error;
          }
          // Get provided accounts
          const { accounts } = payload.params[0];
          console.log("connector.on connect: Connected an account with address:", accounts[0]);
          setConnector(connector);
          setConnected(true);
          setCurrentAccount(accounts[0]);
        });

        connector.on("session_update", (error, payload) => {
          if (error) {
            throw error;
          }
          // Get updated accounts 
          const { accounts } = payload.params[0];
          setCurrentAccount(accounts[0])
        });

        connector.on("disconnect", (error, payload) => {
          if (error) {
            throw error;
          }
          setCurrentAccount();
          setConnected(false);
          setConnector();
        });
        
        if (connector.connected) {
          const {accounts} = connector;
          const account = accounts[0];
          setCurrentAccount(account);
          setConnected(true);
        }
      } catch(error) {
        console.log("someething didn't work in creating connector", error);
      }
    }

  const addC1 = async () => {
    let sender = currentAccount;
    let appArgs = [];
    appArgs.push(new Uint8Array(Buffer.from("AddC1")));
    let params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationNoOpTxn(sender, params, app_address, appArgs);
    let txId = txn.txID().toString();

    // time to sign . . . which we have to do with walletconnect
    const txns = [txn]
    const txnsToSign = txns.map(txn => {
      const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
      return {
        txn: encodedTxn,
    };
  });
  const requestParams = [ txnsToSign ];
  const request = formatJsonRpcRequest("algo_signTxn", requestParams);

  const result = await connector.sendCustomRequest(request);
  const decodedResult = result.map(element => {
    return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
  });
    // send and await
    await algodClient.sendRawTransaction(decodedResult).do();
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    console.log("Adding to Count1")
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
    if (transactionResponse['global-state-delta'] !== undefined ) {
      console.log("Global State updated:",transactionResponse['global-state-delta']);
      await getCount();
      }
  }
    const addC2 = async () => {
      let sender = currentAccount;
      let appArgs = [];
      appArgs.push(new Uint8Array(Buffer.from("AddC2")));
      let params = await algodClient.getTransactionParams().do();
      const txn = algosdk.makeApplicationNoOpTxn(sender, params, app_address, appArgs);
      let txId = txn.txID().toString();
  
      // time to sign . . . which we have to do with walletconnect
      const txns = [txn]
      const txnsToSign = txns.map(txn => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
        return {
          txn: encodedTxn,
      };
    });
    const requestParams = [ txnsToSign ];
    const request = formatJsonRpcRequest("algo_signTxn", requestParams);
  
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map(element => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
      // send and await
      await algodClient.sendRawTransaction(decodedResult).do();
      await algosdk.waitForConfirmation(algodClient, txId, 2);
      let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
      console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
      if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
        await getCount();
        }
  }

  const getCount = async () => {
      let applicationInfoResponse = await algodClient.getApplicationByID(app_address).do();
      let globalState = []
      globalState = applicationInfoResponse['params']['global-state']
      console.log("Count1: ", globalState[0]['value']['uint']);
      setCount1(globalState[0]['value']['uint']);
      console.log("Count2: ", globalState[1]['value']['uint']);
      setCount2(globalState[1]['value']['uint']);
    }

  useEffect(() => {
    checkIfWalletIsConnected();
    getCount();
    console.log('currentAccount:', currentAccount);
  }, [currentAccount])

  return (
    <div className = "mainContainer">
      <div className = "dataContainer">
        <div className="header">
        🤪 Yooooo!
        </div>
        <div className="bio">
        Antony here. Trying to settle a debate.  Vote on the better song.
        </div>
        {!currentAccount && (
          <button className="mathButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )} 
        {currentAccount && (
        <>
          <div className = "count">
           Mr. Brightside: {Count1}
        </div>
        <div className = "count">
          Pursuit of Happiness: {Count2}
        </div>
        <button className="mathButton" onClick={addC1}>
          Vote for Mr. Brightside
        </button>
        <button className="mathButton" onClick={addC2}>
          Vote for Pursuit of Happiness
        </button>
        <button className="mathButton" onClick={disconnectWallet}>
          Disconnect Wallet
        </button>
        </>
        )} 
      </div>
    </div>
  );
}

export default App;