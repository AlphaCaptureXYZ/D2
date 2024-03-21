/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { IAssetInfo } from '../../_interfaces/asset-info.i';
import { IPositionInfo } from '../../_interfaces/position.i';
import { IAccount } from '../../_interfaces/account.i';

import {
  DirectionType,
  IOrderCalc,
  OrderCalc,
} from 'src/app/brokerages/shared/order-calc';

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
  expiry: string;

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

  data: IOrderCalc = OrderCalc.constants.defaultOrderCalc;

  constructor(
    private router: Router,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    private eventService: EventService,
    public cRef: ChangeDetectorRef,
  ) {
    this.epic = null as any;
    this.expiry = null as any;
    this.allAccounts = [];
    this.positions = [];

    this.form = {
      credentialNftUuid: '',
      broker: '',
      environment: 'prod',
      ticker: '',
      direction: 'buy',
      conviction: 100,
      orderLimits: false,
      maxLeverage: 1,
      defaultOrderSize: 2,
      maxSizePortofolio: 5,
    };

  }

  async ngOnInit() {
    this.localStoreSettings();

    await this.getCredentials();
    await this.callEvents();
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

  localStoreSettings() {
    
    const convictionStore = Number(localStorage.getItem('ig-conviction'));
    if (convictionStore) {
      this.form.conviction = convictionStore;
      this.requiredControl('conviction');
    }

    const orderLimitStore = localStorage.getItem('ig-order-limits');
    if (orderLimitStore !== '') {
      // our value is a string
      if (orderLimitStore === 'false') {
        this.form.orderLimits = false;
      } else {
        this.form.orderLimits = true;
      }
      this.requiredControl('orderLimit');
    }

    const maxLeverageStore = Number(localStorage.getItem('ig-max-leverage'));
    if (maxLeverageStore > 0) {
      this.form.maxLeverage = maxLeverageStore;
      this.requiredControl('leverage');
    }

    const orderSizeStore = Number(localStorage.getItem('ig-order-size'));
    if (orderSizeStore > 0) {
      this.form.defaultOrderSize = orderSizeStore;
      this.requiredControl('orderSize');
    }
    const portfolioSizeStore = Number(localStorage.getItem('ig-max-portfolio-size'));
    if (portfolioSizeStore > 0) {
      this.form.maxSizePortofolio = portfolioSizeStore;
      this.requiredControl('maxPositionSize');
    }
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

  // IG Group Calls

  async getIGAccountBalanceAndPositions() {
    try {

      // console.log('in getIGAccountBalanceAndPositions');
      this.isLoading = true;
      await this.decrypt();

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        this.accountId = this.credentials.accountId;
        // console.log('this.credentials', this.credentials);

        const env = this.credentials.environment;
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
        // console.log('litActionCodeB', litActionCodeB);

        const litActionCallB = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode: litActionCodeB,
          listActionCodeParams: {},
          nodes: 1,
          showLogs: true,
        });
        // console.log('litActionCallB?.response', litActionCallB);
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
    this.expiry = igAssetInfo?.expiry || null;
    this.form.ticker = this.epic;

    // we can use the above for these...
    this.data.asset.ticker = this.form.ticker;
    // console.log('this.data', this.data);
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
        // expiry is very IG specific so we leave it out of the main obj
        const expiry = this.expiry;
        const quantity = this.data.order.final.order.quantity.rounded;
        const direction = this.data.order.final.order.direction?.toUpperCase();

        const litActionCodeB = litActions.ig.placeOrder(
          env,
          {
            direction,
            epic,
            quantity,
            currencyCode: this.account?.currency,
            expiry,
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
    // console.log('valueChanged in requiredControl', valueChanged);

    const credentialNftUuid = this.form.credentialNftUuid;
    const account = this.allAccounts?.find(res => res.uuid === credentialNftUuid);

    if (account) {
      this.accountSelected = account;
      this.form.broker = account.provider;
      this.form.environment = account.environment;
      this.cRef.detectChanges();
    }

    switch (valueChanged) {
      case 'credential': {
        await this.getIGAccountBalanceAndPositions();
        break;
      }
      case 'orderSize': {
        if (Number(this.form.defaultOrderSize) > 0) {
          this.data.order.default.portfolioAllocation = this.form.defaultOrderSize;
          localStorage.setItem('ig-order-size', this.form.defaultOrderSize.toString());  
          }
        break;
      }
      case 'conviction': {
        if (Number(this.form.conviction) > 0) {
          this.data.order.settings.conviction = this.form.conviction;
          localStorage.setItem('ig-conviction', this.form.conviction.toString());
          }
        break;
      }
      case 'leverage': {
        if (Number(this.form.maxLeverage) > 0) {
          this.data.account.leverage = this.form.maxLeverage;
          localStorage.setItem('ig-max-leverage', this.form.maxLeverage.toString());
          }
        break;
      }
      case 'maxPositionSize': {
        if (Number(this.form.maxSizePortofolio) > 0) {
          this.data.order.settings.maxPortfolioSize = this.form.maxSizePortofolio;
          localStorage.setItem('ig-max-portfolio-size', this.form.maxSizePortofolio.toString());
          }
        break;
      }
      case 'orderLimit': {
        this.data.order.calc.overrideLimits = this.form.orderLimits;
        localStorage.setItem('ig-order-limits', this.form.orderLimits.toString());
        break;
      }
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


  // Calculation
  async refreshFormCalculation() {
    // recalc the account leveraged account balance
    await this.calcAccountBalanceAndPositions();
    this.calcExistingPosition();
    this.defaultOrderCalcUsingtheAccountBalance();
  }

  async calcAccountBalanceAndPositions() {
    // console.log('this.account', this.account);
    if (this.account) {

      const currency: any = this.account?.currency;
      const accountCurrencySymbol = (this.currencyInfo as any)[currency || 'GBP']?.symbol;
  
      // check to see if there are any assets other than the base currency of the account
      const diffAssets = this.positions?.filter((res) => res.position.currency !== currency) || [];
      // console.log('diffAssets', diffAssets);
      // good example to do, the demo account have 2 existing positions in USD and the other in GBP
      if (diffAssets.length > 0) {
        // pending to add the conversion and logic, etc
      }
  
      // this needs to be our cash balance i.e. total cash +/- the current P&L
      // console.log('account balances', this.account.balance);
      const accountBalance = (this.account?.balance?.balance + this.account?.balance?.profitLoss) || 0;

      this.data.account.currencySymbol = accountCurrencySymbol;
      this.data.account.leverageBalance = accountBalance * this.data.account.leverage;
    
      this.data.account.balance = accountBalance;
      this.data.account.leverageBalance = accountBalance * this.data.account.leverage;
  
      // update our raw positions
      this.formatRawPositions();
      this.formatNetPositions();
      this.portfolioStats();
  
      this.cRef.detectChanges();      
    }
  }

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
    OrderCalc.functions.defaultOrderCalcUsingtheAccountBalance(
      this.data,
      {
        orderLimits: this.form.orderLimits,
        defaultOrderSize: this.form.defaultOrderSize,
        conviction: this.form.conviction,
        maxSizePortofolio: this.form.maxSizePortofolio,
        direction: this.form.direction as DirectionType,
      }
    );
  }

  formatRawPositions() {
    // reset our portfolio
    this.data.portfolio.raw.length = 0;

    const rawPositions = [];

    // loop through the positions to get the total existing exposure
    for (const p in this.positions) {
      if (p) {

        let val = 0;
        let direction = 'Neutral';
        if (this.positions[p].position.direction === 'SELL') {
          val = this.positions[p].market.bid * this.positions[p].position.dealSize;
          direction = 'Short';
          this.data.portfolioStats.short = this.data.portfolioStats.short + val;
        } else if (this.positions[p].position.direction === 'BUY') {
          val = this.positions[p].market.offer * this.positions[p].position.dealSize;
          direction = 'Long';
          this.data.portfolioStats.long = this.data.portfolioStats.long + val;
        }
        this.data.portfolioStats.net = this.data.portfolioStats.long - this.data.portfolioStats.short;

        // always add the raw
        const rawPosition = {
          deal: this.positions[p].position.dealId,
          ticker: this.positions[p].market.epic,
          size: this.positions[p].position.dealSize,
          direction,
          bid: this.positions[p].market.bid,
          offer: this.positions[p].market.offer,
          value: val,
        }
        rawPositions.push(rawPosition);
      }
    }

    this.data.portfolio.raw = rawPositions;

    // console.log('this.data.portfolio', this.data.portfolio);
    // console.log('in raw positions', this.data.portfolio.raw);

  }

  formatNetPositions() {
    this.data.portfolio.net.length = 0;
    const rawPositions = this.data.portfolio.raw;

    for (const p in rawPositions) {
      if (p) {

        const currentTicker = rawPositions[p].ticker;

        let inNet = false;
        for (const n in this.data.portfolio.net) {
          if (n) {

            if (this.data.portfolio.net[n].ticker === currentTicker) {

              inNet = true;

              if (rawPositions[p].direction === 'SELL' || rawPositions[p].direction === 'Short') {
                this.data.portfolio.net[n].size = this.data.portfolio.net[n].size - rawPositions[p].size;
                this.data.portfolio.net[n].value = this.data.portfolio.net[n].value - rawPositions[p].value;
              } else if (rawPositions[p].direction === 'BUY' || rawPositions[p].direction === 'Long') {
                this.data.portfolio.net[n].size = this.data.portfolio.net[n].size + rawPositions[p].size;
                this.data.portfolio.net[n].value = this.data.portfolio.net[n].value + rawPositions[p].value;
              }

              // set the overall direction
              if (this.data.portfolio.net[n].size > 0) {
                this.data.portfolio.net[n].direction = 'Long';
              } else if (this.data.portfolio.net[n].size < 0) {
                this.data.portfolio.net[n].direction = 'Short';
              } else {
                this.data.portfolio.net[n].direction = 'Neutral';
              }

            }
          }
        }

        if (!inNet) {
          const netPosition = {
            ticker: rawPositions[p].ticker,
            size: rawPositions[p].size,
            direction: rawPositions[p].direction,
            bid: rawPositions[p].bid,
            offer: rawPositions[p].offer,
            value: rawPositions[p].value,
          }
          this.data.portfolio.net.push(netPosition);
        }
    
      }
    }

    // console.log('in net positions', this.data.portfolio.net);

  }
  
  portfolioStats() {
    // and reset our portfolio stats
    this.data.portfolioStats.long = 0;
    this.data.portfolioStats.short = 0;
    this.data.portfolioStats.net = 0;

    for (const m in this.data.portfolio.net) {
      if (m) {
        if (this.data.portfolio.net[m].direction === 'Long') {
          this.data.portfolioStats.long = this.data.portfolioStats.long + Math.abs(this.data.portfolio.net[m].value);
        } else if (this.data.portfolio.net[m].direction === 'Short') {
          this.data.portfolioStats.short = this.data.portfolioStats.short + Math.abs(this.data.portfolio.net[m].value);
        }
      }
    }

    // net positions
    this.data.portfolioStats.net = this.data.portfolioStats.long - Math.abs(this.data.portfolioStats.short);

    // update our total remaining portfolo 'space'
    this.data.portfolioStats.remaining = this.data.account.leverageBalance - Math.abs(this.data.portfolioStats.net);
    // console.log('in portfolioStats', this.data.portfolioStats);
  }

}
