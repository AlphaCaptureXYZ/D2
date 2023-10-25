import { environment } from "src/environments/environment";

export const SINGLE_DEMO_FUND_STRATEGY_REFERENCE = '9631b2de4627b706b95299';
export const PORTFOLIO_DEMO_FUND_STRATEGY_REFERENCE = '90e3h6a7bdcf42647f76c8';

export const WALLET_NETWORK_CHAIN_IDS_OPTS = {
  goerli: 5,
  hardhat: 1337,
  kovan: 42,
  ethereum: 1,
  rinkeby: 4,
  ropsten: 3,
  maticmum: 0xa4ec,
  sepolia: 11155111,
  polygon: 137,
  mumbai: 80001,
  bnb: 56,
};

let supportedNetworkAllArrayObj = [
  {
    name: 'polygon',
    testnet: false,
  },
  // {
  //   name: 'ethereum',
  //   testnet: false,
  // },
  {
    name: 'mumbai',
    testnet: true,
  },
  // {
  //   name: 'goerli',
  //   testnet: true,
  // },
  // {
  //   name: 'hardhat',
  //   testnet: true,
  // },
] as const;

export const getSupportedNetworkAllArrayObj = () => {
  let data = [];
  if (environment.demoEnv) {
    data = supportedNetworkAllArrayObj.filter((item) => item.testnet);
  } else {
    data = supportedNetworkAllArrayObj.filter((item) => !item.testnet);
  }
  return data;
}

export const supportedNetworkAll =
  getSupportedNetworkAllArrayObj().map((item) => item.name);

export const supportedNetworkMainnet =
  getSupportedNetworkAllArrayObj().filter(
    (item) => !item.testnet
  ).map((item) => item.name);


export const supportedNetworkTestnet =
  getSupportedNetworkAllArrayObj().filter(
    (item) => item.testnet
  ).map((item) => item.name);

export function isSupportedNetwork(network: string) {
  return supportedNetworkAll?.includes(network?.toLowerCase() as any);
}
export function isMainnet(network: string) {
  return supportedNetworkMainnet?.includes(network?.toLowerCase() as any);
}
export function isTestnet(network: string) {
  return supportedNetworkTestnet?.includes(network?.toLowerCase() as any);
}

export type IWalletNetworkChain = keyof typeof WALLET_NETWORK_CHAIN_IDS_OPTS;

export const WALLET_NETWORK_CHAIN_IDS = (
  index: IWalletNetworkChain
): number => {
  return WALLET_NETWORK_CHAIN_IDS_OPTS[index];
};

export const WALLET_NETWORK_CHAIN_NAME = (
  index: number
): IWalletNetworkChain => {
  const name = Object.keys(WALLET_NETWORK_CHAIN_IDS_OPTS).find(
    (key) => (WALLET_NETWORK_CHAIN_IDS_OPTS as any)[key] === Number(index)
  );
  return name as IWalletNetworkChain;
};