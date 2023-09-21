import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WeaveDBService } from 'src/app/services/weavedb.service';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-trigger-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trigger-view.component.html',
  styleUrls: ['./trigger-view.component.scss'],
})
export default class TriggerViewComponent implements OnInit {

  currentOption = 'trigger-view';
  trigger: any;
  isLoading = false;
  account: any;
  triggerId: string;

  constructor(
    private route: ActivatedRoute,
    private weaveDBService: WeaveDBService,
    private nftCredentialService: NFTCredentialService,
    private pkpGeneratorService: PKPGeneratorService,
  ) {
    this.trigger = {};
    this.account = {};
    this.triggerId = null as any;
  }

  async ngOnInit() {
    console.log('this.route.snapshot.params', this.route.snapshot.params);
    this.triggerId = this.route.snapshot.params['id'];
    await this.getTriggerSingle();
  }

  async getTriggerSingle() {
    this.isLoading = true;

    try {
      if (this.triggerId.length > 0) {
        this.trigger = await this.weaveDBService.getDataByDocID<any>(this.triggerId);

        // supplement with the account details 
        if (this.trigger.account?.reference) {
          await this.getAccount(this.trigger.account?.reference);
        }
      }
      console.log('get trigger', this.trigger);
    } catch (err) {
      // console.log('get trigger error', err);
    }

    this.isLoading = false;
  }

  async getAccount(accountReference: string) {
    try {
      const { pkpWalletAddress } = await this.pkpGeneratorService.getOrGenerateAutoPKPInfo();
      const accounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);

      for (const i in accounts) {
        if (i) {
          if (accountReference === accounts[i].uuid) {
            this.account = accounts[i];
            console.log('this.account', this.account);
            break;
          }
        }
      }
    } catch(err) {
      // console.log(err.message);
    }
    this.isLoading = false;
  }

}
