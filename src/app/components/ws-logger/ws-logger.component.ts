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
import { getDefaultAccount, getTickerIcon } from 'src/app/shared/shared';
import { copyValue, isNullOrUndefined, wait } from 'src/app/helpers/helpers';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import { environment } from 'src/environments/environment';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { EventService } from 'src/app/services/event.service';

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
        private weaveDBService: WeaveDBService,
        private pKPGeneratorService: PKPGeneratorService,
        private eventService: EventService,
    ) {

    }

    async ngOnInit() {
        const walletAddress = await getDefaultAccount();

        let data = await this.weaveDBService.getAllData<any>({
            type: 'setting',
        });

        const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo();

        data = data?.filter((s) => {
            const check = s?.pkpWalletAddress?.toLowerCase() === pkpWalletAddress?.toLowerCase();
            return check;
        });

        const eventListenerUrl: string =
            data[0]?.event_listener_url || environment.defaultEventListenerUrl;

        const wsUrl =
            eventListenerUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '?walletAddress=' + walletAddress;

        this.wsService.connect(
            'ws-logger', wsUrl,
        );

        this.getLogs();
    }

    async getLogs() {
        this.wsService.listenData('ws-logger')
            .subscribe(async (data: any) => {
                this.messages.unshift(data);
                this.tradeDetector(data);
            });
    }

    async tradeDetector(info: any) {
        const trade = info?.data;

        // Binance
        const binanceTrade = trade?.eventType === 'executionReport';

        let payload = {
            raw: null,
            id: null,
            ticker: null,
            direction: null,
            quantity: 0,
            price: 0,
            logo: null,
        };

        if (binanceTrade) {
            const logo = await getTickerIcon(trade?.symbol);

            payload = {
                raw: trade,
                id: trade?.orderId,
                ticker: trade?.symbol,
                direction: trade?.side,
                quantity: parseFloat(trade?.lastTradeQuantity),
                price: parseFloat(trade?.lastTradePrice),
                logo,
            };
        }

        if (payload?.ticker) {
            this.eventService.emit('TRADE_VIA_WS_LISTENER', payload);
        }
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