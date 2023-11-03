import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { EventService, EventType } from 'src/app/services/event.service';

import litClient from "src/app/scripts/Lit";

import { isNullOrUndefined } from 'src/app/helpers/helpers';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';

import * as litActions from 'src/app/scripts/lit-actions';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

interface FormType {
  credentialNftUuid: string,
  broker: string;
  environment: string;
  asset: string;
  direction: string;
  quantity: number;
  conviction: number;
  value: number;
  orderLimits: boolean;
  maxLeverage: number;
  defaultOrderSize: number;
  maxSizePortofolio: number;

  accountBalance: number;
  defaultOrderValue: number;
  maxPortofolioValue: number,
  remainingPositionValue: number,

}

@Component({
  selector: 'app-trading-managed-ig-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './trading-managed-form.component.html',
  styleUrls: ['./trading-managed-form.component.scss'],
})
export default class TradingManagedIGFormComponent implements OnInit {

  form = {} as FormType;
  submitEnabled = false as boolean;
  allAccounts: any[];
  broker = 'IG';
  credentials: any;

  isLoading = false as boolean;
  isLoadingCredentials = false as boolean;

  data = {
    account: {
        balance: 0,
        leverage: 1,
        leverageBalance: 0,
    },
    existingPosition: {
        valueInBase: 0,
        currentPortfolioAllocation: 0,
    },
    order: {
      default: {
        value: 0,
        valueWithConviction: 0,
        portfolioAllication: 0,
        conviction: 0,
      }
    }

    // valueInBase: 0,
    // quantity: 0,
    // calculation: {
    //   base: {
        
    //   }
    //     defaultOrderValueInBase: 0,
    //     defaultOrderSizeAsPercent: 0,
    //     maximumPositionValueInBase: 0,
    //     maximumPositionSizeAsPercent: 0,
    //     exceedsMaximum: false,
    // }    
}  

  constructor(
    private router: Router,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    private eventService: EventService,
    public cRef: ChangeDetectorRef,
  ) {
    this.form = {
      credentialNftUuid: '',
      broker: '',
      environment: 'prod',
      asset: '',
      direction: 'buy',
      quantity: 1,
      conviction: 100,
      value: 0,
      orderLimits: false,
      maxLeverage: 1,
      defaultOrderSize: 2,
      maxSizePortofolio: 10,

      accountBalance: 0,
      defaultOrderValue: 0,
      maxPortofolioValue: 0,
      remainingPositionValue: 0,
    };
    this.allAccounts = [];

  }

  async ngOnInit() {
    this.getCredentials();
    this.callEvents();
  }

  async getCredentials() {
    this.isLoadingCredentials = true;
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
      autoRedirect: true,
    });
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
    this.allAccounts = this.allAccounts.filter(res => res.provider === this.broker);
    this.isLoadingCredentials = false;
  }

  callEvents = () => {
    this.eventService.listen().subscribe(async (res: any) => {
      const event = res.type as EventType;
      const data = res?.data || null;

      switch (event) {
        case 'TO_MANAGED':
          //console.log('data', data)
          this.form = {
            ...this.form,
            broker: data.pricingProvider,
            environment: 'prod',
            asset: data.asset,
            direction: 'buy',
            quantity: 1,
          };
          break;
      }
    });
  };

  requiredControl = (valueChanged?: string): void => {
    const credentialNftUuid = this.form.credentialNftUuid;
    const account = this.allAccounts?.find(res => res.uuid === credentialNftUuid);

    if (account) {
      this.form.broker = account.provider;
      this.form.environment = account.environment;
      this.cRef.detectChanges();
    }

    if (valueChanged === 'credential') {
      this.calculatePortfolioValueInBaseCurrency();
    }

    if (
      this.form.broker.length > 0 &&
      this.form.asset.length > 0 &&
      this.form.asset.length > 0 &&
      this.form.direction.length > 0 &&
      this.form.quantity > 0
    ) {
      this.submitEnabled = true;
    } else {
      this.submitEnabled = false;
    }
  };

  submit = async () => {
    console.log('form', this.form);

    if (this.form.broker?.toLowerCase() === 'binance') {
      // await this.binancePlaceOrder();
    }
  };

  async decrypt() {
    try {
      if (!isNullOrUndefined(this.form.credentialNftUuid)) {

        const uuid = this.form.credentialNftUuid;

        const credentialInfo = await this.nftCredentialService.getCredentialByUUID(uuid);

        const encryptedFileB64 =
          credentialInfo?.encryptedCredential?.encryptedFileB64;
        const encryptedSymmetricKeyString =
          credentialInfo?.encryptedCredential?.encryptedSymmetricKeyString;

        const accessControlConditionsNFT = [
          {
            contractAddress: await this.nftCredentialService.getContractAddress(),
            standardContractType: 'ERC1155',
            method: 'balanceOf',
            parameters: [':userAddress', credentialInfo?.tokenId?.toString()],
            returnValueTest: {
              comparator: '>',
              value: '0',
            },
            chain: await this.nftCredentialService.getChain(),
          },
        ];

        const decryptedFile = await litClient.decryptString(
          encryptedFileB64,
          encryptedSymmetricKeyString,
          accessControlConditionsNFT
        );

        if (!isNullOrUndefined(decryptedFile)) {
          this.credentials = JSON.parse(decryptedFile);
          console.log('this.credentials', this.credentials);
        }
      }
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to this credential`);
    }
  }

  async calculatePortfolioValueInBaseCurrency() {
    try {

      this.isLoading = true;
      // await this.decrypt();

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  accountBalanceLeveraged(accountBalance: number) {
    // we should call this when we have the account balance from IG

    // from IG after a call
    this.data.account.balance = accountBalance;

    // from the user input
    this.data.account.balance = this.form.maxLeverage;

    // calculated leverage balance
    this.data.account.leverageBalance = this.data.account.balance * this.data.account.balance;      
  }

  defaultOrderCalc() {

    // we're just calculating the default
    this.data.order.default.value = this.form.defaultOrderSize * this.data.account.balance;
    this.data.order.default.valueWithConviction = this.data.order.default.value * this.form.conviction;
    this.data.order.default.conviction = this.form.conviction;

  }


  async orderSizeCalculation(
    accountBalanceInBase: number,
    accountLeverage: number,
    defaultOrderSizeAsPercent: number,
    maximumPositionSizeAsPercent: number,
    existingPositionValueInBase: number,
    ) {
    try {

        // let calculatedOrderValueInBase = 0;
        // let remainingPositionValueInBase = 0;
        // let currentPortfolioAllocation = 0;
        // let exceedsMaximum = false;

        // // we'll do a very simple calc to start i.e. new order and then I'll add the rest for adjust/close etc

        // // account balance in a single base currency
        // // the leveraged balance is the maximum value the portfolio should be at
        // const leveragedBalanceInBase = accountBalanceInBase * accountLeverage;

        // // what a normal trade value should be
        // const defaultOrderValueInBase = defaultOrderSizeAsPercent * leveragedBalanceInBase;
        // // this becomes our default order value
        // calculatedOrderValueInBase = defaultOrderValueInBase;

        // // The existing position 
        // const maximumPositionValueInBase = maximumPositionSizeAsPercent * leveragedBalanceInBase;

        // // the current portfolio percentge
        // currentPortfolioAllocation = (existingPositionValueInBase / leveragedBalanceInBase) * 100;

        // // if the current asset value exceeds the maximum, then the 
        // if (existingPositionValueInBase > maximumPositionValueInBase) {
        //     calculatedOrderValueInBase = 0;
        //     exceedsMaximum = true;
        // } else {

        //     // how much extra value can we buy
        //     remainingPositionValueInBase = maximumPositionValueInBase - existingPositionValueInBase;

        //     if (calculatedOrderValueInBase > remainingPositionValueInBase) {
        //         calculatedOrderValueInBase = remainingPositionValueInBase;
        //     } else {
        //         // there's enough value for the default order
        //     }

        // }


    } catch (err: any) {
        console.log('orderSizeCalculation (error)', err?.message);
    }
}


}
