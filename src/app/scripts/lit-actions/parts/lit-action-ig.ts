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

export {
    checkCredentials,
};