import { Injectable } from '@angular/core';

import { BigNumber, ethers } from "ethers";
import { getDefaultNetwork, getEthereum } from '../shared/shared';

const ECDSA_KEY = 2;

const pkpNftContractAddress = '0x8F75a53F65e31DD0D2e40d0827becAaE2299D111';

const pkpNftAbi = [
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

const pkpPermissionsContractAddress = '0x4Aed2F242E806c58758677059340e29E6B5b7619';

const pkpPermissionsAbi = [
    "constructor(address)",
    "event OwnershipTransferred(address indexed,address indexed)",
    "event PermittedAuthMethodAdded(uint256 indexed,uint256,bytes,bytes)",
    "event PermittedAuthMethodRemoved(uint256 indexed,uint256,bytes)",
    "event PermittedAuthMethodScopeAdded(uint256 indexed,uint256,bytes,uint256)",
    "event PermittedAuthMethodScopeRemoved(uint256 indexed,uint256,bytes,uint256)",
    "event RootHashUpdated(uint256 indexed,uint256 indexed,bytes32)",
    "function addPermittedAction(uint256,bytes,uint256[])",
    "function addPermittedAddress(uint256,address,uint256[])",
    "function addPermittedAuthMethod(uint256,tuple(uint256,bytes,bytes),uint256[])",
    "function addPermittedAuthMethodScope(uint256,uint256,bytes,uint256)",
    "function authMethods(uint256) view returns (uint256, bytes, bytes)",
    "function getAuthMethodId(uint256,bytes) pure returns (uint256)",
    "function getEthAddress(uint256) view returns (address)",
    "function getPermittedActions(uint256) view returns (bytes[])",
    "function getPermittedAddresses(uint256) view returns (address[])",
    "function getPermittedAuthMethodScopes(uint256,uint256,bytes,uint256) view returns (bool[])",
    "function getPermittedAuthMethods(uint256) view returns (tuple(uint256,bytes,bytes)[])",
    "function getPubkey(uint256) view returns (bytes)",
    "function getTokenIdsForAuthMethod(uint256,bytes) view returns (uint256[])",
    "function getUserPubkeyForAuthMethod(uint256,bytes) view returns (bytes)",
    "function isPermittedAction(uint256,bytes) view returns (bool)",
    "function isPermittedAddress(uint256,address) view returns (bool)",
    "function isPermittedAuthMethod(uint256,uint256,bytes) view returns (bool)",
    "function isPermittedAuthMethodScopePresent(uint256,uint256,bytes,uint256) view returns (bool)",
    "function owner() view returns (address)",
    "function pkpNFT() view returns (address)",
    "function removePermittedAction(uint256,bytes)",
    "function removePermittedAddress(uint256,address)",
    "function removePermittedAuthMethod(uint256,uint256,bytes)",
    "function removePermittedAuthMethodScope(uint256,uint256,bytes,uint256)",
    "function renounceOwnership()",
    "function setPkpNftAddress(address)",
    "function setRootHash(uint256,uint256,bytes32)",
    "function transferOwnership(address)",
    "function verifyState(uint256,uint256,bytes32[],bytes32) view returns (bool)",
    "function verifyStates(uint256,uint256,bytes32[],bool[],bytes32[]) view returns (bool)"
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

    private async getContract(
        contractAddress: string,
        abi: any
    ) {
        const signer = await this.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        return contract;
    };

    private async mintCost(
        contract: any = null
    ): Promise<MultiETHFormat> {

        if (!contract) {
            contract = await this.getContract(
                pkpNftContractAddress,
                pkpNftAbi
            );
        };

        const v = await contract.mintCost();

        let cost: MultiETHFormat = {
            wei: v,
            eth: ethers.utils.formatUnits(v),
            arg: ethers.BigNumber.from(v),
        };

        return cost;
    }

    async mint(
        contract: any = null
    ) {
        const response = {
            tx: null as any,
            tokenId: null as any,
            pkpPublicKey: null as any,
            pkpWalletAddress: null as any,
        };

        try {
            if (!contract) {
                contract = await this.getContract(
                    pkpNftContractAddress,
                    pkpNftAbi
                );
            };

            const mintCost = await this.mintCost();

            const tx = await contract.mintNext(ECDSA_KEY, { value: mintCost.arg });

            const res = await tx.wait();

            const tokenIdFromEvent = res.events[0].topics[3];

            response.tx = tx;
            response.tokenId = tokenIdFromEvent;

            const pubKey = await contract.getPubkey(tokenIdFromEvent);

            response.pkpPublicKey = pubKey;
            response.pkpWalletAddress = ethers.utils.computeAddress(pubKey);

            await getDefaultNetwork();

        } catch (err: any) {
            console.log('mint ERROR', err.message);
        }

        return response;
    }

    async addAccess(
        pkpId: any,
        walletAddress: string,
        contract: any = null
    ) {
        let addresses = [];

        try {

            if (!contract) {
                contract = await this.getContract(
                    pkpPermissionsContractAddress,
                    pkpPermissionsAbi
                );
            };

            await contract.addPermittedAddress(
                pkpId,
                walletAddress,
                []
            );

            addresses = await this.getWalletsWithAccess(pkpId, contract);

        } catch (err: any) {
            console.log('mint ERROR', err.message);
        }

        return addresses;
    }

    async getWalletsWithAccess(
        tokenId: any,
        contract: any = null
    ) {
        let addresses = [];

        try {

            if (!contract) {
                contract = await this.getContract(
                    pkpPermissionsContractAddress,
                    pkpPermissionsAbi
                );
            };

            const maxTries = 5;
            let tries = 0;

            while (tries < maxTries) {
                try {
                    addresses = await contract.getPermittedAddresses(tokenId);
                    if (addresses.length <= 0) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        tries++;
                        continue;
                    } else {
                        break;
                    }
                } catch (e: any) {
                    tries++;
                }
            }

        } catch (err: any) {
            console.log('getWalletsWithAccess ERROR', err.message);
        }

        await getDefaultNetwork();

        return addresses;
    }

}
