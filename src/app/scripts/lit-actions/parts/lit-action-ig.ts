type EnvType = 'demo' | 'prod';

const igUrlSelector = {
    demo: 'https://demo-api.ig.com',
    prod: 'https://api.ig.com',
};

const getApiUrl = (env: EnvType) => {
    return igUrlSelector[env] || igUrlSelector['demo'];
};

const checkCredentials = (
    env: EnvType,
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const username = credentials.username;
            const apiKey = credentials.apiKey;
            const password = credentials.password;

            const url = '${requestUrl}/gateway/deal/session?fetchSessionTokens=true';

            const options = {
                method: 'POST',
                body: JSON.stringify({
                    identifier: username,
                    password: password,
                }),
                headers: {
                    'Version': '2',
                    'X-IG-API-KEY': apiKey,
                    'User-Agent': 'PostmanRuntime/7.29.2',
                    'Accept': 'application/json; charset=UTF-8',
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                redirect: 'follow',
                mode: 'cors',
            };

            let response = null;
            let error = null;

            try {
                response = await fetch(url, options);
            } catch (err) {
                error = err?.error || err?.message;
            }

            const clientSessionToken = response.headers.get('cst');
            const activeAccountSessionToken = response.headers.get('x-security-token');

            Lit.Actions.setResponse({response: JSON.stringify({
                clientSessionToken,
                activeAccountSessionToken,
                error,
            })});

        };

        go();
    `;

    return code;
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

const getMarketInfoByEpic = (
    env: EnvType,
    epic: string,
    auth: {
        apiKey: string,
        cst: string,
        securityToken: string,
    }
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const url = '${requestUrl}/gateway/deal/markets/${epic}';

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

            const info = data || [];

            Lit.Actions.setResponse({response: JSON.stringify(info)});

        };

        go();
    `;

    return code;
}

const getPositions = (
    env: EnvType,
    auth: {
        apiKey: string,
        cst: string,
        securityToken: string,
    }
) => {
    const requestUrl = getApiUrl(env);

    const code = `
        const go = async () => {

            const url = '${requestUrl}/gateway/deal/positions';

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

            const info = data?.positions || [];

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
                    currencyCode: 'USD',
                    dealReference: dealReferenceGenerator(),
                    direction: '${orderPayload.direction.toUpperCase()}',
                    epic: '${orderPayload.epic}',
                    expiry: 'DFB',
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

export {
    checkCredentials,
    getAssetsBySymbol,
    placeOrder,
    getPositions,
    getMarketInfoByEpic,
};