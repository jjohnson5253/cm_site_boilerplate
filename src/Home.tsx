import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import "./Home.css";

import Background from './underwater_bg.jpg';
import puffer_sequence from './puffer_sequence.gif'
import title_logo from './title_logo.png'

//import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  /*shortenAddress,*/
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)`
background-color:#F17B28;
color:black;
font-weight: bold;`
;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)`
background-color:#F17B28;
color:black;
font-weight: bold;`; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  //const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  //const [itemsAvailable, setItemsAvailable] = useState(0);
  //const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        //itemsAvailable,
        itemsRemaining,
        //itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      //setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      //setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        //const balance = await props.connection.getBalance(wallet.publicKey);
        //setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        //const balance = await props.connection.getBalance(wallet.publicKey);
        //setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    props.connection,
  ]);

  return (
    <main style={{
      display:"flex",
      /*backgroundColor: "red",*/
      backgroundImage: `url(${Background})`,
      height: "100vh",
      backgroundPosition: "center center",
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      }}>

      <div style={{
        padding: 30,
        /*backgroundColor:"red",*/
        display:"flex",
        flex: 1,
        flexDirection: "column",
        maxWidth: "800px",
        marginLeft: "auto",
        marginRight: "auto",
      }}>

      <div
        style={{
          /*backgroundColor: "green",*/
          display: "flex",
          /*justifyContent: "space-between",*/
        }}>
        <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/">
          <i className='fab fa-twitter fa-2x'></i>
        </a>
        <div style={{
          marginLeft:'15px',
        }}>
        <a target="_blank" rel="noopener noreferrer" href="https://www.discord.gg/JGFyenFtsy">
          <i className='fab fa-discord fa-2x' ></i>
        </a>
        </div>
        <div
        style={{
          textAlign: 'center',
          flex:'1 0 auto',
          marginLeft:'35px',
        }}>
        <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/">
        <img
          height='60px'
          src={title_logo} alt="title_logo"/> </a>
        </div>
        {/*{wallet && (
          <p>Wallet {shortenAddress(wallet.publicKey.toBase58() || "")}</p>
        )}*/}
        <div></div>
        <div style={{
          float:"right",
        }}>
        <ConnectButton>
          {wallet ? "Connected" : "Connect Wallet"}
        </ConnectButton>
        </div>
      </div>

      <div
        style={{
          /*backgroundColor: "blue",*/
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          flexDirection: "column",
        }}
      >

      <img 
        src={puffer_sequence}
        alt="puffer_sequence"
        height='350px'
      />

        <MintContainer>
            <MintButton
              disabled={isSoldOut || isMinting || !isActive}
              onClick={onMint}
              variant="contained"
            >
              {isSoldOut ? (
                "SOLD OUT"
              ) : isActive ? (
                isMinting ? (
                  <CircularProgress />
                ) : (
                  "MINT"
                )
              ) : (
                <Countdown
                  date={startDate}
                  onMount={({ completed }) => completed && setIsActive(true)}
                  onComplete={() => setIsActive(true)}
                  renderer={renderCounter}
                />
              )}
            </MintButton>
        </MintContainer>

        <div>
        {/*}{wallet && <p>Total Available: {itemsAvailable}</p>}{*/}

        {/*}{wallet && <p>Redeemed: {itemsRedeemed}</p>}{*/}
        <div style={{
          textShadow: "0 0 5px #000",
        }}>
        {wallet && <p>Remaining: {itemsRemaining}</p>}
        </div>
        </div>
      </div>



      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>

      </div>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
