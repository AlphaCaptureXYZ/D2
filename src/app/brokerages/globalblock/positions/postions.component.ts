import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { isNullOrUndefined } from 'src/app/helpers/helpers';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';

import * as litActions from 'src/app/scripts/lit-actions';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

type EnvType = 'demo' | 'prod';

@Component({
  selector: 'app-account-globalblock-positions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss'],
})
export default class GlobalBlockAccountPositionsComponent implements OnInit {
  credentials= {
    name: '',
    publicKey: '',
    secretKey: '',
    environment: '',
  };
  allAccounts: any[];

  isLoading: boolean;
  isLoadingCredentials = false as boolean;

  isClosingPosition: boolean;
  broker = 'GlobalBlock';
  accountReference = '';

  rawPositions: any[];
  positions: any[];

  closeResponse: any;
  accountName = 'Trade';
  productType = 'TRADE';

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
    this.positions = [];
    this.rawPositions = [];
  }

  async ngOnInit() {
    
    this.accountReference = (this.activatedRoute.snapshot?.params as any)?.accountReference;

    this.isLoading = true;
    // get the credentials for a specific account
    await this.getCredentials();

    // decrypt our credentials
    // if we have a valid account
    await this.decrypt(this.accountReference);

    // and finally call to get our positions
    await this.getPositions();

    this.isLoading = false;
  }

  async getCredentials() {
    this.isLoadingCredentials = true;
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({autoRedirect: true});
    // console.log('pkpWalletAddress', pkpWalletAddress);
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
    this.allAccounts = this.allAccounts.filter(res => res.uuid === this.accountReference);
    this.accountName = this.allAccounts[0].accountName;
    // console.log('this.allAccounts[0]', this.allAccounts[0]); 
    // console.log('this.accountName', this.accountName);
    this.credentials.name = this.allAccounts[0].accountName || '';
    this.credentials.environment = this.allAccounts[0].environment || '';

    this.isLoadingCredentials = false;
  }

  async getPositions() {
    try {

      this.isLoading = true;

      if (
        !isNullOrUndefined(this.credentials?.name) &&
        !isNullOrUndefined(this.credentials?.publicKey) &&
        !isNullOrUndefined(this.credentials?.secretKey) &&
        !isNullOrUndefined(this.credentials?.environment)
      ) {


        // const env: EnvType = this.credentials.environment as string;
        const env = 'prod';

        const auth = {
            publicKey: this.credentials.publicKey,
            secretKey: this.credentials.secretKey,
        };
        const litActionCode = await litActions.globalblock.getPositions(env, auth);
        // console.log('litActionCode', litActionCode);
  
        const listActionCodeParamsA = {
          credentials: {
            name: this.credentials.name,
            publicKey: this.credentials.publicKey,
            secretKey: this.credentials.secretKey,
            environment: this.credentials.environment,
          },
        };
        // console.log('listActionCodeParamsA', listActionCodeParamsA);
  
        const litActionCallA = await litClient.runLitAction({
          chain: await this.nftCredentialService.getChain(),
          litActionCode,
          listActionCodeParams: listActionCodeParamsA,
          nodes: 1,
          showLogs: true,
        });
        // console.log('litActionCallA', litActionCallA);
  
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.rawPositions = litActionCallA?.response as any;

        this.positions = this.rawPositions.filter(res => res.product === this.productType);

      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  // async igCloseFullPosition(epic: string, expiry: string) {
  //   try {

  //     this.isClosingPosition = true;

  //     if (
  //       !isNullOrUndefined(this.credentials?.username) &&
  //       !isNullOrUndefined(this.credentials?.password) &&
  //       !isNullOrUndefined(this.credentials?.environment) &&
  //       !isNullOrUndefined(this.credentials?.apiKey)
  //     ) {

  //       // set from credentials
  //       const env = this.credentials.environment as EnvType;
  //       const litActionCodeA = litActions.ig.checkCredentials(env);

  //       const listActionCodeParamsA = {
  //         credentials: this.credentials,
  //       };

  //       const litActionCallA = await litClient.runLitAction({
  //         chain: await this.nftCredentialService.getChain(),
  //         litActionCode: litActionCodeA,
  //         listActionCodeParams: listActionCodeParamsA,
  //         nodes: 1,
  //         showLogs: true,
  //       });

  //       const responseA = litActionCallA?.response as any;

  //       const auth = {
  //         apiKey: this.credentials?.apiKey,
  //         cst: responseA?.clientSessionToken,
  //         securityToken: responseA?.activeAccountSessionToken,
  //       };

  //       /* accounts */
  //       const litActionCodeB = litActions.ig.getAccounts(
  //         env,
  //         auth,
  //       );

  //       const litActionCallB = await litClient.runLitAction({
  //         chain: await this.nftCredentialService.getChain(),
  //         litActionCode: litActionCodeB,
  //         listActionCodeParams: {},
  //         nodes: 1,
  //         showLogs: true,
  //       });

  //       const responseB = litActionCallB?.response as any;

  //       // const account: IAccount = responseB?.find((res: any) => res.accountId === this.credentials.accountId);
  //       const orderPayload = {
  //         epic,
  //         expiry,
  //       }

  //       const litActionCodeC = litActions.ig.closePosition(
  //         env,
  //         orderPayload,
  //         auth,
  //       );

  //       const litActionCallC = await litClient.runLitAction({
  //         chain: await this.nftCredentialService.getChain(),
  //         litActionCode: litActionCodeC,
  //         listActionCodeParams: {},
  //         nodes: 1,
  //         showLogs: true,
  //       });

  //       this.closeResponse = litActionCallC?.response as any;
  //       console.log('this.closeReponse', this.closeResponse);

  //       if (responseB?.errorCode) {
  //         alert(responseB?.errorCode);
  //       }

  //       this.cRef.detectChanges();
  //     }

  //     this.isLoading = false;

  //   } catch (err: any) {
  //     this.isLoading = false;
  //   }
  // }

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
          this.credentials.publicKey = credentialObj.publicKey;
          this.credentials.secretKey = credentialObj.secretKey;
        }
      }
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to these credentials`);
    }
  }

  // async actionClosePositionPre(position: any) {
  //   this.showClosureConfirmation = true;
  //   this.closeEpic = position.epic;
  //   this.closeExpiry = position.expiry;  
  // }
  // async actionClosePositionCancel() {
  //   this.showClosureConfirmation = false;
  //   this.closeEpic = '';
  //   this.closeExpiry = '';  
  // }

  // async actionClosePosition(position: any) {
  //   this.isClosingPosition = true;

  //   this.closeEpic = position.epic;
  //   this.closeExpiry = position.expiry;  

  //   // call the Lit Action to process
  //   const closeResponse = await this.igCloseFullPosition(position.epic, position.expiry);

  //   console.log('closeResponse', closeResponse);

  //   // refresh the positions
  //   await this.igGetPositions();

  //   // reset
  //   this.closeEpic = '';
  //   this.closeExpiry = '';  
  //   this.showClosureConfirmation = false;
  //   this.isClosingPosition = false;
  // }
}
