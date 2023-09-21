import { Injectable, } from '@angular/core';

//@ts-ignore
import WeaveDB from 'weavedb-sdk';

import litClient from "src/app/scripts/Lit";

import {
    Compressor
} from "src/app/scripts/Compress";

import { isNullOrUndefined, wait } from '../helpers/helpers';
import { blobToBase64String } from '@lit-protocol/lit-node-client';
import { getDefaultAccount } from '../shared/shared';
import { NFTStorageService } from './nft-store.service';

const COLLECTION_NAME = 'D2-data';

type CollectionType =
    | 'setting'
    | 'trigger'
    | 'order'
    | 'pkp-info';

const chain = 'mumbai';

@Injectable({
    providedIn: 'root',
})
export class WeaveDBService {

    private db: any;

    constructor(
        private nftStorageService: NFTStorageService
    ) { }

    private async setupWeaveDB() {
        if (isNullOrUndefined(this.db)) {

            const contractTxId = 'uItgIC0zhIGUM3uK0DPb__1TVb-2F5Q1awI2mVMICbk';
            
            this.db = new WeaveDB({
                contractTxId,
                nocache: true,
            });
            await this.db.init();
        }
    }

    private accessControlConditions(
        userWallet: string,
        pkpWalletAddress?: string,
    ) {
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
                jsonData,
                userWallet,
                type,
                pkpKey,
            } = payload;

            userWallet = userWallet?.toLowerCase();

            let pkpWalletAddress: any = null;

            if (pkpKey) {
                pkpWalletAddress = litClient.getPkpWalletAddress(pkpKey);
            }

            const accessControlConditions =
                this.accessControlConditions(userWallet, pkpWalletAddress);

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
        }
    ) {
        let data = [];

        try {

            await this.setupWeaveDB();
            
            const {
                type,
            } = payload;

            const wallet = await getDefaultAccount();

            await wait(1000);

            let docs: any[] = await this.db.cget(
                COLLECTION_NAME,
                ['type'],
                ['type', '==', type]
            );

            docs = docs?.filter((doc) => {
                return doc?.data?.userAddress === wallet;
            });

            docs = docs?.sort((a, b) => {
                return b?.data?.createdAt - a?.data?.createdAt;
            });

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
                        });

                        info.data = nftStorageResult;
                    }

                    const userWallet = info?.userAddress;
                    const pkpWalletAddress = info?.pkpWalletAddress || null;

                    const dataIsCompressed = info?.isCompressed || false;

                    const accessControlConditions =
                        this.accessControlConditions(userWallet, pkpWalletAddress);

                    let doc = null as any;

                    if (dataIsCompressed) {
                        doc = await Compressor.decompressData(info?.data);
                        info.data = doc;
                    };

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

                    return decryptedString;

                } catch (err: any) {
                    console.log('ERROR', err?.message);
                }
            }))) || [];

            data = data?.filter((item) => item) || [];

        } catch (e: any) {
            console.log('[weavedb] getAllData (error)', e?.message);
        }

        return data as T[];
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
            this.accessControlConditions(userWallet, pkpWalletAddress);

        let doc = null as any;

        if (dataIsCompressed) {
            doc = await Compressor.decompressData(info?.data);
            info.data = doc;
        };

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

    };

    async deleteData(
        docId: string,
    ) {
        await this.setupWeaveDB();
        const result = await this.db.delete(COLLECTION_NAME, docId);
        return result;
    };

}
