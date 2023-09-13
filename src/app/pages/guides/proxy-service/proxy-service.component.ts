import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightModule } from 'ngx-highlightjs';
import { RouterModule } from '@angular/router';

import {
    copyValue,
    prettyCode,
    wait
} from 'src/app/helpers/helpers';

@Component({
    selector: 'app-proxy-service-guide',
    standalone: true,
    imports: [
        CommonModule,
        HighlightModule,
        RouterModule,
    ],
    templateUrl: './proxy-service.component.html',
    styleUrls: ['./proxy-service.component.scss']
})
export default class ProxyServiceGuideComponent implements OnInit {

    proxyRouteCode = null as any;
    proxyControllerCode = null as any;
    proxyToCallExternalProcessFnCode = null as any;

    constructor() {
        this.fillCode();
    }

    async ngOnInit() {

    }

    copyCode(code: string, event: any) {
        event.target.innerText = 'Copied!';

        wait(1000).then(() => {
            event.target.innerText = 'Copy';
        });

        copyValue(code);
    }

    fillCode() {
        this.proxyRouteCode = prettyCode(`
            app
             .get('/v1/proxy', proxyCtrl)
             .post('/v1/proxy', proxyCtrl)
        `);

        this.proxyControllerCode = prettyCode(`
            export const proxyCtrl = async (req, res) => {

                const request = {
                    ...req.body,
                    ...req.params,
                    ...req.query,
                };
            
                let data = {};
            
                try {
                    data = await proxyToCallExternalProcess(request);
                } catch (err) {
                    data.error = err?.message || null;
                }
            
                res.status(200).json(data);
            };
        `);

        this.proxyToCallExternalProcessFnCode = prettyCode(`
            import * as rp from 'request-promise-native';

            export const proxyToCallExternalProcess = async (data) => {
                try {
                    const method = data.method;
            
                    const options = {
                        headers: {
                            'User-Agent': 'Request-Promise',
                            ...data.headers,
                        },
                        method,
                        uri: data.url || data.uri,
                    };
            
                    if (data.json) {
                        options.json = true;
                    }
            
                    if (data.contentType) {
                        options.headers['Content-Type'] = data.contentType;
                    }
            
                    if (data.contentDisposition) {
                        options.encoding = null;
                        options.resolveWithFullResponse = true;
                    }
            
                    if (data.authToken) {
                        options.headers['X-Auth-Token'] = data.authToken;
                    }
            
                    if (method === 'POST' || method === 'PUT') {
                        options.body = data.body;
                    }
            
                    let response = await rp(options);
            
                    response = JSON.parse(response);
            
                    return response;
            
                } catch (err) {
                    throw err;
                }
            }        
        `);
    }

}   