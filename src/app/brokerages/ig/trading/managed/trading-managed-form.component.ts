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
import { IAccount } from '../../_shared/account.i';

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
  viewPortfolio = 'net';

  accountSelected = null;

  epic: string;

  account: IAccount = null as any;
  assetInfo: IAssetInfo = null as any;
  positions: IPositionInfo[];

  isLoading = false as boolean;
  isLoadingCredentials = false as boolean;

  accountId: string = null as any;

  currencyInfo = {
    GBP: {
      symbol: '£',
    },
    USD: {
      symbol: '$',
    },
    EUR: {
      symbol: '€',
    },
  }

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
    false, // portfolio summary
  ]

  data = {
    asset: {
      ticker: '',
      name: '',
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
    portfolio: {
      net: [
        {
          ticker: '',
          size: 0,
          direction: '',
          bid: 0,
          offer: 0,
          value: 0,
        }
      ],
      raw: [
        {
          ticker: '',
          size: 0,
          direction: '',
          bid: 0,
          offer: 0,
          value: 0,
        }
      ]
    },
    portfolioStats: {
      long: 0,
      short: 0,
      net: 0,
      remaining: 0,
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
        maxPortfolioExposureExceeded: false,
        maxPortfolioExposureExceededBy: 0,
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

  }

  async ngOnInit() {
    this.getCredentials();
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
            ticker: data.ticker,
            direction: 'buy',
            // quantity: 1,
          };
          break;
      }
    });
  }


  // Data init

  async getCredentials() {
    this.isLoadingCredentials = true;

    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
      autoRedirect: true,
    });

    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
    this.allAccounts = this.allAccounts.filter(res => res.provider === this.broker);
    this.isLoadingCredentials = false;
  }

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
        }
      }
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to this credential`);
    }
  }

  // Calculation
  calcExistingPosition() {

    // filter out our net portfolio
    const netPositions = this.data.portfolio.net;
    for (const p in netPositions) {
      if (p) {
        if (netPositions[p].ticker === this.data.asset.ticker) {
          this.data.existingPosition.valueInBase = netPositions[p].value;
          this.data.existingPosition.currentPortfolioAllocation = this.data.existingPosition.valueInBase / this.data.account.leverageBalance * 100;
        }
      }
    }
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

    // now we check to see if our maximum (total/net) portfolio exposure would be exceeded
    // this.data.portfolio.net
    // this.data.account.leverageBalance
    // maxPortfolioExposureExceeded
    // this.data.order.default.valueWithConviction
    if (this.data.order.default.valueWithConviction > this.data.portfolioStats.remaining) {
      this.data.order.calc.maxPortfolioExposureExceeded = true;
      this.data.order.calc.maxPortfolioExposureExceededBy = this.data.order.default.valueWithConviction - this.data.portfolioStats.remaining;
    }

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

      let howBigAPositionCanWeHave = this.data.existingPosition.remainingValue;

      // if our total portfolio exposure is exceeded, then this is ou
      if (this.data.order.calc.maxPortfolioExposureExceeded) {

        // if this is greater than the limit we can have for a single positionm 
        // then we need to reduce our position
        if (this.data.order.calc.maxPortfolioExposureExceededBy > howBigAPositionCanWeHave) {
          howBigAPositionCanWeHave = howBigAPositionCanWeHave - this.data.order.calc.maxPortfolioExposureExceededBy;
        }
      }

      // if the validations don't pass, we need to restrict the order value to the remaining position
      // unless the user explcitly says to do otherwise
      if (this.data.order.calc.maxPortfolioValueExceededBy) {

        // if the user is overriding the settings we use the potential
        if (!this.data.order.calc.overrideLimits) {

          // use the remaining value
          this.data.order.final.value = howBigAPositionCanWeHave;
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
    this.calcAccountBalanceAndPositions();
    this.calcExistingPosition();
    this.defaultOrderCalcUsingtheAccountBalance();

  }

  calcAccountBalanceAndPositions() {
    const currency: any = this.account.currency;
    const accountCurrencySymbol = (this.currencyInfo as any)[currency || 'GBP']?.symbol;

    // check to see if there are any assets other than the base currency of the account
    const diffAssets = this.positions?.filter((res) => res.position.currency !== currency) || [];

    // console.log('diffAssets', diffAssets);

    // good example to do, the demo account have 2 existing positions in USD and the other in GBP
    if (diffAssets.length > 0) {
      // pending to add the conversion and logic, etc
    }

    this.data.account.currencySymbol = accountCurrencySymbol;
    this.data.account.leverageBalance = this.data.account.balance * this.data.account.leverage;

    // reset our portfolio
    this.data.portfolio.raw = [];
    this.data.portfolio.net = [];
    // and reset our portfolio stats
    this.data.portfolioStats.long = 0;
    this.data.portfolioStats.short = 0;
    this.data.portfolioStats.net = 0;

    // loop through the positions to get the total existing exposure
    for (const p in this.positions) {
      if (p) {

        let val = 0;
        let direction = 'Neutral';
        if (this.positions[p].position.direction === 'SELL') {
          val = this.positions[p].market.bid * this.positions[p].position.contractSize;
          direction = 'Short';
          this.data.portfolioStats.short = this.data.portfolioStats.short + val;
        } else {
          val = this.positions[p].market.offer * this.positions[p].position.contractSize;
          direction = 'Long';
          this.data.portfolioStats.long = this.data.portfolioStats.long + val;
        }
        this.data.portfolioStats.net = this.data.portfolioStats.long - this.data.portfolioStats.short;


        // always add the raw
        const rawPosition = {
          ticker: this.positions[p].market.epic,
          size: this.positions[p].position.contractSize,
          direction,
          bid: this.positions[p].market.bid,
          offer: this.positions[p].market.offer,
          value: val,
        }
        this.data.portfolio.raw.push(rawPosition);

        // create our net 
        const existing = this.data.portfolio.net.filter(res => res.ticker === this.positions[p].market.epic) || [];
        if (existing.length > 0) {
          // console.log('existing position for ', this.positions[p].market.epic);

          this.data.portfolio.net.filter(res => {
            // console.log('check the existing position for ', this.positions[p].market.epic);
            if (res.ticker === this.positions[p].market.epic) {

              // console.log('update the existing position for ', this.positions[p].market.epic);
              if (rawPosition.direction === 'SELL' || rawPosition.direction === 'Short') {
                res.size = res.size - rawPosition.size;
                res.value = res.value - rawPosition.value;
              } else if (rawPosition.direction === 'BUY' || rawPosition.direction === 'Long') {
                res.size = res.size + rawPosition.size;
                res.value = res.value + rawPosition.value;
              }

              // set the overall direction
              if (res.size > 0) {
                res.direction = 'Long';
              } else if (res.size < 0) {
                res.direction = 'Short';
              } else {
                res.direction = 'Neutral';
              }
              // console.log('updated res', res);
            }
            return res;
          })
        } else {

          // console.log('add the new existing position for ', this.positions[p].market.epic);
          // console.log('add the new existing position for ', rawPosition);
          this.data.portfolio.net.push(rawPosition);
        }

      }
    }
    // console.log('this.data.portfolio', this.data.portfolio);

    const accountBalance = this.account?.balance?.balance || 0;

    this.data.account.balance = accountBalance;
    this.data.account.leverageBalance = accountBalance * this.data.account.leverage;

    // update our total remaining portfolo 'space'
    this.data.portfolioStats.remaining = this.data.account.leverageBalance - this.data.portfolioStats.net;

    this.cRef.detectChanges();
  }

  // IG Group Calls

  async getIGAccountBalanceAndPositions() {
    try {

      this.isLoading = true;
      await this.decrypt();

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        this.accountId = this.credentials.accountId;

        const env: 'demo' | 'prod' = 'demo';
        const litActionCodeA = litActions.ig.checkCredentials(env);

        /* credentials */
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

        /* positions */
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

        /* accounts */
        const litActionCodeC = litActions.ig.getAccounts(
          env,
          auth,
        );

        const litActionCallC = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode: litActionCodeC,
          listActionCodeParams: {},
          nodes: 1,
          showLogs: true,
        });

        const responseC = litActionCallC?.response as any;

        this.account = responseC?.find((res: any) => res.accountId === this.accountId);

        // just to test with old credentials without this value (accountId)
        // pending to delete
        if (isNullOrUndefined(this.account)) {
          this.account = responseC?.find((res: any) => res.preferred);
        }

        this.positions = responseB || [];

      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  refreshBrokerageData() {
    this.refreshLoading = true;
    this.callEvents();
    this.refreshLoading = false;
  }

  async getIgEpic({ igAssetInfo }: any) {
    this.assetInfo = igAssetInfo;
    // console.log('this.assetInfo', this.assetInfo);
    this.epic = igAssetInfo?.epic || null;
    this.form.ticker = this.epic;

    // we can use the above for these...
    this.data.asset.ticker = this.form.ticker;
    this.data.asset.name = this.assetInfo.instrumentName;
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

    await this.requiredControl();
    this.cRef.detectChanges();
  }

  submit = async () => {
    await this.igPlaceOrder();
  };

  async igPlaceOrder() {
    try {

      this.isLoading = true;

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        const env: 'demo' | 'prod' = this.form.environment as any;
        const litActionCodeA = litActions.ig.checkCredentials(env);

        const listActionCodeParamsA = {
          credentials: this.credentials,
          form: this.form,
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

        const epic = this.data.asset.ticker;
        const quantity = this.data.order.final.quantity.rounded;
        const direction = this.data.order.final.direction?.toUpperCase();

        const litActionCodeB = litActions.ig.placeOrder(
          env,
          {
            direction,
            epic,
            quantity,
            currencyCode: this.account?.currency,
          },
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

        const orderId = responseB?.dealId || null;

        if (responseB?.errorCode) {
          alert(responseB?.errorCode);
        }

        if (orderId) {
          alert(`Order placed successfully. OrderID: ${orderId}`);
        }

        this.cRef.detectChanges();

      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  // Form related

  changePortfolioView() {
    if (this.viewPortfolio === 'net') {
      this.viewPortfolio = 'raw';
    } else {
      this.viewPortfolio = 'net';
    }
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

  async requiredControl(valueChanged?: string) {

    const credentialNftUuid = this.form.credentialNftUuid;
    const account = this.allAccounts?.find(res => res.uuid === credentialNftUuid);

    if (account) {
      this.accountSelected = account;
      this.form.broker = account.provider;
      this.form.environment = account.environment;
      this.cRef.detectChanges();
    }

    if (valueChanged === 'credential') {
      await this.getIGAccountBalanceAndPositions();
      await this.calcAccountBalanceAndPositions();
      await this.calcExistingPosition();
      await this.defaultOrderCalcUsingtheAccountBalance();
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
  }

}

