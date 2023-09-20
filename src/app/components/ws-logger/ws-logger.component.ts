import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
    animate,
    state,
    style,
    transition,
    trigger
} from '@angular/animations';
import { WSService } from 'src/app/services/web-socket.service';
import { getDefaultAccount } from 'src/app/shared/shared';
import { copyValue, isNullOrUndefined, wait } from 'src/app/helpers/helpers';

const animationsSettings = [
    trigger('EnterLeave', [
        state('flyIn', style({ transform: 'translateY(0)' })),
        transition(':enter', [
            style({ transform: 'translateY(300px)' }),
            animate('0.2s ease-in')
        ]),
        transition(':leave', [
            animate('0.3s ease-out', style({ transform: 'translateY(300px)' }))
        ])
    ])
];

@Component({
    animations: animationsSettings,
    selector: 'app-ws-logger',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './ws-logger.component.html',
    styleUrls: ['./ws-logger.component.scss']
})
export default class WSLoggerComponent implements OnInit {

    loadingStatus = true;
    checkConsole = false;
    finishEvent = true;

    messages = new Array();

    currentIndex = -1;
    currentRawInfo: any = null;

    constructor(
        private wsService: WSService,
    ) {

    }

    async ngOnInit() {
        const walletAddress = await getDefaultAccount();

        // NOTE: this will be the url of the D2 event listener user service
        // we can store this url and use dinamically
        // and add the auth via signed message (user directly sign a message with his wallet)
        const wsUrl = 'wss://d2-event-listener.ixily.io/?walletAddress=' + walletAddress;

        this.wsService.connect(
            'ws-logger', wsUrl,
        );

        this.getLogs();
    }

    async getLogs() {
        this.wsService.listenData('ws-logger')
            .subscribe((data: any) => {
                this.messages.unshift(data);
            });
    }

    finishAnimation(e: any) {
        if (e.toState === 'void') {
            this.finishEvent = true;
        }
    }

    openOrCloseConsole() {
        this.checkConsole = !this.checkConsole;
        this.finishEvent = false;
    }

    iconByType(type: string) {
        const icons: any = {
            'success': 'bx bx-check-circle success-message',
            'error': 'bx bx-error-circle error-message',
            'info': 'bx bx-flag info-message',
            'warning': 'bx bxs-error warning-message',
        };
        const defaultIcon = icons['info'];
        return icons[type] || defaultIcon;
    }

    expandInfo(info: any, index: number) {
        if (this.currentIndex === index) {
            this.currentIndex = -1;
            this.currentRawInfo = null;
            return;
        }
        const infoString = JSON.stringify(info, null, 2);
        this.currentRawInfo = infoString;
        this.currentIndex = index;
    }

    copyCode(code: string, event: any) {
        event.target.innerHTML = `
            <i class='bx bx-copy-alt'></i> Copied!
        `;

        wait(1000).then(() => {
            event.target.innerHTML = `
                <i class='bx bx-copy-alt'></i> Copy
            `;
        });

        copyValue(code);
    }

}   