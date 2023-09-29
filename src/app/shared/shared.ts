/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
// @ts-ignore
import detectEthereumProvider from '@metamask/detect-provider';
import { WALLET_NETWORK_CHAIN_NAME } from './web3-helpers';

import { v4 } from '@ixily/activ-web';
import { CryptoIdeasModule } from '@ixily/activ-web/dist/src/modules/activ-v4';
import { isNullOrUndefined } from 'src/app/helpers/helpers';

import { ethers } from "ethers";

let ethereum: any;

const valueToHexadecimal = (value: any) => {
  const data = ethers.utils.hexlify(value);
  const response = data.replace('0x', '0x-');
  return response;
};

export const getTickerIcon = async (ticker: string) => {
  const url = `https://technicals-rlco.ixily.io/v1/assets/${ticker}/logo`
  const data = await fetch(url)
  const response = await data.json()
  const base64 = response?.data
  return base64
}

const defaultChainInfo = {
  chainId: "0x13881",
  chainName: "Mumbai",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: [
    "https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78"
  ],
  blockExplorerUrls: [
    "https://mumbai.polygonscan.com"
  ],
};

export const getEthereum = async () => {
  try {
    if (isNullOrUndefined(ethereum) && (window as any)?.ethereum) {
      ethereum = await detectEthereumProvider();
    }
  } catch (err) {
    // console.log('getEthereum error', err.message);
  }
  return ethereum;
};

export const getDefaultAccount = async () => {
  let walletAddress: string = null as any;
  try {
    const ethereum = await getEthereum();
    if (ethereum) {
      const accounts = await ethereum?.request({
        method: 'eth_requestAccounts',
      });
      walletAddress =
        accounts?.find((account: any) => account) || (null as any);
    }
  } catch (err: any) {
    console.log('getDefaultAccount error', err.message);
  }

  return walletAddress;
};

export const getDefaultNetwork = async () => {
  let networkInfo: any = null as any;
  try {
    const ethereum = await getEthereum();
    if (ethereum) {
      const networkId = (window as any).ethereum.networkVersion;
      networkInfo = {
        id: networkId,
        name: WALLET_NETWORK_CHAIN_NAME(networkId),
      }
    }
  } catch (err: any) {
    console.log('getDefaultNetwork error', err.message);
  }

  return networkInfo;
};

export const defaultNetworkSwitch = async () => {

  let network = {
    id: null as any,
    name: null as any,
  };

  try {

    const provider: any = new ethers.providers.Web3Provider((window as any).ethereum);

    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: defaultChainInfo.chainId },
      ]);
    } catch (e) {
      const ethereum = await getEthereum();
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [defaultChainInfo],
      });
    }

    const data = WALLET_NETWORK_CHAIN_NAME(80001);

    network.id = defaultChainInfo.chainId;
    network.name = data;

  } catch (err: any) {
    console.log('defaultNetworkSwitch error', err.message);
  }

  return network;
};

export const litSigAuthExpirationCheck = (
  test = false
) => {
  try {

    console.log('[litSigAuthExpirationCheck] running...');

    const web3Provider = localStorage.getItem('lit-web3-provider');
    const keyPair = localStorage.getItem('lit-comms-keypair');
    const signature = localStorage.getItem('lit-auth-signature');

    if (web3Provider && keyPair && signature) {

      const sig = JSON.parse(signature);

      const signedMessage = sig?.signedMessage;

      const regex = /Expiration Time: ([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2})/gm;
      const match = regex.exec(signedMessage);

      if (match) {

        const expirationTime = match[1];
        const expirationDate = new Date(expirationTime);
        let now = new Date();

        // if test is true, we add 10 days to the current date to force the expiration 
        // and test the logic
        if (test) {
          const daysToIncrease = 10;
          const today = new Date();
          now = new Date(
            today.getFullYear(), today.getMonth(), today.getDate() + daysToIncrease
          );
        }

        // time difference
        const diff = expirationDate.getTime() - now.getTime();

        if (diff <= 0) {
          localStorage.removeItem('lit-web3-provider');
          localStorage.removeItem('lit-comms-keypair');
          localStorage.removeItem('lit-auth-signature');
          console.log('[litSigAuthExpirationCheck] expired');
          console.log('[litSigAuthExpirationCheck] removed');
        } else {
          console.log('[litSigAuthExpirationCheck] not expired');
          console.log('[litSigAuthExpirationCheck] the current auth is ok');
          console.log('[litSigAuthExpirationCheck] the current info will expire', expirationTime);
        }
      }
    }

  } catch (err) { }
}

export const displayImage = async (
  // simple string to know what process is calling this function (example: strategy, idea, etc)
  indicator: string,
  // the image object
  imgObj: v4.ITradeIdeaImage,
  // the default image to use if we can't find the image
  defaultImage?: string
) => {
  let check = false;

  let img;

  const restoreImageByCID = async (cid: string) => {
    return CryptoIdeasModule?.restoreImage(cid);
  };

  const displayImageErrorLog = (err: any) => {
    // console.log(`displayImage [${indicator}] (Error)`, err?.message);
  };

  try {
    if ((imgObj as any)?.startsWith('data:image')) {
      img = {
        type: 'b64',
        source: imgObj as string,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.b64) && !check) {
      if (imgObj?.b64?.startsWith('data:image')) {
        img = {
          type: 'b64',
          source: imgObj.b64,
        };
        check = true;
      }
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.url) && !check) {
      img = {
        type: 'url',
        source: imgObj.url,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  try {
    if (!isNullOrUndefined(imgObj?.cid) && !check) {
      const text = await restoreImageByCID(imgObj.cid as string);
      img = {
        type: 'b64',
        source: text,
      };
      check = true;
    }
  } catch (err) {
    displayImageErrorLog(err);
  }

  // console.log('');
  // console.log('==========================================');
  // console.log('displayImage (indicator)', indicator);
  // console.log('displayImage (imgObj)', imgObj);
  // console.log('displayImage (img)', img);
  // console.log('==========================================');
  // console.log('');

  return img;
};
