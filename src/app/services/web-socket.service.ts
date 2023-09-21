import { Injectable } from '@angular/core';

import * as helpers from '../helpers/helpers';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WSService {

    private static wsObj: any = {};

    constructor() { }

    connect(serviceName: string, url: string) {
        if (helpers.isNullOrUndefined(WSService?.wsObj[serviceName])) {
            WSService.wsObj[serviceName] = new WebSocket(url);
        }
    }

    sendData(serviceName: string, payload: any) {
        try {
            WSService.wsObj[serviceName].onopen = () => {
                WSService.wsObj[serviceName].send(JSON.stringify(payload));
            };
        } catch (err) {
            console.log('WSService getMessages (err)', err);
        }
    }

    listenData(serviceName: string): Observable<any> {
        return new Observable((observer) => {
            WSService.wsObj[serviceName].onmessage = (event: any) => {
                const data = JSON.parse(event.data);
                observer.next(data);
            };
        });
    }

}