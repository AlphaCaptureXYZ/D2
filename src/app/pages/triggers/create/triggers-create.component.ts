import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SDK, CONTRACT } from '@ixily/activ-web';
import v4 = SDK.v4;
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

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-triggers-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './triggers-create.component.html',
  styleUrls: ['./triggers-create.component.scss'],
})
export default class TriggersCreateComponent implements OnInit {
  stage = 1;
  strategies = [] as CI.ITradeIdeaStrategy[];
  isLoading = false;

  allAccounts: any[];

  actions = [
    {
      option: 'copy-trade',
      label: 'Copy Trade',
    },
  ];

  defaulAction = 'copy-trade';

  form: FormGroup = new FormGroup({
    action: new FormControl(this.defaulAction),
    strategy: new FormControl(null),
    account: new FormControl(null),
    maximumLeverage: new FormControl(''),
    defaultOrderSize: new FormControl(''),
    maxSizePortofolio: new FormControl(''),
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
      action: [this.defaulAction, Validators.required],
      strategy: [this.strategies[0], Validators.required],
      account: [this.allAccounts[0], Validators.required],
      maximumLeverage: ['', Validators.required],
      defaultOrderSize: ['', Validators.required],
      maxSizePortofolio: ['', Validators.required],
    });
  }

  setAction() {
    if (this.form.get('action')?.valid) {
      this.stage = 2;
    }
  }

  setStrategy() {
    if (this.form.get('strategy')?.valid) {
      this.stage = 3;
    }
  }

  setAccount() {
    if (this.form.get('account')?.valid) {
      this.stage = 4;
    }
  }

  async setSettings() {
    if (this.form.valid) {
      const userWallet = await getDefaultAccount();

      const strategy = this.strategies.find(
        (s) => s.reference === this.form.value.strategy
      );

      const account: any = this.allAccounts.find(
        (a) => a.uuid === this.form.value.account
      );

      if (!isNullOrUndefined(strategy) && !isNullOrUndefined(account)) {
        const { pkpPublicKey } =
          await this.pkpGeneratorService.getOrGenerateAutoPKPInfo();

        await this.weaveDBService.upsertData({
          pkpKey: pkpPublicKey,
          type: 'trigger',
          userWallet,
          jsonData: {
            action: this.form.value.action,
            strategy: {
              reference: strategy?.uniqueKey,
              name: strategy?.name,
            },
            account: {
              reference: account.uuid,
            },
            settings: {
              maxLeverage: this.form.value.maximumLeverage,
              orderSize: this.form.value.defaultOrderSize,
              maxPositionSize: this.form.value.maxSizePortofolio,
            },
          },
          isCompressed: false,
        });

        this.stage = 5;

        this.router.navigateByUrl('/triggers');
      }
    }
  }

  goBack() {
    // set our new action here
    this.stage = this.stage - 1;
  }

  goToSection(section: number) {
    // set our new action here
    this.stage = section;
  }

  async getStrategies() {
    this.isLoading = true;
    // strategies the user has explicit access to
    this.strategies = await this.activService.listAccessibleStrategies();
    console.log('allStrategies', this.strategies);
    this.isLoading = false;
  }

  async getAccounts() {
    this.isLoading = true;
    const { pkpWalletAddress } =
      await this.pkpGeneratorService.getOrGenerateAutoPKPInfo();
    this.allAccounts = await this.nftCredentialService.getMyCredentials(
      pkpWalletAddress
    );
    console.log('allAccounts', this.allAccounts);
    this.isLoading = false;
  }

  submitForm() {
    if (this.form.invalid) {
    }
  }
}
