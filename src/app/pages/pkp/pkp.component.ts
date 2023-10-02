import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// import { EventService, EventType } from 'src/axpp/services/event.service';
import NavbarAuthComponent from 'src/app/components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from 'src/app/components/left-menu/left-menu.component';

import { FormsModule } from '@angular/forms';
import { WeaveDBService } from 'src/app/services/weavedb.service';

import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { copyValue, isNullOrUndefined, wait } from 'src/app/helpers/helpers';

const litPkpUrl = 'https://explorer.litprotocol.com/pkps';

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

    pkpLoading = false;
    pkpUsersLoading = false;
    pkpMintLoading = false;

    constructor(
        private router: Router,
        private weaveDBService: WeaveDBService,
        private pKPGeneratorService: PKPGeneratorService,
    ) {
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
        try {
            this.pkpLoading = true;

            const pkpData = await this.pKPGeneratorService.getPKPInfo();

            if (!isNullOrUndefined(pkpData)) {
                this.pkpInfoDocId = pkpData?.docId;
                this.pkpInfo = pkpData;
                this.pkpInfo.url = `${litPkpUrl}/${this.pkpInfo.tokenId}`;

                this.pkpLoading = false;

                // this.pkpUsersLoading = true;

                // const wallets =
                //     await this.pKPGeneratorService.getWalletsWithAccess(this.pkpInfo.tokenId);

                // this.pkpUsersLoading = false;

                // this.walletsWithAccess = wallets;

            }

            if (isNullOrUndefined(pkpData)) {
                const mint = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
                    autoMint: true,
                });
                this.pkpInfo = mint;
                this.pkpInfo.url = `${litPkpUrl}/${mint.tokenId}`;
                this.pkpLoading = false;
            }

        } catch (err) {
            this.pkpLoading = false;
        }
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

    async deletePkp() {
        const docId = this.pkpInfo.docId;
        await this.weaveDBService.deleteData(docId);
        this.pkpInfo = null as any;
        await this.getPkpInfo();
    }

    reload() {
        window.location.reload();
    }
}