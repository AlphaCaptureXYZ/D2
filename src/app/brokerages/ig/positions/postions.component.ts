import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { isNullOrUndefined, longShort } from 'src/app/helpers/helpers';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';

import * as litActions from 'src/app/scripts/lit-actions';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

type EnvType = 'demo' | 'prod';

@Component({
  selector: 'app-account-positions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss'],
})
export default class IGAccountPositionsComponent implements OnInit {
  credentials= {
    username: '',
    apiKey: '',
    password: '',
    environment: '',
    accountId: '',
  };
  allAccounts: any[];
  isLoading: boolean;
  isLoadingCredentials = false as boolean;
  isClosingPosition: boolean;
  broker = 'IG';
  accountReference = '';
  rawPositions: any[];
  aggregatePositions: any[];
  closeResponse: any;
  accountName = 'IG Group Account';

  showClosureConfirmation = false;
  closeEpic = '';
  closeExpiry = '';

  constructor(
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    private activatedRoute: ActivatedRoute,
    public cRef: ChangeDetectorRef
  ) {
    this.isLoading = false;
    this.isClosingPosition = false;
    this.allAccounts = [];
    this.rawPositions = [];
    this.aggregatePositions = [];
  }

  async ngOnInit() {
    
    this.accountReference = (this.activatedRoute.snapshot?.params as any)?.accountReference;

    this.isLoading = true;
    // get the credentials for a specific account
    await this.getCredentials();

    // decrypt our credentials
    // if we have a valid account
    if (this.allAccounts.length > 0 && this.accountReference.length > 0) {
      await this.decrypt(this.accountReference);
    }

    // and finally call to get our positions
    await this.igGetPositions();

    // aggregate positions
    // console.log('pre aggregate positioon');
    await this.calcAggregatePositions();

    this.isLoading = false;
  }

  async getCredentials() {
    this.isLoadingCredentials = true;
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({autoRedirect: true});
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
    this.allAccounts = this.allAccounts.filter(res => res.uuid === this.accountReference);
    this.accountName = this.allAccounts[0].accountName;
    // console.log('this.allAccounts', this.allAccounts);
    this.isLoadingCredentials = false;
  }

  async igGetPositions() {
    try {

      this.isLoading = true;

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.environment) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        // set from credentials
        const env = this.credentials.environment as EnvType;
        const litActionCodeA = litActions.ig.checkCredentials(env);

        const listActionCodeParamsA = {
          credentials: this.credentials,
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

        /* accounts */
        const litActionCodeB = litActions.ig.getAccounts(
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

        // const account: IAccount = responseB?.find((res: any) => res.accountId === this.credentials.accountId);

        const litActionCodeC = litActions.ig.getPositions(
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

        this.rawPositions = litActionCallC?.response as any;
        console.log('this.rawPositions', this.rawPositions);

        if (responseB?.errorCode) {
          alert(responseB?.errorCode);
        }

        this.cRef.detectChanges();
      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  async igCloseFullPosition(epic: string, expiry: string) {
    try {

      this.isClosingPosition = true;

      if (
        !isNullOrUndefined(this.credentials?.username) &&
        !isNullOrUndefined(this.credentials?.password) &&
        !isNullOrUndefined(this.credentials?.environment) &&
        !isNullOrUndefined(this.credentials?.apiKey)
      ) {

        // set from credentials
        const env = this.credentials.environment as EnvType;
        const litActionCodeA = litActions.ig.checkCredentials(env);

        const listActionCodeParamsA = {
          credentials: this.credentials,
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

        /* accounts */
        const litActionCodeB = litActions.ig.getAccounts(
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

        // const account: IAccount = responseB?.find((res: any) => res.accountId === this.credentials.accountId);
        const orderPayload = {
          epic,
          expiry,
        }

        const litActionCodeC = litActions.ig.closePosition(
          env,
          orderPayload,
          auth,
        );

        const litActionCallC = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode: litActionCodeC,
          listActionCodeParams: {},
          nodes: 1,
          showLogs: true,
        });

        this.closeResponse = litActionCallC?.response as any;
        console.log('this.closeReponse', this.closeResponse);

        if (responseB?.errorCode) {
          alert(responseB?.errorCode);
        }

        this.cRef.detectChanges();
      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  async decrypt(uuid: string) {
    try {
      if (!isNullOrUndefined(uuid)) {

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
        console.log('decryptedFile', decryptedFile);

        if (!isNullOrUndefined(decryptedFile)) {
          const credentialObj = JSON.parse(decryptedFile);
          this.credentials.username = credentialObj?.username || '';
          this.credentials.apiKey = credentialObj.apiKey;
          this.credentials.password = credentialObj.password;
          this.credentials.environment = credentialObj.environment;
          this.credentials.accountId = credentialObj.accountId;  
        }
      }
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to these credentials`);
    }
  }

  async actionClosePositionPre(position: any) {
    this.showClosureConfirmation = true;
    this.closeEpic = position.epic;
    this.closeExpiry = position.expiry;  
  }
  async actionClosePositionCancel() {
    this.showClosureConfirmation = false;
    this.closeEpic = '';
    this.closeExpiry = '';  
  }

  async actionClosePosition(position: any) {
    this.isClosingPosition = true;

    this.closeEpic = position.epic;
    this.closeExpiry = position.expiry;  

    // call the Lit Action to process
    const closeResponse = await this.igCloseFullPosition(position.epic, position.expiry);

    console.log('closeResponse', closeResponse);

    // refresh the positions
    await this.igGetPositions();

    // reset
    this.closeEpic = '';
    this.closeExpiry = '';  
    this.showClosureConfirmation = false;
    this.isClosingPosition = false;
  }

  async calcAggregatePositions() {

  //   // loop through each 
  //   // we only really need the asset, ticker, qty
  //   this.rawPositions = [{
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/08/09 23:20:45:000",
  //         "createdDateUTC": "2023-08-09T22:20:45",
  //         "dealId": "DIAAAALTGQR4WBB",
  //         "dealReference": "2XP621H7E66ARX",
  //         "size": 0.5,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 6299.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Block Inc (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SG.D.SQUS.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 5977.0,
  //         "low": 5830.0,
  //         "percentageChange": 0.32,
  //         "netChange": 19.0,
  //         "bid": 5882.0,
  //         "offer": 5890.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/08/10 14:45:02:000",
  //         "createdDateUTC": "2023-08-10T13:45:02",
  //         "dealId": "DIAAAALTK7M6TAY",
  //         "dealReference": "05ad75175979411daef9643a027479",
  //         "size": 0.08,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 10014.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Alibaba Group Holding Ltd (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SA.D.BABA.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 8375.0,
  //         "low": 7810.0,
  //         "percentageChange": -0.03,
  //         "netChange": -2.0,
  //         "bid": 7888.0,
  //         "offer": 7896.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/08/15 14:54:08:000",
  //         "createdDateUTC": "2023-08-15T13:54:08",
  //         "dealId": "DIAAAALT6FEM5BC",
  //         "dealReference": "2XP621H7WQJQN1",
  //         "size": 0.25,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 5944.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Block Inc (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SG.D.SQUS.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 5977.0,
  //         "low": 5830.0,
  //         "percentageChange": 0.32,
  //         "netChange": 19.0,
  //         "bid": 5882.0,
  //         "offer": 5890.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/09/14 14:27:33:000",
  //         "createdDateUTC": "2023-09-14T13:27:33",
  //         "dealId": "DIAAAALXYBWQDBC",
  //         "dealReference": "2XP621HA9Y00YF",
  //         "size": 0.25,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 5459.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Block Inc (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SG.D.SQUS.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 5977.0,
  //         "low": 5830.0,
  //         "percentageChange": 0.32,
  //         "netChange": 19.0,
  //         "bid": 5882.0,
  //         "offer": 5890.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/09/27 18:45:30:000",
  //         "createdDateUTC": "2023-09-27T17:45:30",
  //         "dealId": "DIAAAALZMRD36AQ",
  //         "dealReference": "2XP621HBBVWBP4",
  //         "size": 0.08,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 8563.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Alibaba Group Holding Ltd (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SA.D.BABA.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 8375.0,
  //         "low": 7810.0,
  //         "percentageChange": -0.03,
  //         "netChange": -2.0,
  //         "bid": 7888.0,
  //         "offer": 7896.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/10/12 21:49:47:000",
  //         "createdDateUTC": "2023-10-12T20:49:47",
  //         "dealId": "DIAAAAL3T2RGRAZ",
  //         "dealReference": "2XP621HCJTE0X5",
  //         "size": 0.08,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 8453.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Alibaba Group Holding Ltd (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SA.D.BABA.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 8375.0,
  //         "low": 7810.0,
  //         "percentageChange": -0.03,
  //         "netChange": -2.0,
  //         "bid": 7888.0,
  //         "offer": 7896.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/10/18 17:50:49:000",
  //         "createdDateUTC": "2023-10-18T16:50:49",
  //         "dealId": "DIAAAAL4KD3B5AV",
  //         "dealReference": "2XP621HD1V3SGA",
  //         "size": 2.0,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 7569.9,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "FTSE 100",
  //         "expiry": "DFB",
  //         "epic": "IX.D.FTSE.DAILY.IP",
  //         "instrumentType": "INDICES",
  //         "lotSize": 1.0,
  //         "high": 7495.7,
  //         "low": 7451.8,
  //         "percentageChange": 0.14,
  //         "netChange": 10.3,
  //         "bid": 7467.6,
  //         "offer": 7468.6,
  //         "updateTime": "09:34:28",
  //         "updateTimeUTC": "09:34:28",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": true,
  //         "marketStatus": "TRADEABLE",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/10/19 19:04:58:000",
  //         "createdDateUTC": "2023-10-19T18:04:58",
  //         "dealId": "DIAAAAL4SMQJ2AN",
  //         "dealReference": "2XP621HD4HR8DD",
  //         "size": 2.0,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 7499.8,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "FTSE 100",
  //         "expiry": "DFB",
  //         "epic": "IX.D.FTSE.DAILY.IP",
  //         "instrumentType": "INDICES",
  //         "lotSize": 1.0,
  //         "high": 7495.7,
  //         "low": 7451.8,
  //         "percentageChange": 0.14,
  //         "netChange": 10.3,
  //         "bid": 7467.6,
  //         "offer": 7468.6,
  //         "updateTime": "09:34:28",
  //         "updateTimeUTC": "09:34:28",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": true,
  //         "marketStatus": "TRADEABLE",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/10/20 11:28:20:000",
  //         "createdDateUTC": "2023-10-20T10:28:20",
  //         "dealId": "DIAAAAL4WDTYBBC",
  //         "dealReference": "2XP621HD6A1T8J",
  //         "size": 1.0,
  //         "direction": "BUY",
  //         "limitLevel": null,
  //         "level": 7431.9,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "FTSE 100",
  //         "expiry": "DFB",
  //         "epic": "IX.D.FTSE.DAILY.IP",
  //         "instrumentType": "INDICES",
  //         "lotSize": 1.0,
  //         "high": 7495.7,
  //         "low": 7451.8,
  //         "percentageChange": 0.14,
  //         "netChange": 10.3,
  //         "bid": 7467.6,
  //         "offer": 7468.6,
  //         "updateTime": "09:34:28",
  //         "updateTimeUTC": "09:34:28",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": true,
  //         "marketStatus": "TRADEABLE",
  //         "scalingFactor": 1
  //     }
  // }, {
  //     "position": {
  //         "contractSize": 1.0,
  //         "createdDate": "2023/11/14 20:35:01:000",
  //         "createdDateUTC": "2023-11-14T20:35:01",
  //         "dealId": "DIAAAAL77AZLNAL",
  //         "dealReference": "2XP621HF7RP3TB2",
  //         "size": 1.0,
  //         "direction": "SELL",
  //         "limitLevel": null,
  //         "level": 5522.0,
  //         "currency": "GBP",
  //         "controlledRisk": false,
  //         "stopLevel": null,
  //         "trailingStep": null,
  //         "trailingStopDistance": null,
  //         "limitedRiskPremium": null
  //     },
  //     "market": {
  //         "instrumentName": "Block Inc (All Sessions)",
  //         "expiry": "DFB",
  //         "epic": "SG.D.SQUS.DAILY.IP",
  //         "instrumentType": "SHARES",
  //         "lotSize": 1.0,
  //         "high": 5977.0,
  //         "low": 5830.0,
  //         "percentageChange": 0.32,
  //         "netChange": 19.0,
  //         "bid": 5882.0,
  //         "offer": 5890.0,
  //         "updateTime": "01:00:00",
  //         "updateTimeUTC": "01:00:00",
  //         "delayTime": 0,
  //         "streamingPricesAvailable": false,
  //         "marketStatus": "EDITS_ONLY",
  //         "scalingFactor": 1
  //     }
  // }];

      // console.log('pre aggregate positioon', this.aggregatePositions);
      this.aggregatePositions = [];
      for (const p in this.rawPositions) {
        if (p) {
          let existing = false;
          for (const ag in this.aggregatePositions) {
            if (ag) {
              if (this.rawPositions[p].market.epic === this.aggregatePositions[ag].epic && 
                this.rawPositions[p].market.expiry === this.aggregatePositions[ag].expiry) {

                const rowSize = this.rawPositions[p].position.dealSize || this.rawPositions[p].position.size || 0;

                if (this.rawPositions[p].position.direction === 'SELL') {
                  this.aggregatePositions[ag].size = this.aggregatePositions[ag].size - rowSize;
                } else if (this.rawPositions[p].position.direction === 'BUY') {
                  this.aggregatePositions[ag].size = this.aggregatePositions[ag].size + rowSize;
                }  
                this.aggregatePositions[ag].direction = longShort(this.aggregatePositions[ag].size);
                existing = true;
                break;  
              }
            }
          }

          if (!existing) {
              // the size field is different depending on whether it comes via Lit or direct
              const rowSize = this.rawPositions[p].position.dealSize || this.rawPositions[p].position.size || 0;

              const newPosition = {
                name: this.rawPositions[p].market.instrumentName,
                epic: this.rawPositions[p].market.epic,
                expiry: this.rawPositions[p].market.expiry,
                size: rowSize,
                direction: '',
              }  
              if (this.rawPositions[p].position.direction === 'SELL') {
                newPosition.size = 0 - rowSize;
              } else if (this.rawPositions[p].position.direction === 'BUY') {
                newPosition.size = rowSize;
              }
              newPosition.direction = longShort(newPosition.size);
              this.aggregatePositions.push(newPosition);      
          }                
        }
      }
      // console.log('this.aggregatePositions', this.aggregatePositions);

  }
}
