const w = window as any;

const indexedDB =
    w.indexedDB
    || w.mozIndexedDB
    || w.webkitIndexedDB
    || w.msIndexedDB
    || w.shimIndexedDB;

const DATABASE_NAME = "dii-cache";
const DEFAULT_EXPIRATION = 300; // 5 minutes

let db: IDBDatabase = null as any;

(async function startDB() {
    const request = indexedDB.open(DATABASE_NAME, 4)

    request.onsuccess = (e: any) => {
        db = e.target.result
        // console.log("Database initialised")
    }

    request.onerror = (e: any) => {
        // console.log("Why didn't you allow my web app to use IndexedDB?!")
    }

    request.onupgradeneeded = (e: any) => {
        db = e.target.result

        db.onerror = (event) => {
            // console.log("Error loading database.")
            window?.location?.reload()
        }

        db.createObjectStore(DATABASE_NAME, { keyPath: "key" })

    }
})()

export const addData = async <T>(
    key: string,
    data: T,
    expiration: number = DEFAULT_EXPIRATION
): Promise<void> =>
    new Promise((resolve, reject) => {
        try {
            const store: any =
                db?.transaction([DATABASE_NAME], "readwrite")?.objectStore(DATABASE_NAME)

            const currentTime = new Date();
            const createdAt = currentTime.setSeconds(currentTime.getSeconds() + expiration);

            const request = store.add({ key, data, expiration, createdAt })

            request.oncomplete = function (e: any) {
                // console.log('[cache browser] data added!')
                return resolve()
            }

            request.onerror = () => {
                // console.log('[cache browser] error adding data', request.error)
                return reject(request.error)
            }

            request.onsuccess = () => {
                // console.log('[cache browser] data added!')
                return resolve()
            }

        } catch (err) {
            // console.log('[cache browser] (general) error adding data', err)
            return reject(err)
        }
    })


export const getData = async <T>(key: string): Promise<T> =>
    new Promise((resolve, reject) => {
        try {
            const store =
                db?.transaction([DATABASE_NAME], "readwrite")?.objectStore(DATABASE_NAME)

            const request = store?.get(key)

            if (request) {
                request.onsuccess = async () => {
                    // console.log('[cache browser] data retrieved!', request?.result?.data)
                    const data = request?.result?.data || null

                    const createdAt = request?.result?.createdAt
                    const expiration = request?.result?.expiration

                    if (createdAt && expiration) {
                        const createdAtDate = new Date(createdAt)

                        const createdAtUnix = createdAtDate.setSeconds(createdAtDate.getSeconds() + expiration);

                        const currentTimeUnix = Date.now()

                        // retrieve data from cache
                        if (createdAtUnix > currentTimeUnix) {
                            return resolve(data)
                        }

                        // remove data from cache and return null to force a new request
                        if (createdAtUnix < currentTimeUnix) {
                            await removeData(key)
                            return resolve(null as any)
                        }
                    }

                    return resolve(data)

                }

                request.onerror = async () => {
                    // console.log('[cache browser] error retrieving data')
                    return reject(request.error)
                }
            } else {
                resolve(null as any)
            }

        } catch (err) {
            return reject(err)
        }
    })

export const updateData = <T>(
    key: string,
    data: T,
    expiration: number = DEFAULT_EXPIRATION
): Promise<void> =>
    new Promise((resolve, reject) => {
        try {
            const store: any =
                db?.transaction([DATABASE_NAME], "readwrite")?.objectStore(DATABASE_NAME)

            const currentTime = new Date();
            const createdAt = currentTime.setSeconds(currentTime.getSeconds() + expiration);

            const request = store.put({ key, data, expiration, createdAt })

            request.onsuccess = () => {
                // console.log('[cache browser] data updated!')
                return resolve()
            }

            request.onerror = () => {
                // console.log('[cache browser] error updating data')
                return reject(request.error)
            }
        } catch (err) {
            return reject(err)
        }
    })

export const removeData = (key: string): Promise<void> =>
    new Promise((resolve, reject) => {
        try {
            const store =
                db?.transaction([DATABASE_NAME], "readwrite")?.objectStore(DATABASE_NAME)

            const request = store.delete(key)

            request.onsuccess = () => {
                // console.log('[cache browser] data removed!', key)
                return resolve()
            }

            request.onerror = () => {
                // console.log('[cache browser] error removing data')
                return reject(request.error)
            }
        } catch (err) {
            return reject(err)
        }
    })

export const resetData = (): Promise<void> =>
    new Promise((resolve, reject) => {
        try {
            const store =
                db?.transaction([DATABASE_NAME], "readwrite")?.objectStore(DATABASE_NAME).clear()

            store.onsuccess = () => {
                return resolve()
            }

            store.onerror = (err) => {
                return reject(store.error)
            }

            // console.log('[cache browser] data reset!')
            return resolve()
        } catch (err) {
            return reject(err)
        }
    })

const CacheStorageModule = {
    addData,
    getData,
    updateData,
    removeData,
    resetData,
}

import { Injectable } from '@angular/core';
import { isNullOrUndefined } from '../helpers/helpers';

interface IPayload<T> {
    key: string;
    expirationInSeconds?: number;
    init: () => Promise<T>;
}

interface IResponse<T> {
    data: T;
    fromCache: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class CacheBrowserService {

    private static cacheIsEnabled: boolean = true;

    public static async getData<T>(params: IPayload<T>): Promise<IResponse<T>> {

        let data = null;
        let fromCache = false;

        const cacheKey = params.key;

        try {
            if (CacheBrowserService.cacheIsEnabled) {

                // console.log('CacheBrowserService (pre result)');
                const result: any = await CacheStorageModule.getData(cacheKey);
                // console.log('CacheBrowserService (result)', result);

                try {
                    if (!isNullOrUndefined(result)) {
                        data = result;
                        fromCache = true;
                        // console.log('CacheBrowserService (cacheKey)', cacheKey);
                        // console.log('CacheBrowserService (result)', { data, fromCache });
                    }
                } catch (err: any) {
                    // console.log('CacheBrowserService ERROR 1', err?.message);
                }
            }

            if (isNullOrUndefined(data)) {
                try {
                    // console.log('CacheBrowserService (pre data)');
                    data = await params.init();
                    // console.log('CacheBrowserService (data)', data);

                    if (!isNullOrUndefined(data) && CacheBrowserService.cacheIsEnabled) {
                        try {
                            // console.log('pre CacheStorageModule.addData');
                            await CacheStorageModule.addData(
                                cacheKey,
                                data,
                                params?.expirationInSeconds
                            );
                            // console.log('post CacheStorageModule.addData');
                        } catch (err: any) {
                            // console.log('CacheBrowserService ERROR 4', err?.message);
                        }
                    }

                    fromCache = false;
                    // console.log('CacheBrowserService (cacheKey)', cacheKey);
                    // console.log('CacheBrowserService (result)', { data, fromCache });
                } catch (err: any) {
                    // console.log('CacheBrowserService ERROR 2', err?.message);
                }
            }

        } catch (err: any) {
            // console.log('CacheBrowserService ERROR 3', err?.message);
        }

        // console.log('CacheBrowserService (hereee!!!)', { data, fromCache });

        return {
            data,
            fromCache
        };
    }

    public static async getDataByKey<T>(cacheKey: string): Promise<T> {
        const result: any = await CacheStorageModule.getData(cacheKey);
        return result;
    }

    public static async updateData<T>(
        key: string,
        data: T,
        expirationInSeconds?: number
    ): Promise<void> {
        try {
            const cacheKey = key;
            await CacheStorageModule.updateData(cacheKey, data, expirationInSeconds);
        } catch (err: any) {
            // console.log('CacheBrowserService ERROR (updateData)', err?.message);
        }
    }

    public static async resetData(): Promise<void> {
        try {
            await CacheStorageModule.resetData();
        } catch (err: any) {
            // console.log('CacheBrowserService ERROR (removeData)', err?.message);
        }
    }

    public static async removeData(key: string): Promise<void> {
        try {
            await CacheStorageModule.removeData(key);
        } catch (err: any) {
            // console.log('CacheBrowserService ERROR (removeData)', err?.message);
        }
    }

}