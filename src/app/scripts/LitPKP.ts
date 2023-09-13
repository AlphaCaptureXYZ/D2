import { joinSignature } from '@ethersproject/bytes';
import { UnsignedTransaction, ethers } from 'ethers';

declare var typedSignatureHash: any;

/**
 * Use Lit Actions to sign Ethereum JSON RPC signing requests.
 *
 * TEMP: Porting things over to the TS SDK
 */
export default class LitPKP {
    pkpPublicKey;
    authSig;
    litNodeClient;
    rpcProvider;

    litActionCode = `
    (async () => {
      const sigShare = await LitActions.signEcdsa({ toSign, publicKey, sigName });
    })();`;

    constructor({ pkpPublicKey, authSig, rpcUrl, litNodeClient }: any) {
        this.pkpPublicKey = pkpPublicKey;
        this.authSig = authSig;
        this.rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        this.litNodeClient =
            litNodeClient ||
            new LitNodeClient({
                alertWhenUnauthorized: false,
                minNodeCount: 10,
                litNetwork: 'serrano',
                debug: false,
            });
    }

    getPkpWalletAddress() {
        return ethers.utils.computeAddress(this.pkpPublicKey);
    }

    async runLitAction(toSign: any, sigName: any) {
        if (!this.litNodeClient.ready) {
            await this.litNodeClient.connect();
        }

        const executeJsArgs = {
            ...(this.litActionCode && { code: this.litActionCode }),
            authSig: this.authSig,
            jsParams: {
                toSign,
                publicKey: this.pkpPublicKey,
                sigName,
            },
        };
        const res = await this.litNodeClient.executeJs(executeJsArgs);
        return res.signatures[sigName];
    }

    async signMessage(message: any) {
        const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(message));
        const signature = await this.runLitAction(toSign, 'pkp-eth-sign-message');
        return joinSignature({
            r: '0x' + signature.r,
            s: '0x' + signature.s,
            v: signature.recid,
        });
    }

    async signTypedData(msgParams: any) {
        const { types, domain, primaryType, message } = JSON.parse(msgParams);
        if (types.EIP712Domain) {
            delete types.EIP712Domain;
        }
        const toSign = ethers.utils._TypedDataEncoder.hash(domain, types, message);
        const signature = await this.runLitAction(
            ethers.utils.arrayify(toSign),
            'pkp-eth-sign-typed-data'
        );
        return joinSignature({
            r: '0x' + signature.r,
            s: '0x' + signature.s,
            v: signature.recid,
        });
    }

    async signTypedDataLegacy(msgParams: any) {
        // https://github.com/MetaMask/eth-sig-util/blob/9f01c9d7922b717ddda3aa894c38fbba623e8bdf/src/sign-typed-data.ts#L435
        const messageHash = typedSignatureHash(msgParams);
        const sig = await this.runLitAction(
            ethers.utils.arrayify(messageHash),
            'sig1'
        );
        const encodedSig = joinSignature({
            r: '0x' + sig.r,
            s: '0x' + sig.s,
            v: sig.recid,
        });
        return encodedSig;
    }

    async signTransaction(transaction: UnsignedTransaction) {
        const serializedTx = ethers.utils.serializeTransaction(transaction);
        const unsignedTxn = ethers.utils.keccak256(serializedTx);
        const toSign = ethers.utils.arrayify(unsignedTxn);
        const signature = (await this.runLitAction(toSign, 'pkp-eth-sign-tx'))
            .signature;
        return ethers.utils.serializeTransaction(transaction, signature);
    }

    async sendTransaction(transaction: string) {
        return await this.rpcProvider.sendTransaction(transaction);
    }

    async signEthereumRequest(payload: any) {
        let address = ethers.utils.computeAddress(this.pkpPublicKey);
        let addressRequested = null;
        let message = null;
        let msgParams = null;
        let txParams = null;
        let transaction = null;
        let result = null;

        switch (payload.method) {
            case 'eth_sign':
                addressRequested = payload.params[0];
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                message = convertHexToUtf8(payload.params[1]);
                result = await this.signMessage(message);
                break;
            case 'personal_sign':
                addressRequested = payload.params[1];
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                message = convertHexToUtf8(payload.params[0]);
                result = await this.signMessage(message);
                break;
            case 'eth_signTypedData':
                // Double check version to use since signTypedData can mean V1 (Metamask) or V3 (WalletConnect)
                // References: https://docs.metamask.io/guide/signing-data.html#a-brief-history
                // https://github.com/WalletConnect/walletconnect-monorepo/issues/546
                if (ethers.utils.isAddress(payload.params[0])) {
                    // V3 or V4
                    addressRequested = payload.params[0];
                    if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                        throw new Error(
                            'PKPWallet address does not match address requested'
                        );
                    }
                    msgParams = payload.params[1];
                    result = await this.signTypedData(msgParams);
                } else {
                    // V1
                    addressRequested = payload.params[1];
                    if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                        throw new Error(
                            'PKPWallet address does not match address requested'
                        );
                    }
                    msgParams = payload.params[0];
                    result = await this.signTypedDataLegacy(msgParams);
                }
                break;
            case 'eth_signTypedData_v1':
                // Params are flipped in V1 - https://medium.com/metamask/scaling-web3-with-signtypeddata-91d6efc8b290
                addressRequested = payload.params[1];
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                msgParams = payload.params[0];
                result = await this.signTypedDataLegacy(msgParams);
                break;
            case 'eth_signTypedData_v3':
            case 'eth_signTypedData_v4':
                addressRequested = payload.params[0];
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                msgParams = payload.params[1];
                result = await this.signTypedData(msgParams);
                break;
            case 'eth_signTransaction':
                txParams = payload.params[0];
                addressRequested = txParams.from;
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                transaction = getTransactionToSign(txParams);
                result = await this.signTransaction(transaction);
                break;
            case 'eth_sendTransaction': {
                txParams = payload.params[0];
                addressRequested = txParams.from;
                if (address.toLowerCase() !== addressRequested.toLowerCase()) {
                    throw new Error('PKPWallet address does not match address requested');
                }
                transaction = getTransactionToSign(txParams);
                const signedTx = await this.signTransaction(transaction);
                result = await this.sendTransaction(signedTx);
                break;
            }
            case 'eth_sendRawTransaction': {
                transaction = payload.params[0];
                result = await this.sendTransaction(transaction);
                break;
            }
            default:
                throw new Error(
                    `Ethereum JSON-RPC signing method "${payload.method}" is not supported`
                );
        }

        return result;
    }
}

function convertHexToUtf8(value: any) {
    try {
        if (ethers.utils.isHexString(value)) {
            return ethers.utils.toUtf8String(value);
        }
        return value;
    } catch (e) {
        return value;
    }
}

const getTransactionToSign = (txParams: any) => {
    let formattedTx = Object.assign({}, txParams);

    if (formattedTx.gas) {
        delete formattedTx.gas;
    }

    if (formattedTx.from) {
        delete formattedTx.from;
    }

    return formattedTx;
};
