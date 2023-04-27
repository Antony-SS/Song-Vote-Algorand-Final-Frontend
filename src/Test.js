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
  const [voteState1, setVoteState1] = useState("Vote");
  const [voteState2, setVoteState2] = useState("Vote");
  const [Count1, setCount1] = useState(0);
  const [Count2, setCount2] = useState(0);
  const [walletbalance, setwalletbalance] = useState();
  const [connector, setConnector] = useState();
  const [connected, setConnected] = useState(false);

  const app_address = 76747531;
  const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const port = '';
    const token = {
        'X-API-Key': "ECJheQUhsH7otnvVwGQhl5buaPqr280X6clyUd1Z"
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
        console.log("something didn't work in creating connector", error);
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

  setVoteState1("Sign txn in wallet");
  const result = await connector.sendCustomRequest(request);
  const decodedResult = result.map(element => {
    return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
  });
    setVoteState1("Processing. . .");
    await algodClient.sendRawTransaction(decodedResult).do();
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    console.log("Adding to Count1")
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
    if (transactionResponse['global-state-delta'] !== undefined ) {
      console.log("Global State updated:",transactionResponse['global-state-delta']);
      await getCount();
      }
    setVoteState1("Vote");
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
  
    setVoteState2("Sign txn in wallet");
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map(element => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
      // send and await
      setVoteState2("Processing. . .");
      await algodClient.sendRawTransaction(decodedResult).do();
      await algosdk.waitForConfirmation(algodClient, txId, 2);
      let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
      console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
      if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
        await getCount();
        }
      setVoteState2("Vote");
  }

  const getBalance = async () => {
    let accountinfo = await algodClient.accountInformation(currentAccount).do();
    console.log("Account Balance in Algo:", algosdk.microalgosToAlgos(accountinfo.amount));
    setwalletbalance(algosdk.microalgosToAlgos(accountinfo.amount));
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
    setVoteState1("Vote");
    setVoteState2("Vote");
    getBalance();
    console.log('currentAccount:', currentAccount);
  }, [currentAccount])

  return (
    <div className = "mainContainer">
      <div className = "dataContainer">
        <div className="header">
        🤪 Yooooo!
        </div>
        <div className="bio">
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
  const [voteState1, setVoteState1] = useState("Vote");
  const [voteState2, setVoteState2] = useState("Vote");
  const [Count1, setCount1] = useState(0);
  const [Count2, setCount2] = useState(0);
  const [walletbalance, setwalletbalance] = useState();
  const [connector, setConnector] = useState();
  const [connected, setConnected] = useState(false);

  const app_address = 76747531;
  const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const port = '';
    const token = {
        'X-API-Key': "ECJheQUhsH7otnvVwGQhl5buaPqr280X6clyUd1Z"
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
        console.log("something didn't work in creating connector", error);
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

  setVoteState1("Sign txn in wallet");
  const result = await connector.sendCustomRequest(request);
  const decodedResult = result.map(element => {
    return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
  });
    setVoteState1("Processing. . .");
    await algodClient.sendRawTransaction(decodedResult).do();
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    console.log("Adding to Count1")
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
    if (transactionResponse['global-state-delta'] !== undefined ) {
      console.log("Global State updated:",transactionResponse['global-state-delta']);
      await getCount();
      }
    setVoteState1("Vote");
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
  
    setVoteState2("Sign txn in wallet");
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map(element => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
      // send and await
      setVoteState2("Processing. . .");
      await algodClient.sendRawTransaction(decodedResult).do();
      await algosdk.waitForConfirmation(algodClient, txId, 2);
      let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
      console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
      if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
        await getCount();
        }
      setVoteState2("Vote");
  }

  const getBalance = async () => {
    let accountinfo = await algodClient.accountInformation(currentAccount).do();
    console.log("Account Balance in Algo:", algosdk.microalgosToAlgos(accountinfo.amount));
    setwalletbalance(algosdk.microalgosToAlgos(accountinfo.amount));
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
    setVoteState1("Vote");
    setVoteState2("Vote");
    getBalance();
    console.log('currentAccount:', currentAccount);
  }, [currentAccount])

  return (
    <div className = "mainContainer">
      <div className = "dataContainer">
        <div className="header">
        🤪 Yooooo!
        </div>
        <div className="bio">
        Shreya& Aishwarya here, Welcome to the song vote app.
Vote for the better music genre. Ensure your wallet is set to the testnet.
Rules: Unlimited voting, get to clicking!
        </div>
        <div className="bio">
        Rules: Unlimited voting, get to clicking!
        </div>

      
        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )} 
        
        {currentAccount && (
            <>
              {walletbalance <= 0.01 && (
                <>
                  <div className="bio" >
                    You don't have enough testalgo in your wallet to vote.  Follow the link below to the test Algo faucet, fund your account, then reload this page!
                  </div>
                  <a href="https://bank.testnet.algorand.network/" target="_blank">
                    <div className="faucetlink">
                      Test Algo Faucet
                    </div>
                  </a>
                </>
              )}
          {walletbalance > 0.01 && (
            <>
        <div className='songs-container'>
          <div className='row align-items-center'>
            <div className='col'>

              <div className='song-card'>
                <div className = "title">
                  EDM
                </div>
                <div className='count'>
                  {Count1}
                </div> 
                <button className="mathButton" onClick={addC1}>
                  {voteState1}
                </button>
              </div>
            </div>
            <div className='col align-itmes-center'>
              <div className='song-card'>
                <div className = "title">
                  Country
                </div>
                <div className='count'>
                  {Count2}
                </div>
                <button className="mathButton" onClick={addC2}>
                  {voteState2}
                </button>
              </div>
            </div>
            </div>
        </div>
        </>
        )}
        <button className="disconnectwalletButton" onClick={disconnectWallet}>
          Disconnect Wallet
        </button>
        </>
        )} 
      </div>
    </div>
  );
}

export default App;
        </div>
        <div className="bio">
        Rules: Unlimited voting, get to clicking!
        </div>

      
        {!currentAccount && (
          <button className="walletButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )} 
        
        {currentAccount && (
            <>
              {walletbalance <= 0.01 && (
                <>
                  <div className="bio" >
                    You don't have enough testalgo in your wallet to vote.  Follow the link below to the test Algo faucet, fund your account, then reload this page!
                  </div>
                  <a href="https://bank.testnet.algorand.network/" target="_blank">
                    <div className="faucetlink">
                      Test Algo Faucet
                    </div>
                  </a>
                </>
              )}
          {walletbalance > 0.01 && (
            <>
        <div className='songs-container'>
          <div className='row align-items-center'>
            <div className='col'>

              <div className='song-card'>
                <div className = "title">
                  EDM
                </div>
                <div className='count'>
                  {Count1}
                </div> 
                <button className="mathButton" onClick={addC1}>
                  {voteState1}
                </button>
              </div>
            </div>
            <div className='col align-itmes-center'>
              <div className='song-card'>
                <div className = "title">
                  Country
                </div>
                <div className='count'>
                  {Count2}
                </div>
                <button className="mathButton" onClick={addC2}>
                  {voteState2}
                </button>
              </div>
            </div>
            </div>
        </div>
        </>
        )}
        <button className="disconnectwalletButton" onClick={disconnectWallet}>
          Disconnect Wallet
        </button>
        </>
        )} 
      </div>
    </div>
  );
}

export default App;
