import { Injectable } from '@angular/core';

import { ethers } from "ethers";

const contractAddress = '0x1F4b87e36478EE89b6a6d32B3B0da75EBf57A602';

const abi = [
    "constructor()",
    "event ApprovalForAll(address indexed,address indexed,bool)",
    "event CredentialCreated(uint256,bytes16,address)",
    "event CredentialInfoViaPKP(tuple(bytes16,uint256,string,string,string,string,address,address),address)",
    "event Initialized(uint8)",
    "event TransferBatch(address indexed,address indexed,address indexed,uint256[],uint256[])",
    "event TransferSingle(address indexed,address indexed,address indexed,uint256,uint256)",
    "event URI(string,uint256 indexed)",
    "function balanceOf(address,uint256) view returns (uint256)",
    "function balanceOfBatch(address[],uint256[]) view returns (uint256[])",
    "function createCredential(string,string,string,string,address)",
    "function generateUUID() view returns (bytes16)",
    "function getCredentialById(uint256) view returns (tuple(bytes16,uint256,string,string,string,string,address,address))",
    "function getCredentialByIdViaPkp(uint256)",
    "function getCredentialByUUID(bytes16) view returns (tuple(bytes16,uint256,string,string,string,string,address,address))",
    "function getMyCredentials() view returns (tuple(bytes16,uint256,string,string,string,string,address,address)[])",
    "function getMyCredentialsTotal() view returns (uint256)",
    "function getTokenId(bytes16) view returns (uint256)",
    "function isApprovedForAll(address,address) view returns (bool)",
    "function safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
    "function safeTransferFrom(address,address,uint256,uint256,bytes)",
    "function setApprovalForAll(address,bool)",
    "function supportsInterface(bytes4) view returns (bool)",
    "function uri(uint256) view returns (string)"
];


export interface ICredentialNft {
    uuid: string;
    tokenId: number;
    provider: string;
    environment: string;
    accountName: string;
    encryptedCredential: {
        encryptedFileB64: string;
        encryptedSymmetricKeyString: string;
    };
    pkpAddress: string;
    owner: string;
};

@Injectable({
    providedIn: 'root',
})
export class NFTCredentialService {

    constructor() { }

    fillCredential(data: any): ICredentialNft {
        const [
            encryptedFileB64,
            encryptedSymmetricKeyString,
        ] = data[5]?.toString()?.split('||');

        const credential = {
            uuid: data[0]?.toString(),
            tokenId: Number(data[1]),
            provider: data[2]?.toString(),
            environment: data[3]?.toString(),
            accountName: data[4]?.toString(),
            encryptedCredential: {
                encryptedFileB64,
                encryptedSymmetricKeyString,
            },
            owner: data[6]?.toString(),
            pkpAddress: data[7]?.toString(),
        }

        return credential;
    }

    getContract() {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        return contract;
    };

    getContractAddress() {
        return contractAddress;
    };

    getContractAbi() {
        return abi;
    };

    async mintCredential(
        provider: string,
        accountName: string,
        environment: string,
        encryptedCredential: string,
        pkpAddress: string
    ): Promise<{
        tokenId: number,
        uuid: string
    }> {
        return new Promise(async (resolve, reject) => {
            try {

                const contract: any = this.getContract();

                const tx = await contract.createCredential(
                    provider,
                    accountName,
                    environment,
                    encryptedCredential,
                    pkpAddress
                );

                contract?.on('CredentialCreated', (tokenId: number, uuid: string) => {

                    const response = {
                        tokenId: Number(tokenId),
                        uuid: uuid?.toString(),
                    };

                    // console.log('mintCredential (response)', response);

                    resolve({
                        tokenId: response.tokenId,
                        uuid: response.uuid,
                    });
                });

                await tx.wait();

            } catch (err) {
                reject(err);
            }
        });
    }

    async getCredentialByUUID(uuid: string): Promise<ICredentialNft> {
        const contract: any = this.getContract();
        const data = await contract.getCredentialByUUID(uuid);

        let credential: ICredentialNft = null as any;

        if (data?.length > 0) {
            credential = this.fillCredential(data);
        }

        return credential;
    }

    async getpkpWalletAddress(pkpKey: string): Promise<string> {
        const contract: any = this.getContract();
        return contract.getpkpWalletAddress(pkpKey);
    }

    async getMyCredentialsTotal(): Promise<number> {
        const contract: any = this.getContract();
        const data = await contract.getMyCredentialsTotal();
        const total = Number(data);
        return total;
    }

    async getMyCredentials(
        pkpWalletAddress: string
    ): Promise<ICredentialNft[]> {
        const contract: any = this.getContract();
        const credentials = await contract.getMyCredentials();

        let credentialsFilled: ICredentialNft[] = credentials?.map((credential: any) => {
            return this.fillCredential(credential);
        });

        credentialsFilled = credentialsFilled?.filter((credential: any) => {
            return credential?.pkpAddress?.toLowerCase() === pkpWalletAddress?.toLowerCase();
        });

        return credentialsFilled;
    }

}
