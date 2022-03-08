import React, { useEffect, useState } from 'react';
import './App.css';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState();
  const [globalCount, setGlobalCount] = useState(0);
  const [walletbalance, setwalletbalance] = useState();
  const [connector, setConnector] = useState();
  const [connected, setConnected] = useState(false);

  const app_address = 75459438;

    const checkIfWalletIsConnected = async () => {
      try {
        if (!connector.connected) {
          console.log("No connection");
          return;
        } else {
          console.log("We have connection", connector);
          setConnected(true);
          setConnector(connector);
        }
        const { accounts }  = connector;
  
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
          // await getAllRecs(); IMPORTANT FOR FUNCTIONALITY LATER
        } else {
          setCurrentAccount();
          console.log("No authorized account found")
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



  const add = () => {
    
  }
    const deduct = () => {
    
  }

  useEffect(() => {
    console.log('currentAccount:', currentAccount);
  }, [currentAccount])

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className = "mainContainer">
      <div className = "dataContainer">
        <div className="header">
        🤪 Yooooo!
        </div>
        <div className="bio">
        Antony here.  I'm happy you made it this far! You're well on your way to creating your first dapp on Algorand! 
        </div>
        {!currentAccount && (
          <button className="mathButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )} 
        {currentAccount && (
        <>
        <button className="mathButton" onClick={add}>
          Add
        </button>
        <button className="mathButton" onClick={deduct}>
          Deduct
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