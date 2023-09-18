import { Injectable } from '@angular/core';

import { BigNumber, ethers } from "ethers";
import { getEthereum } from '../shared/shared';

const ECDSA_KEY = 2;

const contractAddress = '0x8F75a53F65e31DD0D2e40d0827becAaE2299D111';

const abi = [
    'constructor()',
    'event Approval(address indexed,address indexed,uint256 indexed)',
    'event ApprovalForAll(address indexed,address indexed,bool)',
    'event FreeMintSignerSet(address indexed)',
    'event MintCostSet(uint256)',
    'event OwnershipTransferred(address indexed,address indexed)',
    'event PKPMinted(uint256 indexed,bytes)',
    'event PkpNftMetadataAddressSet(address indexed)',
    'event PkpPermissionsAddressSet(address indexed)',
    'event PkpRouted(uint256 indexed,uint256 indexed)',
    'event RouterAddressSet(address indexed)',
    'event Transfer(address indexed,address indexed,uint256 indexed)',
    'event Withdrew(uint256)',
    'function approve(address,uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function burn(uint256)',
    'function exists(uint256) view returns (bool)',
    'function freeMintGrantAndBurnNext(uint256,uint256,bytes,bytes32,uint8,bytes32,bytes32) returns (uint256)',
    'function freeMintNext(uint256,uint256,bytes32,uint8,bytes32,bytes32) returns (uint256)',
    'function freeMintSigTest(uint256,bytes32,uint8,bytes32,bytes32) view',
    'function freeMintSigner() view returns (address)',
    'function getApproved(uint256) view returns (address)',
    'function getEthAddress(uint256) view returns (address)',
    'function getPubkey(uint256) view returns (bytes)',
    'function getUnmintedRoutedTokenIdCount(uint256) view returns (uint256)',
    'function isApprovedForAll(address,address) view returns (bool)',
    'function mintCost() view returns (uint256)',
    'function mintGrantAndBurnNext(uint256,bytes) payable returns (uint256)',
    'function mintGrantAndBurnSpecific(uint256,bytes)',
    'function mintNext(uint256) payable returns (uint256)',
    'function mintSpecific(uint256)',
    'function name() view returns (string)',
    'function owner() view returns (address)',
    'function ownerOf(uint256) view returns (address)',
    'function pkpNftMetadata() view returns (address)',
    'function pkpPermissions() view returns (address)',
    'function pkpRouted(uint256,uint256)',
    'function prefixed(bytes32) pure returns (bytes32)',
    'function redeemedFreeMintIds(uint256) view returns (bool)',
    'function renounceOwnership()',
    'function router() view returns (address)',
    'function safeTransferFrom(address,address,uint256)',
    'function safeTransferFrom(address,address,uint256,bytes)',
    'function setApprovalForAll(address,bool)',
    'function setFreeMintSigner(address)',
    'function setMintCost(uint256)',
    'function setPkpNftMetadataAddress(address)',
    'function setPkpPermissionsAddress(address)',
    'function setRouterAddress(address)',
    'function supportsInterface(bytes4) view returns (bool)',
    'function symbol() view returns (string)',
    'function tokenByIndex(uint256) view returns (uint256)',
    'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
    'function tokenURI(uint256) view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function transferFrom(address,address,uint256)',
    'function transferOwnership(address)',
    'function unmintedRoutedTokenIds(uint256,uint256) view returns (uint256)',
    'function withdraw()',
];

const LitChainInfo = {
    chainId: "0x2AC49",
    chainName: "Chronicle - Lit Protocol Testnet",
    nativeCurrency: {
        name: "LIT",
        symbol: "LIT",
        decimals: 18,
    },
    rpcUrls: ["https://chain-rpc.litprotocol.com/http"],
    blockExplorerUrls: ["https://chain.litprotocol.com"],
};

interface MultiETHFormat {
    wei: number;
    eth: number | string;
    arg: BigNumber;
}

@Injectable({
    providedIn: 'root',
})
export class PKPGeneratorService {

    constructor() { }

    private getProvider() {
        const provider: any = new ethers.providers.Web3Provider((window as any).ethereum);
        return provider;
    }

    private async getSigner() {
        let provider: any = this.getProvider();

        try {
            await provider.send("wallet_switchEthereumChain", [
                { chainId: LitChainInfo.chainId },
            ]);
        } catch (e) {
            const ethereum = await getEthereum();
            await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [LitChainInfo],
            });
        }

        provider = this.getProvider();
        const signer = await provider.getSigner();
        return signer;
    }

    private async getContract() {
        const signer = await this.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        return contract;
    };

    private async mintCost(): Promise<MultiETHFormat> {
        const contract: any = await this.getContract();
        const v = await contract.mintCost();

        let cost: MultiETHFormat = {
            wei: v,
            eth: ethers.utils.formatUnits(v),
            arg: ethers.BigNumber.from(v),
        };

        return cost;
    }

    async mint() {
        const response = {
            tx: null as any,
            tokenId: null as any,
            pkpPublicKey: null as any,
            pkpWalletAddress: null as any,
            url: null as any,
        };

        try {
            const contract: any = await this.getContract();

            const mintCost = await this.mintCost();

            const tx = await contract.mintNext(ECDSA_KEY, { value: mintCost.arg });

            const res = await tx.wait();

            const tokenIdFromEvent = res.events[0].topics[3];

            response.tx = tx;
            response.tokenId = tokenIdFromEvent;

            const pubKey = await contract.getPubkey(tokenIdFromEvent);

            response.pkpPublicKey = pubKey;
            response.pkpWalletAddress = ethers.utils.computeAddress(pubKey);
            response.url = `https://explorer.litprotocol.com/pkps/${tokenIdFromEvent}`;

        } catch (err: any) {
            console.log('mint ERROR', err.message);
        }

        return response;
    }



}
