//@ts-ignore
import * as LitJsSdk from "lit-js-sdk";

import * as LitNodeClient from '@lit-protocol/lit-node-client';

import { ethers } from "ethers";

import { isNullOrUndefined } from "src/app/helpers/helpers";

const client = new LitJsSdk.LitNodeClient({
    alertWhenUnauthorized: false,
    minNodeCount: 10,
    litNetwork: 'serrano',
    debug: false,
});

class Lit {
    litNodeClient: any;
    provider: any;

    async connect() {
        await client.connect();
        this.litNodeClient = client;
    }

    private getProvider() {
        if (isNullOrUndefined(this.provider)) {
            this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
        }
        return this.provider;
    }

    private async getChain() {
        const provider = this.getProvider();
        const network = await provider.getNetwork();

        const chainObj: any = {
            137: 'polygon',
            80001: 'mumbai'
        };

        const chain = chainObj[network.chainId] || null;

        console.log('Lit getChain (chain)', chain);

        return chain as string;
    }

    private base64StringToBlob(base64Data: string): Blob {
        const contentType = 'application/octet-stream;base64';
        const begin = 'data:' + contentType + ',';
        const base64DataNoBegin = base64Data.replace(begin, '');

        const sliceSize = 1024;
        const byteCharacters = Buffer.from(base64DataNoBegin, 'base64').toString(
            'latin1',
        );

        const bytesLength = byteCharacters.length;
        const slicesCount = Math.ceil(bytesLength / sliceSize);
        const byteArrays = new Array(slicesCount);

        for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
            const begin = sliceIndex * sliceSize;
            const end = Math.min(begin + sliceSize, bytesLength);

            const bytes = new Array(end - begin);

            for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
                bytes[i] = byteCharacters[offset].charCodeAt(0);
            }

            byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        const blob = new Blob(byteArrays, { type: contentType });

        return blob;
    }

    async getAuthSig(chainValue: string) {
        const authSig = await LitNodeClient.checkAndSignAuthMessage({ chain: chainValue });
        return authSig;
    }

    async encryptString(
        str: string,
        accessControlConditions: any[],
        permanent: boolean = false,
    ) {

        if (!this.litNodeClient) {
            await this.connect();
        };

        const chain = await this.getChain();
        const authSig = await this.getAuthSig(chain);

        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(str);

        const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
            accessControlConditions,
            symmetricKey,
            authSig,
            chain,
            permanent,
        });

        const encryptedSymmetricKeyString = LitJsSdk.uint8arrayToString(
            encryptedSymmetricKey,
            "base16"
        );

        return {
            symmetricKey,
            encryptedFile: encryptedString,
            encryptedSymmetricKeyString,
            encryptedSymmetricKey,
        };
    }

    async decryptString(
        encryptedBase64Str: string,
        encryptedSymmetricKey: string,
        accessControlConditionsNFT: any,
    ) {
        if (!this.litNodeClient) {
            await this.connect();
        };

        const chain = await this.getChain();
        const authSig = await this.getAuthSig(chain);

        const encryptionKey = await this.litNodeClient.getEncryptionKey({
            accessControlConditions: accessControlConditionsNFT,
            toDecrypt: encryptedSymmetricKey,
            chain,
            authSig,
        });

        const blob = this.base64StringToBlob(encryptedBase64Str);

        const decryptedString = await LitJsSdk.decryptString(
            blob,
            encryptionKey
        );

        return decryptedString;
    }

    async updateAccessControlConditions(
        encryptedSymmetricKey: string,
        accessControlConditions: any,
    ) {

        if (!this.litNodeClient) {
            await this.connect();
        };

        const chain = await this.getChain();
        const authSig = await this.getAuthSig(chain);

        await this.litNodeClient.saveEncryptionKey({
            accessControlConditions,
            encryptedSymmetricKey,
            authSig,
            chain,
            permanent: true,
        });
    }

    async runLitAction(payload: {
        chain: string,
        litActionCode: string,
        listActionCodeParams: any,
        pkpKey?: string,
        nodes?: number,
        showLogs?: boolean,
    }) {

        let {
            chain,
            pkpKey,
            litActionCode,
            listActionCodeParams,
            nodes,
            showLogs,
        } = payload;

        nodes = nodes || 10;

        const authSig = await this.getAuthSig(chain);

        const litNodeClient = new LitNodeClient.LitNodeClient({
            litNetwork: 'serrano',
        });

        await litNodeClient.connect();

        if (!isNullOrUndefined(listActionCodeParams)) {
            if (!isNullOrUndefined(pkpKey)) {
                listActionCodeParams.publicKey = pkpKey;
            }
            listActionCodeParams.authSig = authSig;
        };

        const litActionResult = await litNodeClient.executeJs({
            code: litActionCode,
            authSig,
            jsParams: listActionCodeParams,
            targetNodeRange: nodes,
        });

        if (showLogs) {
            console.log('======= <LIT ACTION LOGS> =======');
            console.log('');
            console.log(litActionResult?.logs);
            console.log('');
            console.log('======= </LIT ACTION LOGS> =======');
        }

        return litActionResult;
    }

    getPkpWalletAddress(publicKey: string) {
        return ethers.utils.computeAddress(publicKey);
    }
}

export default new Lit();
