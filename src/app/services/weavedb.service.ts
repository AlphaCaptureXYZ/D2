import { Injectable, } from '@angular/core';

import { ethers } from "ethers";

//@ts-ignore
import WeaveDB from 'weavedb-sdk';

import litClient from "src/app/scripts/Lit";

import {
    Compressor
} from "src/app/scripts/Compress";

import { getDataWithPaging, isNullOrUndefined, wait } from '../helpers/helpers';
import { blobToBase64String } from '@lit-protocol/lit-node-client';
import { getDefaultAccount } from '../shared/shared';
import { NFTStorageService } from './nft-store.service';
import { IPaging } from '../interfaces/interfaces';

const COLLECTION_NAME = 'D2-data';

// new contract tx id to test
const WEAVEDB_CONTRACT_TX_ID = '5_KIAVYCJeJj9d-fAJmCcNsPlMefjfoo4PUgk1JbLTA';

let count = 0;
type CollectionType =
    | 'setting'
    | 'trigger'
    | 'order'
    | 'pkp-info';

@Injectable({
    providedIn: 'root',
})
export class WeaveDBService {

    private static firstLoad = true;

    private db: any;

    constructor(
        private nftStorageService: NFTStorageService
    ) { }

    private getProvider() {
        return new ethers.providers.Web3Provider(
            (window as any)?.ethereum
        );
    }

    private async getChain() {
        const provider = this.getProvider();
        const network = await provider.getNetwork();

        const chainObj: any = {
            137: 'polygon',
            80001: 'mumbai'
        };

        const chain = chainObj[network.chainId] || null;

        return chain as string;
    }

    private async setupWeaveDB() {
        if (isNullOrUndefined(this.db)) {

            this.db = new WeaveDB({
                contractTxId: WEAVEDB_CONTRACT_TX_ID,
                remoteStateSyncEnabled: true,
                remoteStateSyncSource: "https://dre-3.warp.cc/contract",
                nocache: true,
            });

            await this.db.init();
        }

        // const docId = '02c076a88810958a83429111005da12c';
        if (count < 1) {
            // const delArray = [];
            // delArray.push('');
            // delArray.push('27992b1291ea837264c5007a45b4cfa5');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');
            // delArray.push('');

            // for (const m in delArray) {
            //     const result = await this.db.delete(COLLECTION_NAME, delArray[m]);
            //     console.log('result', result);
            // }
        }
        count++;
        console.log('Loading a new instance of WeaveDB');

    }

    private async accessControlConditions(
        userWallet: string,
        pkpWalletAddress?: string,
    ) {
        const chain = await this.getChain();

        // https://developer.litprotocol.com/accessControl/EVM/basicExamples#a-specific-wallet-address
        const accessControlConditions: any[] = [
            {
                contractAddress: '',
                standardContractType: '',
                chain,
                method: '',
                parameters: [
                    ':userAddress',
                ],
                returnValueTest: {
                    comparator: '=',
                    value: userWallet?.toLowerCase(),
                },
            },
        ];

        if (pkpWalletAddress) {
            accessControlConditions.push({
                operator: "or",
            });
            accessControlConditions.push({
                contractAddress: '',
                standardContractType: '',
                chain,
                method: '',
                parameters: [
                    ':userAddress',
                ],
                returnValueTest: {
                    comparator: '=',
                    value: pkpWalletAddress,
                },
            });
        }

        return accessControlConditions;
    }

    async upsertData<T>(
        payload: {
            // data to store based on type
            jsonData: T,
            // user wallet address
            userWallet: string,
            // type of data to store (setting, trigger, profile, etc)
            type: CollectionType,
            // pkp key to store data for enable external access
            pkpKey?: string,
            // if the docId is provided, the data will be updated instead of created
            // uf the docId not exists, the data will be created
            docId?: string,
            // if data is compressed
            isCompressed: boolean,
        },
    ) {
        try {

            await this.setupWeaveDB();

            let {
                userWallet,
            } = payload;

            const {
                jsonData,
                type,
                pkpKey,
            } = payload;

            userWallet = userWallet?.toLowerCase();

            let pkpWalletAddress: any = null;

            if (pkpKey) {
                pkpWalletAddress = litClient.getPkpWalletAddress(pkpKey);
            }

            const accessControlConditions =
                await this.accessControlConditions(userWallet, pkpWalletAddress);

            const {
                encryptedFile,
                encryptedSymmetricKeyString,
            } = await litClient.encryptString(
                JSON.stringify(jsonData),
                accessControlConditions,
                true,
            );

            const encryptedFileB64 = await blobToBase64String(encryptedFile);

            const id = Math.random().toString(36).substring(7);

            const info = {
                encryptedData: encryptedFileB64,
                encryptedSymmetricKey: encryptedSymmetricKeyString,
            };

            let data = btoa(JSON.stringify(info));

            if (payload?.isCompressed) {
                data = await Compressor.compressData(data);
            }

            if ([
                'order',
            ].includes(type)) {
                const { cid } = await this.nftStorageService.add(data);
                data = cid;
            }

            const obj = {
                id,
                createdAt: Date.now(),
                data,
                type,
                userAddress: userWallet,
                pkpWalletAddress,
                isCompressed: payload?.isCompressed,
            };

            if (!pkpWalletAddress) {
                delete obj.pkpWalletAddress;
            }

            let tx = null as any;

            if (payload.docId) {
                tx = await this.db?.upsert(
                    obj,
                    COLLECTION_NAME,
                    payload?.docId,
                );
            }

            if (!payload.docId) {
                tx = await this.db?.add(
                    obj,
                    COLLECTION_NAME,
                );
            }

        } catch (e) {
            console.error('addMsg', e);
        }
    }

    async getAllData<T>(
        payload: {
            type: CollectionType,
            page?: number,
            limit?: number,
            filter?: any,
        }
    ): Promise<IPaging<T>> {
        let data = [];
        let total = 0;

        const {
            type,
            page,
            limit,
            filter,
        } = payload;

        try {
            await this.setupWeaveDB();

            const wallet = await getDefaultAccount();

            if (WeaveDBService.firstLoad) {
                await wait(5000);
                WeaveDBService.firstLoad = false;
            } else {
                await wait(1000);
            }

            let docs: any[] = await this.db.cget(
                COLLECTION_NAME,
                ['type'],
                ['type', '==', type]
            );

            docs = docs?.filter((doc) => {
                return doc?.data?.userAddress === wallet;
            });

            if (!isNullOrUndefined(filter)) {
                docs = docs?.filter((doc) => {
                    let result = false;
                    Object.keys(filter)?.forEach((key) => {
                        if (doc?.data?.additionalInfo?.[key] === filter?.[key]) {
                            result = true;
                        }
                    });
                    return result;
                });
            }

            docs = docs?.sort((a, b) => {
                return b?.data?.createdAt - a?.data?.createdAt;
            });

            total = docs?.length || 0;

            if (((page || 0) > 0) && (limit || 0) > 0) {
                const pagination = getDataWithPaging<any>({
                    data: docs,
                    paging: {
                        page: page || 1,
                        limit: limit || 30,
                    },
                });

                docs = pagination?.data;
            }

            data = (await Promise?.all(docs?.map(async (res) => {
                try {

                    const docId = res?.id;
                    const info: any = res?.data;

                    if ([
                        'order',
                    ].includes(type)) {
                        const cid = info?.data;

                        const nftStorageResult = await this.nftStorageService.retrieve({
                            cid,
                            proxy: true,
                        });

                        info.data = nftStorageResult;
                    }

                    const userWallet = info?.userAddress;
                    const pkpWalletAddress = info?.pkpWalletAddress || null;

                    const dataIsCompressed = info?.isCompressed || false;

                    const accessControlConditions =
                        await this.accessControlConditions(userWallet, pkpWalletAddress);

                    let doc = null as any;

                    if (dataIsCompressed) {
                        doc = await Compressor.decompressData(info?.data);
                        info.data = doc;
                    }

                    doc = JSON.parse(atob(info?.data));

                    const {
                        encryptedData,
                        encryptedSymmetricKey,
                    } = doc;

                    const decryptedFile = await litClient.decryptString(
                        encryptedData,
                        encryptedSymmetricKey,
                        accessControlConditions,
                    );

                    const decryptedString = JSON.parse(decryptedFile);

                    if (decryptedString) {
                        decryptedString.docId = docId;
                        decryptedString.pkpWalletAddress = pkpWalletAddress;
                    }

                    return decryptedString;

                } catch (err: any) {
                    console.log('ERROR', err?.message);
                }
            }))) || [];

            data = data?.filter((item) => item) || [];

        } catch (e: any) {
            console.log('[weavedb] getAllData (error)', e?.message);
        }

        return {
            data,
            paging: {
                limit: limit || data?.length,
                page: page || 1,
            },
            total,
        }
    }

    async getDataByDocID<T>(
        docId: string,
    ) {
        await this.setupWeaveDB();

        const info = await this.db.get(COLLECTION_NAME, docId);

        const type = info?.type;

        if ([
            'order',
        ].includes(type)) {
            const cid = info?.data;

            const nftStorageResult = await this.nftStorageService.retrieve({
                cid,
                proxy: true,
            });

            info.data = nftStorageResult;
        }

        const userWallet = info?.userAddress;
        const pkpWalletAddress = info?.pkpWalletAddress || null;

        const dataIsCompressed = info?.isCompressed || false;

        const accessControlConditions =
            await this.accessControlConditions(userWallet, pkpWalletAddress);

        let doc = null as any;

        if (dataIsCompressed) {
            doc = await Compressor.decompressData(info?.data);
            info.data = doc;
        }

        doc = JSON.parse(atob(info?.data));

        const {
            encryptedData,
            encryptedSymmetricKey,
        } = doc;

        const decryptedFile = await litClient.decryptString(
            encryptedData,
            encryptedSymmetricKey,
            accessControlConditions,
        );

        const decryptedString = JSON.parse(decryptedFile);

        if (decryptedString) {
            decryptedString.docId = docId;
        }

        return decryptedString as T;

    }

    async deleteData(
        docId: string,
    ) {
        // await this.setupWeaveDB();
        const result = await this.db.delete(COLLECTION_NAME, docId);
        console.log('result', result);
        return result;
    }

}
