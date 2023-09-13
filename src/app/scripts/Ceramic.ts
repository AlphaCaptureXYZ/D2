import { CeramicClient } from "@ceramicnetwork/http-client";
import { DID } from "dids";
import { getResolver as getKeyResolver } from "key-did-resolver";
//@ts-ignore
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { TileDocument } from "@ceramicnetwork/stream-tile";

const threeID = new ThreeIdConnect();
const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");

async function authenticateWithEthereum(ethereumProvider: any) {

    const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
    });

    const authProvider = new EthereumAuthProvider(ethereumProvider, accounts[0]);

    await threeID.connect(authProvider);

    const did = new DID({
        provider: threeID.getDidProvider(),
        resolver: {
            ...get3IDResolver(ceramic),
            ...getKeyResolver(),
        } as any,
    });

    await did.authenticate();

    ceramic.did = did;
}

async function authenticateCeramic() {
    if (window.ethereum == null) {
        throw new Error("No injected Ethereum provider");
    }

    await authenticateWithEthereum(window.ethereum);
}

async function loadDocument(id: any) {
    return await TileDocument.load(ceramic, id);
}

async function createDocument(content: any) {
    const doc = await TileDocument.create(ceramic, content, {
        family: "desci-exchange",
        controllers: [(ceramic as any).did.id],
    });
    return doc?.id?.toString();
}

async function updateDocument(id: any, content: any) {
    const doc = await TileDocument.load(ceramic, id);
    await doc.update(content);
}

export { loadDocument, authenticateCeramic, createDocument, updateDocument };
