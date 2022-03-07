import React, { useEffect, useState } from 'react';
import './App.css';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";

const App = () => {

  const add = () => {
    
  }
    const deduct = () => {
    
  }
  
  
  return (
    <div className = "mainContainer">
      <div className = "dataContainer">
        <div className="header">
        🤪 Yooooo!
        </div>
        <div className="bio">
        Antony here.  I'm happy you made it this far! You're well on your way to creating your first dapp on Algorand! 
        </div>
        <button className="mathButton" onClick={add}>
          Add
        </button>
        <button className="mathButton" onClick={deduct}>
          Deduct
        </button>
      </div>
    </div>
  );
}

export default App;