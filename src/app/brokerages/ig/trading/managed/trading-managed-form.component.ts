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
    console.log('this.assetInfo', this.assetInfo);
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
        const expiry = '';
        const quantity = this.data.order.final.quantity.rounded;
        const direction = this.data.order.final.direction?.toUpperCase();

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

