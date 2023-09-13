import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { isNullOrUndefined } from 'src/app/shared/shared';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { FormsModule } from '@angular/forms';
import { HighlightModule } from 'ngx-highlightjs';

const chain = 'mumbai';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HighlightModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export default class AccountsComponent {

  currentOption: string;
  allAccounts: any[];

  broker: string;
  apiKey: string;
  apiSecret: string;
  valueToEncryptOrDecrypt: string;

  encryptedValueResult: string;
  decryptedValueResult: string;

  encryptedValueResultCompleted: boolean;
  decryptedValueResultCompleted: boolean;

  credentialCode = null as any;

  constructor(
    private nftCredentialService: NFTCredentialService,
  ) {
    this.allAccounts = [];
    this.broker = 'Binance';
    this.currentOption = 'accounts';

    this.apiKey = null as any;
    this.apiSecret = null as any;
    this.valueToEncryptOrDecrypt = null as any;

    this.encryptedValueResult = null as any;
    this.decryptedValueResult = null as any;
    this.encryptedValueResultCompleted = false;
    this.decryptedValueResultCompleted = false;
  }

  async ngOnInit() {
    this.allAccounts = await this.nftCredentialService.getMyCredentials();
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
            contractAddress: this.nftCredentialService.getContractAddress(),
            standardContractType: 'ERC1155',
            method: 'balanceOf',
            parameters: [':userAddress', credentialInfo?.tokenId?.toString()],
            returnValueTest: {
              comparator: '>',
              value: '0',
            },
            chain,
          },
        ];

        const decryptedFile = await litClient.decryptString(
          encryptedFileB64,
          encryptedSymmetricKeyString,
          accessControlConditionsNFT
        );

        if (!isNullOrUndefined(decryptedFile)) {
          this.decryptedValueResult = decryptedFile;
          this.decryptedValueResultCompleted = true;
          this.credentialCode = JSON.stringify(JSON.parse(decryptedFile), null, 2);
        }
      }
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to this credential`);
    }
  };

  async clearAll() {
    this.valueToEncryptOrDecrypt = null as any;
    this.encryptedValueResult = null as any;
    this.decryptedValueResult = null as any;
    this.encryptedValueResultCompleted = false;
    this.decryptedValueResultCompleted = false;
    this.apiKey = null as any;
    this.apiSecret = null as any;
  }
}
