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
import AppIgEpicInfoByTickerComponent from '../../_components/epic-info-by-ticker/epic-info-by-ticker.component';

import * as Helpers from 'src/app/helpers/helpers';
import { IAssetInfo } from '../../_shared/asset-info.i';
import { IPositionInfo } from '../../_shared/position.i';

interface FormType {
  credentialNftUuid: string,
  broker: string;
  environment: string;
  ticker: string;
  direction: string;
  // quantity: number;
  conviction: number;
  // value: number;
  orderLimits: boolean;
  maxLeverage: number;
  defaultOrderSize: number;
  maxSizePortofolio: number;
}

@Component({
  selector: 'app-trading-managed-ig-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AppIgEpicInfoByTickerComponent,
  ],
  templateUrl: './trading-managed-form.component.html',
  styleUrls: ['./trading-managed-form.component.scss'],
})
export default class TradingManagedIGFormComponent implements OnInit {

  form = {} as FormType;
  submitEnabled = false as boolean;
  allAccounts: any[];
  broker = 'IG';
  credentials: any;
  refreshLoading = false;

  positions: IPositionInfo[];
  portfolio: any[];

  accountSelected = null;

  epic: string;
  assetInfo: IAssetInfo = null as any;

  isLoading = false as boolean;
  isLoadingCredentials = false as boolean;

  orderSummaryMenu = [
    false, // account settings
    false, // asset
    false, // order default settings
    false, // order custom settings
    false, // existing position
    false, // validations
    false, // potential order
    true, // final adjusted order
    false, // existing portfolio
  ]

  data = {
    asset: {
      ticker: '',
      price: {
        ask: 0,
        bid: 0,
      },
      minQty: 1,
      fractional: false,
      decimals: 1,
    },
    account: {
      balance: 0,
      leverage: 1,
      leverageBalance: 0,
      currencySymbol: '$',
    },
    existingPosition: {
      valueInBase: 0,
      currentPortfolioAllocation: 0,
      remainingValue: 0,
    },
    order: {
      default: {
        value: 0,
        valueWithConviction: 0,
        portfolioAllocation: 0,
      },
      settings: {
        conviction: 0,
        maxPortfolioSize: 1,
        maxPortfolioValue: 0,
      },
      calc: {
        maxPortfolioValueExceeded: false,
        maxPortfolioValueExceededBy: 0,
        overrideLimits: false,
        exceedsMinQty: true,
      },
      potential: {
        direction: '',
        value: 0,
        quantity: 0,
        orderSizePercentage: 0,
        portfolio: {
          value: 0,
          allocation: 0,
        },
        price: {
          value: 0,
          type: '',
        }
      },
      final: {
        direction: '',
        value: 0,
        quantity: {
          raw: 0,
          rounded: 0,
        },
        orderSizePercentage: 0,
        portfolio: {
          value: 0,
          allocation: 0,
        },
        price: {
          value: 0,
          type: '',
        }
      }
    }
  }

  constructor(
    private router: Router,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    private eventService: EventService,
    public cRef: ChangeDetectorRef,
  ) {
    this.epic = null as any;
    this.form = {
      credentialNftUuid: '',
      broker: '',
      environment: 'prod',
      ticker: '',
      direction: 'buy',
      // quantity: 1,
      conviction: 100,
      // value: 0,
      orderLimits: false,
      maxLeverage: 1,
      defaultOrderSize: 2,
      maxSizePortofolio: 10,
    };
    this.allAccounts = [];
    this.positions = [];
    this.portfolio = [];

  }

  async ngOnInit() {
    this.getCredentials();
    this.getAccountBalanceAndPositions();
    this.defaultOrderCalcUsingtheAccountBalance();
    this.callEvents();
  }

  refreshBrokerageData() {
    this.refreshLoading = true;
    this.getAccountBalanceAndPositions();
    this.defaultOrderCalcUsingtheAccountBalance();
    this.callEvents();
    this.refreshLoading = false;
  }

  async getCredentials() {
    this.isLoadingCredentials = true;
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
      autoRedirect: true,
    });
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);

    console.log('this.allAccounts', this.allAccounts);

    this.allAccounts = this.allAccounts.filter(res => res.provider === this.broker);
    this.isLoadingCredentials = false;
  }

  async getAccountBalanceAndPositions() {
    // call IG if we have credentials

    const accountCurrencySymbol = '£';
    this.data.account.currencySymbol = accountCurrencySymbol;


    const accountBalance = 999;

    this.data.account.balance = accountBalance;
    this.data.account.leverageBalance = accountBalance * this.data.account.leverage;

    // get any existing position for the asset
    const existingPositionValue = 40;

    if (existingPositionValue) {
      this.data.existingPosition.valueInBase = existingPositionValue;
      this.data.existingPosition.currentPortfolioAllocation = this.data.existingPosition.valueInBase / this.data.account.leverageBalance * 100;
    }
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
            ticker: data.ticker,
            direction: 'buy',
            // quantity: 1,
          };
          break;
      }
    });
  };

  requiredControl = (valueChanged?: string): void => {
    // console.log('valueChanged', valueChanged);
    const credentialNftUuid = this.form.credentialNftUuid;
    const account = this.allAccounts?.find(res => res.uuid === credentialNftUuid);

    if (account) {
      this.accountSelected = account;
      this.form.broker = account.provider;
      this.form.environment = account.environment;
      this.cRef.detectChanges();
      this.getCurrentPositions();
    }

    if (valueChanged === 'credential') {
      this.calculatePortfolioValueInBaseCurrency();
    }

    // this refreshes everything
    this.refreshFormCalculation();

    // replace this with a check for the order qty
    if (
      this.form.broker.length > 0 &&
      this.form.ticker.length > 0 &&
      this.form.ticker.length > 0 &&
      this.form.direction.length > 0
      // && this.form.quantity > 0
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

  accountBalanceLeveraged() {
    // calculated leverage balance
    this.data.account.leverageBalance = this.data.account.balance * this.data.account.leverage;
  }

  defaultOrderCalcUsingtheAccountBalance() {

    // updatye our override setting
    this.data.order.calc.overrideLimits = this.form.orderLimits;

    // we're just calculating the default
    this.data.order.default.portfolioAllocation = this.form.defaultOrderSize;
    this.data.order.default.value = (this.form.defaultOrderSize / 100) * this.data.account.balance;
    this.data.order.default.valueWithConviction = this.data.order.default.value * (this.form.conviction / 100);
    this.data.order.settings.conviction = this.form.conviction;

    //
    this.data.order.settings.maxPortfolioSize = this.form.maxSizePortofolio;
    this.data.order.settings.maxPortfolioValue = (this.data.order.settings.maxPortfolioSize / 100) * this.data.account.leverageBalance;

    // does the calculated value exceed the max?
    // we need the combined value of the order and the existing portfolio value
    const aggregatePosition = this.data.existingPosition.valueInBase + this.data.order.default.valueWithConviction;
    if (aggregatePosition > this.data.order.settings.maxPortfolioValue) {
      this.data.order.calc.maxPortfolioValueExceeded = true;
      this.data.order.calc.maxPortfolioValueExceededBy = this.data.order.default.valueWithConviction - this.data.order.settings.maxPortfolioValue;
    } else {
      this.data.order.calc.maxPortfolioValueExceeded = false;
      this.data.order.calc.maxPortfolioValueExceededBy = 0;
    }


    // our remaining position size (related to the existing portfolio position) needs to be calculated here
    this.data.existingPosition.remainingValue = this.data.order.settings.maxPortfolioValue - this.data.existingPosition.valueInBase;

    // PRE

    // the potential order size is that before any vaidations are appliued
    this.data.order.potential.value = this.data.order.default.valueWithConviction;
    this.data.order.potential.portfolio.value = this.data.existingPosition.valueInBase + this.data.order.default.valueWithConviction;
    this.data.order.potential.portfolio.allocation = this.data.order.potential.portfolio.value / this.data.account.leverageBalance * 100;

    // qty needs to be worked out based on the price
    // if the direction 'buy' we using the bid
    this.data.order.potential.direction = this.form.direction;

    // and sell, we use the ask
    if (this.data.order.potential.direction.toLowerCase() === 'sell') {
      this.data.order.potential.price.type = 'sell';
      this.data.order.potential.price.value = this.data.asset.price.bid;
    } else {
      this.data.order.potential.price.type = 'buy';
      this.data.order.potential.price.value = this.data.asset.price.ask;
    }

    // now we have a price, we can work out the qty

    this.data.order.potential.quantity = this.data.order.potential.value / this.data.order.potential.price.value;

    // FINAL
    // work out our final values

    // qty needs to be worked out based on the price
    // if the direction 'buy' we using the bid
    this.data.order.final.direction = this.form.direction;

    // are we above the minimum qty
    if (this.data.order.final.quantity.raw < this.data.asset.minQty) {
      this.data.order.calc.exceedsMinQty = true;
    } else {
      this.data.order.calc.exceedsMinQty = false;
    }

    // and sell, we use the ask
    if (this.data.order.final.direction.toLowerCase() === 'sell') {
      this.data.order.final.price.type = 'sell';
      this.data.order.final.price.value = this.data.asset.price.bid;
    } else {
      this.data.order.final.price.type = 'buy';
      this.data.order.final.price.value = this.data.asset.price.ask;
    }

    // allow for the min qty and exceeding any portfolio values (or not)
    // if it's below the minimum, then everything goes to zero
    if (!this.data.order.calc.exceedsMinQty) {

      this.data.order.final.value = 0;
      this.data.order.final.quantity.raw = 0;
      this.data.order.final.quantity.rounded = 0;
      this.data.order.final.orderSizePercentage = 0;

    } else {

      // if the validations don't pass, we need to restrict the order value to the remaining position
      // unless the user explcitly says to do otherwise
      if (this.data.order.calc.maxPortfolioValueExceededBy) {

        // if the user is overriding the settings we use the potential
        if (!this.data.order.calc.overrideLimits) {

          // use the remaining value
          this.data.order.final.value = this.data.existingPosition.remainingValue;
          this.data.order.final.orderSizePercentage = this.data.order.final.value / this.data.account.leverageBalance * 100;
          this.data.order.final.portfolio.value = this.data.existingPosition.valueInBase + this.data.order.final.value;
          this.data.order.final.portfolio.allocation = this.data.order.potential.portfolio.value / this.data.account.leverageBalance * 100;

        } else {

          // use the potential (without adjustment)
          this.data.order.final.value = this.data.order.default.valueWithConviction;
          this.data.order.final.orderSizePercentage = this.data.order.final.value / this.data.account.leverageBalance * 100;
          this.data.order.final.portfolio.value = this.data.existingPosition.valueInBase + this.data.order.final.value;
          this.data.order.final.portfolio.allocation = this.data.order.potential.portfolio.value / this.data.account.leverageBalance * 100;

        }

      } else {

        this.data.order.final.value = this.data.order.default.valueWithConviction;
        this.data.order.final.orderSizePercentage = this.data.order.final.value / this.data.account.leverageBalance * 100;
        this.data.order.final.portfolio.value = this.data.existingPosition.valueInBase + this.data.order.final.value;
        this.data.order.final.portfolio.allocation = this.data.order.potential.portfolio.value / this.data.account.leverageBalance * 100;

      }

      // now we have a price, we can work out the qty
      this.data.order.final.quantity.raw = this.data.order.final.value / this.data.order.final.price.value;

      // round the qty
      if (this.data.asset.fractional) {
        this.data.order.final.quantity.rounded = parseFloat(this.data.order.final.quantity.raw.toFixed(this.data.asset.decimals));
      } else {
        // if fraction isn't supported, then we need an int
        this.data.order.final.quantity.rounded = Math.floor(this.data.order.final.quantity.raw);
      }

      // then we need to deal with custom qty and value
      // if the validations all pass, then we can use our standard 


    }


  }

  refreshFormCalculation() {

    // recalc the account leveraged account balance
    this.accountBalanceLeveraged();
    this.defaultOrderCalcUsingtheAccountBalance();

  }

  expandCollapseOrderMenu(section: number) {

    if (this.orderSummaryMenu[section]) {
      this.orderSummaryMenu[section] = false;
    } else {
      this.orderSummaryMenu[section] = true;
    }
  }

  expandOrderSummary(action: boolean) {
    for (const i in this.orderSummaryMenu) {
      this.orderSummaryMenu[i] = action;
    }
  }

  getIgEpic = ({ igAssetInfo }: any) => {
    this.assetInfo = igAssetInfo;
    this.epic = igAssetInfo?.epic || null;
    this.form.ticker = this.epic;

    // we can use the above for these...
    this.data.asset.ticker = this.form.ticker;
    this.data.asset.price.ask = this.assetInfo?.offer || 0;
    this.data.asset.price.bid = this.assetInfo?.bid || 0;

    // these come from the more detailed request
    this.data.asset.minQty =
      this.assetInfo?.marketInfo?.dealingRules?.minDealSize?.value || 1;
    // there is a value on the asset object that is called 'step' or something like that
    // if that has decimals, then fractional is true
    this.data.asset.fractional =
      this.assetInfo?.marketInfo?.dealingRules?.minDealSize?.value?.toString()?.includes('.') ? true : false;

    // use the number of decimals from the min qty
    this.data.asset.decimals = Helpers.countDecimals(this.data.asset.minQty);

    this.requiredControl();
    this.cRef.detectChanges();
  };

  async getCurrentPositions() {
    try {

      this.isLoading = true;
      await this.decrypt();

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        const env: 'demo' | 'prod' = 'demo';
        const litActionCodeA = litActions.ig.checkCredentials(env);

        const listActionCodeParamsA = {
          credentials: this.credentials,
          form: {},
        };

        const litActionCallA = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode: litActionCodeA,
          listActionCodeParams: listActionCodeParamsA,
          nodes: 1,
          showLogs: true,
        });

        const responseA = litActionCallA?.response as any;

        const auth = {
          apiKey: this.credentials?.apiKey,
          cst: responseA?.clientSessionToken,
          securityToken: responseA?.activeAccountSessionToken,
        };

        const litActionCodeB = litActions.ig.getPositions(
          env,
          auth,
        );

        const litActionCallB = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode: litActionCodeB,
          listActionCodeParams: {},
          nodes: 1,
          showLogs: true,
        });

        const responseB = litActionCallB?.response as any;

        this.positions = responseB || [];

        // check to see if there are any assets other than the base currency of the account

        // reset our portfolio
        this.portfolio = [];

        // loop through the positions to get the total existing exposure
        for (const p in this.positions) {
          if (p) {

            let val = 0;
            if (this.positions[p].position.direction === 'SELL') {
              val = this.positions[p].market.bid * this.positions[p].position.contractSize;
            } else {
              val = this.positions[p].market.offer * this.positions[p].position.contractSize;
            }

            const pos = {
              ticker: this.positions[p].market.epic,
              size: this.positions[p].position.contractSize,
              direction: this.positions[p].position.direction,
              bid: this.positions[p].market.bid,
              offer: this.positions[p].market.offer,
              value: val,
            }
            this.portfolio.push(pos);
          }
        }

        this.cRef.detectChanges();
      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  getExistingPositionValue() {

    // loop through the portfolop and match any

  }

}

