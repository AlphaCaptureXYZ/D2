import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';

// https://www.kraken.com/convert

import { EventService, EventType } from 'src/app/services/event.service';

import litClient from "src/app/scripts/Lit";

import { isNullOrUndefined } from 'src/app/helpers/helpers';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';

import * as litActions from 'src/app/scripts/lit-actions';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

interface FormType {
  credentialNftUuid: string;
  broker: string;
  environment: string;
  asset: string;
  direction: string;
  quantity: number;
}

@Component({
  selector: 'app-trading-basic-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './trading-basic-form.component.html',
  styleUrls: ['./trading-basic-form.component.scss'],
})
export default class TradingBasicFormComponent implements OnInit {
  form: FormType;
  submitEnabled: boolean;
  credentials: any;
  allAccounts: any[];
  isLoading: boolean;
  broker = 'Binance';

  constructor(
    private eventService: EventService,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    public cRef: ChangeDetectorRef
  ) {
    this.isLoading = false;
    this.allAccounts = [];
    this.form = {
      credentialNftUuid: '',
      broker: '',
      environment: 'prod',
      asset: '',
      direction: 'buy',
      quantity: 1,
    };
    this.submitEnabled = false;
  }

  async ngOnInit() {
    this.getCredentials();
    this.callEvents();
  }

  async getCredentials() {
    const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
      autoRedirect: true,
    });
    this.allAccounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
  }

  requiredControl = (): void => {

    const credentialNftUuid = this.form.credentialNftUuid;
    const account = this.allAccounts?.find(res => res.uuid === credentialNftUuid);

    if (account) {
      this.form.broker = account.provider;
      this.form.environment = account.environment;
      this.cRef.detectChanges();
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
    if (
      this.form.broker?.toLowerCase() === 'binance'
    ) {
      await this.binancePlaceOrder();
    }
  };

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
  };

  callEvents = () => {
    this.eventService.listen().subscribe(async (res: any) => {
      const event = res.type as EventType;
      const data = res?.data || null;

      switch (event) {
        case 'TO_BASIC':
          //console.log('data', data)
          this.form = {
            credentialNftUuid: data.uuid,
            broker: this.form.broker,
            environment: this.form.environment,
            asset: data.asset,
            direction: 'buy',
            quantity: 1,
          }
          break;
      }
    });
  };
}
