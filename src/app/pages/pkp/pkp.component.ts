import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { EventService, EventType } from 'src/app/services/event.service';
import NavbarAuthComponent from 'src/app/components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from 'src/app/components/left-menu/left-menu.component';

import { FormsModule } from '@angular/forms';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import { getDefaultAccount } from 'src/app/shared/shared';

import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { copyValue, wait } from 'src/app/helpers/helpers';

const litPkpUrl = 'https://explorer.litprotocol.com/pkps';

interface FormType {
    proxy_url: string;
    croupier_url: string;
}

@Component({
    selector: 'app-pkp',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        NavbarAuthComponent,
        LeftMenuComponent,
        FormsModule,
    ],
    templateUrl: './pkp.component.html',
    styleUrls: ['./pkp.component.scss']
})
export default class SettingsComponent implements OnInit {

    pkpInfoDocId: string;

    pkpInfo: any;

    walletAddressToAddAccess: string;
    walletsWithAccess: any[] = [];

    pkpLoading: boolean;

    constructor(
        private router: Router,
        private weaveDBService: WeaveDBService,
        private pKPGeneratorService: PKPGeneratorService,
    ) {
        this.pkpLoading = false;
        this.walletAddressToAddAccess = null as any;
        this.pkpInfo = null as any;
        this.pkpInfoDocId = undefined as any;
    }

    async ngOnInit() {
        await this.getPkpInfo();
    }

    resetLitAuth() {
        localStorage.removeItem('lit-web3-provider');
        localStorage.removeItem('lit-comms-keypair');
        localStorage.removeItem('lit-auth-signature');
        window.location.reload();
    }

    goToPage = (option: string): void => {
        if (option === 'proxy-guide') {
            this.router.navigateByUrl('guides/proxy-service');
        }
    }

    copyCode(code: string, event: any) {
        event.target.innerText = 'Copied!';

        wait(1000).then(() => {
            event.target.innerText = 'Copy';
        });

        copyValue(code);
    }

    async getPkpInfo() {


        const data = await this.weaveDBService.getAllData<any>({
            type: 'pkp-info'
        });

        if (data?.length > 0) {
            this.pkpInfoDocId = data[0]?.docId;
            this.pkpInfo = data[0];
            this.pkpInfo.url = `${litPkpUrl}/${this.pkpInfo.tokenId}`;

            this.pkpLoading = true;
            const wallets =
                await this.pKPGeneratorService.getWalletsWithAccess(this.pkpInfo.tokenId);
            this.pkpLoading = false;

            this.walletsWithAccess = wallets;

        }
    }

    async generatePkp() {
        this.pkpLoading = true;

        try {
            const mint = await this.pKPGeneratorService.mint();

            const userWallet = await getDefaultAccount();

            await this.weaveDBService.upsertData({
                type: 'pkp-info',
                jsonData: mint,
                userWallet,
                isCompressed: false,
                pkpKey: mint.pkpPublicKey,
            });

            this.pkpInfo = mint;

            this.pkpInfo.url = `${litPkpUrl}/${mint.tokenId}`;
        } catch (err: any) {
            console.log('generatePkp', err.message);
        }

        this.pkpLoading = false;
    }

    async addWalletAccess() {
        if (this.walletAddressToAddAccess?.trim()?.length > 0) {
            this.pkpLoading = true;
            this.walletsWithAccess = await this.pKPGeneratorService.addAccess(
                this.pkpInfo.tokenId,
                this.walletAddressToAddAccess
            );
            this.pkpLoading = false;
        }
    }
}