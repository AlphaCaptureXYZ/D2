import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CONTRACT } from '@ixily/activ-web';
// import v4 = SDK.v4;
import CI = CONTRACT.CONTRACT_INTERFACES;
import { ActivService } from 'src/app/services/activ.service';
import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import { getDefaultAccount } from 'src/app/shared/shared';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { isNullOrUndefined } from 'src/app/helpers/helpers';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { ShortenContractAddress } from 'src/app/pipes/shorten-contract-address.pipe';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-triggers-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ShortenContractAddress],
  templateUrl: './triggers-create.component.html',
  styleUrls: ['./triggers-create.component.scss'],
})
export default class TriggersCreateComponent implements OnInit {
  stage = 1;
  strategies = [] as CI.ITradeIdeaStrategy[];
  isLoading = false;
  currentStrategy: any;

  allAccounts: any[];

  actions = [
    {
      option: 'copy-trade',
      label: 'Copy Trade',
    },
    {
      option: 'slack-webhook',
      label: 'Slack Webhook',
    },
    {
      option: 'telegram-notification',
      label: 'Telegram Notification',
    },
    {
      option: 'twitter-post',
      label: 'Twitter Post',
    },
  ];

  form: FormGroup = new FormGroup({
    action: new FormControl(null),
    strategy: new FormControl(null),

    // copy trade
    account: new FormControl(null),
    maximumLeverage: new FormControl(''),
    defaultOrderSize: new FormControl(''),
    maxSizePortofolio: new FormControl(''),
    portfolioSlippage: new  FormControl(''),

    // telegram
    chatId: new FormControl(''),
    chatToken: new FormControl(''),
    threadId: new FormControl(''),

    // slack
    slackWebhook: new FormControl(''),

    // twitter
    handle:  new FormControl(''),
    appKey:  new FormControl(''),
    appSecret: new FormControl(''),
    accessToken: new FormControl(''),
    accessSecret: new FormControl(''),
  });

  constructor(
    private router: Router,
    private weaveDBService: WeaveDBService,
    private activService: ActivService,
    private nftCredentialService: NFTCredentialService,
    private pkpGeneratorService: PKPGeneratorService,
    private formBuilder: FormBuilder
  ) {
    this.allAccounts = [];
  }

  async ngOnInit() {
    await Promise.all([this.getStrategies(), this.getAccounts()]);

    this.form = this.formBuilder.group({
      action: ['', Validators.required],
      strategy: ['', Validators.required],

      // copy trade
      account: ['', Validators.required],
      maximumLeverage: ['1', Validators.required],
      defaultOrderSize: ['1', Validators.required],
      maxSizePortofolio: ['1', Validators.required],
      portfolioSlippage: ['2', Validators.required],

      // telegram
      // https://stackoverflow.com/questions/74773675/how-to-get-topic-id-for-telegram-group-chat
      chatId: ['', Validators.required],
      chatToken: ['', Validators.required],
      threadId: ['', Validators.required],

      // slack
      slackWebhook: ['', Validators.required],

      // twitter
      handle: ['', Validators.required],
      // TWITTER_CONSUMER_KEY
      appKey: ['', Validators.required],
      // TWITTER_CONSUMER_SECRET
      appSecret: ['', Validators.required],
      // TWITTER_ACCESS_TOKEN,
      accessToken: ['', Validators.required],
      // // TWITTER_ACCESS_TOKEN_SECRET,
      accessSecret: ['', Validators.required],

    });
  }

  setAction() {
    if (this.form.get('action')?.valid) {
      this.stage = 2;
    }
  }

  setStrategy() {
    if (this.form.get('strategy')?.valid) {

      this.currentStrategy = this.strategies.find(
        (s) => s.reference === this.form.value.strategy
      );
      // console.log('this.currentStrategy', this.currentStrategy);

      // if this is a copy trade, then we need to set the account
      switch (this.form.value.action) {
        case 'copy-trade':
          this.stage = 3;
          break;
        case 'telegram-notification':
          this.stage = 30;
          break;  
        case 'slack-webhook':
          this.stage = 40;
          break;  
        case 'twitter-post':
          this.stage = 50;
          break;  
        }      
        console.log('this.stage', this.stage);
    }
  }

  setAccountCopyTrade() {
    if (this.form.get('account')?.valid) {
      this.stage = 4;
    }
  }

  async setSettingsCopyTrade() {
    if (this.form.valid) {
      const userWallet = await getDefaultAccount();

      const strategy = this.strategies.find(
        (s) => s.reference === this.form.value.strategy
      );

      const account: any = this.allAccounts.find(
        (a) => a.uuid === this.form.value.account
      );

      if (!isNullOrUndefined(strategy) && !isNullOrUndefined(account)) {
        const { pkpPublicKey } = await this.pkpGeneratorService.getOrGenerateAutoPKPInfo({
          autoRedirect: true,
        });

        await this.weaveDBService.upsertData({
          pkpKey: pkpPublicKey,
          type: 'trigger',
          userWallet,
          jsonData: {
            action: this.form.value.action,
            strategy: {
              reference: strategy?.reference,
              name: strategy?.name,
            },
            account: {
              reference: account.uuid,
            },
            settings: {
              maxLeverage: this.form.value.maximumLeverage,
              orderSize: this.form.value.defaultOrderSize,
              maxPositionSize: this.form.value.maxSizePortofolio,
              portfolioSlippage: this.form.value.portfolioSlippage,
            },
          },
          isCompressed: false,
        });

        this.stage = 5;

        this.router.navigateByUrl('/triggers');
      }
    }
  }

  async setSettingsTelegram() {
    // console.log('test pre form valid check');
    if (this.form.valid) {
      const userWallet = await getDefaultAccount();
      // console.log('submit the form A', userWallet);

      const strategy = this.strategies.find(
        (s) => s.reference === this.form.value.strategy
      );
      // console.log('submit the form B', strategy);
    
      if (!isNullOrUndefined(strategy) && !isNullOrUndefined(this.form.value.chatId) && !isNullOrUndefined(this.form.value.chatToken)) {
        // console.log('submit the form')
        const { pkpPublicKey } = await this.pkpGeneratorService.getOrGenerateAutoPKPInfo({
          autoRedirect: true,
        });

        await this.weaveDBService.upsertData({
          pkpKey: pkpPublicKey,
          type: 'trigger',
          userWallet,
          jsonData: {
            action: this.form.value.action,
            strategy: {
              reference: strategy?.reference,
              name: strategy?.name,
            },
            settings: {
              chatId: this.form.value.chatId,
              chatToken: this.form.value.chatToken,
              threadId: this.form.value.threadId,
            },
          },
          isCompressed: false,
        });

        this.stage = 5;

        this.router.navigateByUrl('/triggers');
      }
    }    
  }

  async setSettingsSlack() {

      const userWallet = await getDefaultAccount();
      // console.log('submit the form A', userWallet);

      const strategy = this.strategies.find(
        (s) => s.reference === this.form.value.strategy
      );
      // console.log('submit the form B', strategy);
      // console.log('submit the form B', this.form.value.slackWebhook);
          
      if (!isNullOrUndefined(strategy) && !isNullOrUndefined(this.form.value.slackWebhook)) {
        // console.log('submit the form')
        const { pkpPublicKey } = await this.pkpGeneratorService.getOrGenerateAutoPKPInfo({
          autoRedirect: true,
        });

        await this.weaveDBService.upsertData({
          pkpKey: pkpPublicKey,
          type: 'trigger',
          userWallet,
          jsonData: {
            action: this.form.value.action,
            strategy: {
              reference: strategy?.reference,
              name: strategy?.name,
            },
            settings: {
              webhook: this.form.value.slackWebhook,
            },
          },
          isCompressed: false,
        });

        this.stage = 5;

        this.router.navigateByUrl('/triggers');
      }
  }

  async setSettingsTwitter() {

    const userWallet = await getDefaultAccount();
    // console.log('submit the form A', userWallet);

    const strategy = this.strategies.find(
      (s) => s.reference === this.form.value.strategy
    );
    // console.log('submit the form B', strategy);
    // console.log('submit the form B', this.form.value.slackWebhook);
        
    if (!isNullOrUndefined(strategy) && !isNullOrUndefined(this.form.value.slackWebhook)) {
      // console.log('submit the form')
      const { pkpPublicKey } = await this.pkpGeneratorService.getOrGenerateAutoPKPInfo({
        autoRedirect: true,
      });

      await this.weaveDBService.upsertData({
        pkpKey: pkpPublicKey,
        type: 'trigger',
        userWallet,
        jsonData: {
          action: this.form.value.action,
          strategy: {
            reference: strategy?.reference,
            name: strategy?.name,
          },
          settings: {
            handle: this.form.value.handle,
            appKey: this.form.value.appKey,
            appSecret: this.form.value.appSecret,
            accessToken: this.form.value.accessToken,
            accessSecret: this.form.value.accessSecret,
          },
        },
        isCompressed: false,
      });

      this.stage = 5;

      this.router.navigateByUrl('/triggers');
    }
}


  goBack() {
    // set our new action here
    if (this.stage > 10) {
      this.stage = 2;
    } else {
      this.stage = this.stage - 1;
    }
  }

  goToSection(section: number) {
    // set our new action here
    this.stage = section;
  }

  async getStrategies() {
    this.isLoading = true;
    // strategies the user has explicit access to
    this.strategies = await this.activService.listMyStrategies() || [];
    // console.log('allStrategies', this.strategies);
    this.isLoading = false;
  }

  async getAccounts() {
    this.isLoading = true;
    const { pkpWalletAddress } =
      await this.pkpGeneratorService.getOrGenerateAutoPKPInfo({
        autoRedirect: true,
      });
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress) || [];
    // console.log('allAccounts', this.allAccounts);
    this.isLoading = false;
  }

  submitForm() {
    if (this.form.invalid) {
    }
  }
}
