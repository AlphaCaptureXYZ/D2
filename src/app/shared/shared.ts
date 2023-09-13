/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
// @ts-ignore
import detectEthereumProvider from '@metamask/detect-provider';

let ethereum: any;

export function isNullOrUndefined(value: any) {
  const checkValue = [
    undefined,
    null,
    'undefined',
    'UNDEFINED',
    'Undefined',
    'null',
    'NULL',
    'Null',
    'NONE',
    'None',
    'none',
  ]?.includes(value)
    ? undefined
    : value;
  const check = checkValue === undefined || null ? true : false;
  return check;
}

export function wait(time = 1000): Promise<any> {
  return new Promise<void>((resolve, reject) => {
    try {
      const interval = setInterval(() => {
        clearInterval(interval);
        resolve();
      }, time);
    } catch (err) {
      reject();
    }
  });
}

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