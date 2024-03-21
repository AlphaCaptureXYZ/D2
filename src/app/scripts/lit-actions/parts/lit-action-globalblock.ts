type EnvType = 'prod';

const globalblockUrlSelector = {
    prod: 'https://api.globalblock.eu/v1',
};

const getApiUrl = (env: EnvType) => {
    return globalblockUrlSelector[env];
};

const checkCredentials = async (
    env: EnvType,
    auth: {
        publicKey: string,
        secretKey: string,
    }
) => {

    const check = await getPositions(env, auth);

    return check;
};

const getAssetsBySymbol = (
    env: EnvType,
    symbol: string,
    auth: {
        apiKey: string,
        cst: string,
        securityToken: string,
    }
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const url = '${requestUrl}/gateway/deal/markets?searchTerm=${symbol}';

            const options = {
                method: 'GET',
                headers: {
                    'Version': '1',
                    'CST': '${auth.cst}',
                    'X-IG-API-KEY': '${auth.apiKey}',
                    'X-SECURITY-TOKEN': '${auth.securityToken}',
                    'User-Agent': 'PostmanRuntime/7.29.2',
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                redirect: 'follow',
                mode: 'cors',
            };

            const response = await fetch(url, options);
            const data = await response.json();

            const info = data?.markets || [];

            Lit.Actions.setResponse({response: JSON.stringify(info)});

        };

        go();
    `;

    return code;
}

const getPositions = async (
    env: EnvType,
    auth: {
        publicKey: string,
        secretKey: string,
    }
) => {

    const requestUrl = getApiUrl(env);

    const code = `

        const url = '${requestUrl}/positions';

        const go = async () => {

            const username = credentials.username;
            const apiKey = credentials.apiKey;
            const password = credentials.password;

            const options = {
                method: 'GET',
                headers: {
                    'x-api-key': '${auth.publicKey}',
                    'x-secret-key': '${auth.secretKey}',
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                redirect: 'follow',
                mode: 'cors',
            };

            const response = await fetch(url, options);
            const data = await response.json();

            const info = data || [];

            Lit.Actions.setResponse({response: JSON.stringify(info)});

        };

        go();
    `;

    return code;
}

const placeOrder = (
    env: EnvType,
    orderPayload: {
        direction: string,
        epic: string,
        quantity: number,
        currencyCode: string,
        expiry: string,
    },
    auth: {
        apiKey: string,
        cst: string,
        securityToken: string,
    }
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const url = '${requestUrl}/gateway/deal/positions/otc';

            const dealReferenceGenerator = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const options = {
                method: 'POST',
                body: JSON.stringify({
                    currencyCode: '${orderPayload.currencyCode}',
                    dealReference: dealReferenceGenerator(),
                    direction: '${orderPayload.direction.toUpperCase()}',
                    epic: '${orderPayload.epic}',
                    expiry: '${orderPayload.expiry}',
                    orderType: 'MARKET',
                    size: '${orderPayload.quantity}',
                    guaranteedStop: false,
                    forceOpen: true,
                }),
                headers: {
                    'Version': '2',
                    'CST': '${auth.cst}',
                    'X-IG-API-KEY': '${auth.apiKey}',
                    'X-SECURITY-TOKEN': '${auth.securityToken}',
                    'User-Agent': 'PostmanRuntime/7.29.2',
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                redirect: 'follow',
                mode: 'cors',
            };

            const response = await fetch(url, options);
            const data = await response.json();

            const dealReference = data?.dealReference || null;

            let globalResponse = null;

            if(dealReference){
                const orderDetailsReq = await fetch(
                    '${requestUrl}/gateway/deal/confirms/' + dealReference,
                    {
                        method: 'GET',
                        headers: {
                            'Version': '1',
                            'CST': '${auth.cst}',
                            'X-IG-API-KEY': '${auth.apiKey}',
                            'X-SECURITY-TOKEN': '${auth.securityToken}',
                            'User-Agent': 'PostmanRuntime/7.29.2',
                            'Accept': 'application/json; charset=UTF-8',
                            'Content-Type': 'application/json; charset=UTF-8',
                        },
                        redirect: 'follow',
                        mode: 'cors',
                    }
                );
    
                const orderDetails = await orderDetailsReq.json();
                globalResponse = orderDetails;
            } else {
                globalResponse = data;
            }

            Lit.Actions.setResponse({response: JSON.stringify(globalResponse)});

        };

        go();
    `;

    return code;
}

const closePosition = (
    env: EnvType,
    orderPayload: {
        epic: string,
        expiry: string,
    },
    auth: {
        apiKey: string,
        cst: string,
        securityToken: string,
    }
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const url = '${requestUrl}/gateway/deal/positions/otc';

            const options = {
                method: 'DELETE',
                body: JSON.stringify({
                    epic: '${orderPayload.epic}',
                    expiry: '${orderPayload.expiry}',
                    orderType: 'MARKET',
                    forceOpen: true,
                }),
                headers: {
                    'Version': '1',
                    'CST': '${auth.cst}',
                    'X-IG-API-KEY': '${auth.apiKey}',
                    'X-SECURITY-TOKEN': '${auth.securityToken}',
                    'User-Agent': 'PostmanRuntime/7.29.2',
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                redirect: 'follow',
                mode: 'cors',
            };

            const response = await fetch(url, options);
            const data = await response.json();

            Lit.Actions.setResponse({response: JSON.stringify(data)});

        };

        go();
    `;

    return code;
}

export {
    checkCredentials,
    getAssetsBySymbol,
    placeOrder,
    getPositions,
    closePosition,
};