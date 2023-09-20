import { Injectable, } from '@angular/core';
import { loop } from '../helpers/helpers';

const apiUrl = 'https://api.nft.storage';

const NFT_STORAGE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDg4QWQ0MDgwODIxMTIyOTRGQjU5MDM3NDk2Y0ZDMjk0Yzg2QjNGQzkiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5NTEzODUyMjcwMiwibmFtZSI6ImQyLW9yZGVyLXN0b3JlIn0.Dm2J9JxCuBnxRk6Q9nrrUGkhmwWAJ5rvBfsdtU4sR38';

@Injectable({
    providedIn: 'root',
})
export class NFTStorageService {

    constructor() { }

    async add(
        metadata: string,
    ): Promise<{
        cid: string
    }> {
        const request = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${NFT_STORAGE_API_KEY}`,
            },
            body: metadata,
        });

        const response = await request.json();
        const cid = response?.value?.cid || null;

        return {
            cid,
        }
    }

    async retrieve(
        payload: {
            cid: string,
            proxy?: boolean,
        },
    ): Promise<string> {

        const {
            cid,
            proxy,
        } = payload;

        let result: any = null;

        const proxyUrl = (id: string) => `https://${id}.ipfs.nftstorage.link`;
        const ipftUrl = (id: string) => `https://ipfs.io/ipfs/${id}`;

        let url = proxy ? proxyUrl(cid) : ipftUrl(cid);

        result = await fetch(url);

        if (result?.status === 200) {
            const jsonContent = await result.text();
            result = jsonContent;
        } else {
            await loop(
                async () => {
                    const jsonContent = await result.text();
                    result = jsonContent;
                },
                async () => {
                    let isPassed = false

                    try {
                        result = await fetch(url);

                        if (result.status === 200) {
                            isPassed = true;
                        }
                    } catch (e: any) {
                        isPassed = false;
                    }

                    return isPassed;
                },
                {
                    loopTimeInMs: 10000,
                    limitTimeSecond: 240,
                },
                async (err: any) => {
                    console.log(`NftStorageModule (get) [${cid}]`, err?.message);
                },
            )
        }

        return result;
    }

}
