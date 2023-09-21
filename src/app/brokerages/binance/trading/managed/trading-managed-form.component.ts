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
  selector: 'app-trading-managed-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './trading-managed-form.component.html',
  styleUrls: ['./trading-managed-form.component.scss'],
})
export default class TradingManagedFormComponent implements OnInit {

  form = {} as FormType;
  submitEnabled = false as boolean;
  allAccounts: any[];

  credentials: any;

  isLoading = false as boolean;

  baseCurrency: string = 'USDT';

  portfolioValueInBase = {
    base: this.baseCurrency,
    value: 0,
  };

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
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo();
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
    this.callEvents();
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
      await this.binancePlaceOrder();
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
            contractAddress: this.nftCredentialService.getContractAddress(),
            standardContractType: 'ERC1155',
            method: 'balanceOf',
            parameters: [':userAddress', credentialInfo?.tokenId?.toString()],
            returnValueTest: {
              comparator: '>',
              value: '0',
            },
            chain: 'mumbai',
          },
        ];

        const decryptedFile = await litClient.decryptString(
          encryptedFileB64,
          encryptedSymmetricKeyString,
          accessControlConditionsNFT
        );

        if (!isNullOrUndefined(decryptedFile)) {
          this.credentials = JSON.parse(decryptedFile);
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
      await this.decrypt();

      if (
        !isNullOrUndefined(this.credentials?.apiKey) &&
        !isNullOrUndefined(this.credentials?.apiSecret)
      ) {

        const env: 'demo' | 'prod' = this.form.environment as any;

        // work out all the pairs that we have i.e.
        // BTCUSDT

        // loop through the portfolio
        // get all our pairs

        // get a price (fx rate) for all our pairs

        // work out the value in the base currency for each pair using the fx rate

        // total all the pairs
        // return the value

        // NOTE: all the previous steps can be done in one call i.e. getPortfolioAccount(...)
        const litActionCode = litActions.binance.getPortfolioAccount(env, this.baseCurrency);

        const listActionCodeParams = {
          credentials: this.credentials,
          form: this.form,
        };

        const litActionCall = await litClient.runLitAction({
          chain: 'mumbai',
          litActionCode,
          listActionCodeParams,
          nodes: 1,
        });

        const response = litActionCall?.response as any;

        this.portfolioValueInBase = {
          base: response.baseCurrency,
          value: response?.baseCurrencyTotal,
        };

        console.log('calcAccountSettings (response)', response);
        console.log('calcAccountSettings (portfolioValueInBase)', this.portfolioValueInBase);

      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  async binancePlaceOrder() {
    try {

      this.isLoading = true;
      await this.decrypt();

      if (
        !isNullOrUndefined(this.credentials?.apiKey) &&
        !isNullOrUndefined(this.credentials?.apiSecret)
      ) {

        const env: 'demo' | 'prod' = this.form.environment as any;
        const litActionCode = litActions.binance.placeOrder(env);

        const listActionCodeParams = {
          credentials: this.credentials,
          form: this.form,
        };

        const litActionCall = await litClient.runLitAction({
          chain: 'mumbai',
          litActionCode,
          listActionCodeParams,
          nodes: 1,
          showLogs: true,
        });

        const response = litActionCall?.response as any;

        console.log('binancePlaceOrder (response)', response);

        const orderId = response?.orderId || null;

        if (orderId) {
          alert(`Order placed successfully. OrderID: ${orderId}`);
        }

        if (response?.msg) {
          alert(response?.msg);
        }

      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  async getRatesWithBase(currencyA: string, currencyB: string, baseCurrency: string) {
    let data = {
      stepA: {
        currencyA,
        currencyB,
        rate: 0
      },
      stepB: {
        currencyB,
        baseCurrency,
        rate: 0
      },
    }

    // if currency B and the baseCurrency are the same, then we only have a single price to get
    // if they are different, we'll need to get two prices and work out the cross rate

    try {

      // Example: BTC/USDT with a USDT Base
      // we'll need to call Binance to get the price of just BTC/USDT
      data = {
        stepA: {
          currencyA: 'BTC',
          currencyB: 'USDT',
          rate: 26440,
        },
        stepB: {
          currencyB: 'USDT',
          baseCurrency: 'USDT',
          rate: 1
        },
      }

      // Example: BTC/ETH with a USDT Base
      // we'll need to call Binance to get the price of BTC/USDT AND ETH/USDT
      // we should be able to make one call to Binance to get both prices
      data = {
        stepA: {
          currencyA: 'BTC',
          currencyB: 'USDT',
          rate: 26440,
        },
        stepB: {
          currencyB: 'ETH',
          baseCurrency: 'USDT',
          rate: 1668.90
        },
      }

      return data;

    } catch (err: any) {

      console.log('getRatesWithBase (error)', err?.message);

      return data;

    }

  }

}
