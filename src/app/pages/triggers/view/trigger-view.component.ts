import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WeaveDBService } from 'src/app/services/weavedb.service';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { FormsModule } from '@angular/forms';
import { getDefaultAccount } from 'src/app/shared/shared';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-trigger-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './trigger-view.component.html',
  styleUrls: ['./trigger-view.component.scss'],
})
export default class TriggerViewComponent implements OnInit {

  currentOption = 'trigger-view';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: any;
  isLoading = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  account: any;
  triggerId: string;

  executionStatusIsEdit = signal(false);
  maxLeverageIsEdit = signal(false);
  maxPositionSizeIsEdit = signal(false);
  orderSizeIsEdit = signal(false);
  portfolioSlippageIsEdit = signal(false);
  assetsIncludeIsEdit = signal(false);
  assetsExcludeIsEdit = signal(false);

  chatIdIsEdit = signal(false);
  chatTokenIsEdit = signal(false);
  threadIdIsEdit = signal(false);

  slackWebhookIsEdit = signal(false);

  twitterHandleIsEdit = signal(false);
  twitterAppKeyIsEdit = signal(false);
  twitterAppSecretIsEdit = signal(false);
  twitterAccessTokenIsEdit = signal(false);
  twitterAccessSecretIsEdit = signal(false);

  qwilMasterApiKeyIsEdit = signal(false);
  qwilMasterSecretKeyIsEdit = signal(false);
  qwilSenderIdIsEdit = signal(false);
  qwilChatIdIsEdit = signal(false);

  isFullEdit = computed(() => {
    return this.maxLeverageIsEdit()
      ||
      this.maxPositionSizeIsEdit()
      ||
      this.orderSizeIsEdit()
      ||
      this.executionStatusIsEdit()
      ||
      this.maxLeverageIsEdit()
      ||
      this.maxPositionSizeIsEdit()
      ||
      this.orderSizeIsEdit()
      ||
      this.portfolioSlippageIsEdit()
      ||
      this.assetsIncludeIsEdit()
      ||
      this.assetsExcludeIsEdit();
  });

  isTelegramEdit = computed(() => {
    return this.chatIdIsEdit() || this.chatTokenIsEdit() || this.threadIdIsEdit();
  });

  isSlackEdit = computed(() => {
    return this.slackWebhookIsEdit();
  });

  isTwitterEdit = computed(() => {
    return this.twitterHandleIsEdit() || this.twitterAppKeyIsEdit() || this.twitterAppSecretIsEdit() || this.twitterAccessTokenIsEdit() || this.twitterAccessSecretIsEdit();
  });

  isQwilEdit = computed(() => {
    return this.qwilMasterApiKeyIsEdit() || this.qwilMasterSecretKeyIsEdit() || this.qwilSenderIdIsEdit() || this.qwilChatIdIsEdit();
  });

  constructor(
    private route: ActivatedRoute,
    private weaveDBService: WeaveDBService,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
  ) {
    this.trigger = {};
    this.account = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.triggerId = null as any;
  }

  async ngOnInit() {
    // console.log('this.route.snapshot.params', this.route.snapshot.params);
    this.triggerId = this.route.snapshot.params['id'];
    await this.getTriggerSingle();
  }

  async getTriggerSingle() {
    this.isLoading = true;

    try {
      if (this.triggerId.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.trigger = await this.weaveDBService.getDataByDocID<any>(this.triggerId);
        // console.log('this.trigger', this.trigger);

        // supplement with the account details 
        if (this.trigger.account?.reference) {
          await this.getAccount(this.trigger.account?.reference);
        }
      }
    } catch (err) {
      // console.log('get trigger error', err);
    }

    this.isLoading = false;
  }

  async getAccount(accountReference: string) {
    try {

      const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
        autoRedirect: true,
      });
      const accounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
      // console.log('accoubts', accounts);

      for (const i in accounts) {
        if (i) {
          if (accountReference === accounts[i].uuid) {
            this.account = accounts[i];
            // console.log('this.account', this.account);
            break;
          }
        }
      }
    } catch (err) {
      // console.log(err.message);
    }
    this.isLoading = false;
  }

  setEditable(field: string) {
    // Trade Execution
    if (field === 'executionStatus') {
      this.executionStatusIsEdit.set(!this.executionStatusIsEdit());
    }
    if (field === 'maxLeverage') {
      this.maxLeverageIsEdit.set(!this.maxLeverageIsEdit());
    }
    if (field === 'maxPositionSize') {
      this.maxPositionSizeIsEdit.set(!this.maxPositionSizeIsEdit());
    }
    if (field === 'orderSize') {
      this.orderSizeIsEdit.set(!this.orderSizeIsEdit());
    }
    if (field === 'portfolioSlippage') {
      this.portfolioSlippageIsEdit.set(this.portfolioSlippageIsEdit());
    }
    if (field === 'assetsInclude') {
      this.assetsIncludeIsEdit.set(!this.assetsIncludeIsEdit());
    }
    if (field === 'assetsExclude') {
      this.assetsExcludeIsEdit.set(!this.assetsExcludeIsEdit());
    }
    
    // Telegram Notifications
    if (field === 'chatId') {
      this.chatIdIsEdit.set(!this.chatIdIsEdit());
    }
    if (field === 'chatToken') {
      this.chatTokenIsEdit.set(!this.chatTokenIsEdit());
    }
    if (field === 'threadId') {
      this.threadIdIsEdit.set(!this.threadIdIsEdit());
    }

    // Slack
    if (field === 'slackWebhook') {
      this.slackWebhookIsEdit.set(!this.slackWebhookIsEdit());
    }

    // Twitter
    if (field === 'handle') {
      this.twitterHandleIsEdit.set(!this.twitterHandleIsEdit());
    }
    if (field === 'appKey') {
      this.twitterAppKeyIsEdit.set(!this.twitterAppKeyIsEdit());
    }
    if (field === 'appSecret') {
      this.twitterAppSecretIsEdit.set(!this.twitterAppSecretIsEdit());
    }
    if (field === 'accessToken') {
      this.twitterAccessTokenIsEdit.set(!this.twitterAccessTokenIsEdit());
    }
    if (field === 'accessSecret') {
      this.twitterAccessSecretIsEdit.set(!this.twitterAccessSecretIsEdit());
    }

    // Qwil
    if (field === 'qwilMasterApiKey') {
      this.qwilMasterApiKeyIsEdit.set(this.qwilMasterApiKeyIsEdit());
    }
    if (field === 'qwilMasterSecretKey') {
      this.qwilMasterSecretKeyIsEdit.set(!this.qwilMasterSecretKeyIsEdit());
    }
    if (field === 'qwilSenderId') {
      this.qwilSenderIdIsEdit.set(!this.qwilSenderIdIsEdit());
    }
    if (field === 'qwilChatId') {
      this.qwilChatIdIsEdit.set(!this.qwilChatIdIsEdit());
    }
    
  }

  async updateTrigger() {

    const userWallet = await getDefaultAccount();

    const { pkpPublicKey } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
      autoRedirect: true,
    });

    const docId = this.trigger.docId;

    const triggerInfo = {
      ...this.trigger,
    };
    // console.log('triggerInfo', triggerInfo);
    

    delete triggerInfo.docId;

    await this.weaveDBService.upsertData({
      pkpKey: pkpPublicKey,
      type: 'trigger',
      userWallet,
      jsonData: triggerInfo,
      isCompressed: false,
      docId,
    });

    this.executionStatusIsEdit.set(false);
    this.maxLeverageIsEdit.set(false);
    this.maxPositionSizeIsEdit.set(false);
    this.orderSizeIsEdit.set(false);
    this.portfolioSlippageIsEdit.set(false);
    this.assetsIncludeIsEdit.set(false);
    this.assetsExcludeIsEdit.set(false);

    this.chatIdIsEdit.set(false);
    this.chatTokenIsEdit.set(false);
    this.threadIdIsEdit.set(false);

    this.slackWebhookIsEdit.set(false);

    this.twitterHandleIsEdit.set(false);
    this.twitterAppKeyIsEdit.set(false);
    this.twitterAppSecretIsEdit.set(false);
    this.twitterAccessTokenIsEdit.set(false);
    this.twitterAccessSecretIsEdit.set(false);

    this.qwilMasterApiKeyIsEdit.set(false);
    this.qwilMasterSecretKeyIsEdit.set(false);
    this.qwilSenderIdIsEdit.set(false);
    this.qwilChatIdIsEdit.set(false);
  
  }
}
