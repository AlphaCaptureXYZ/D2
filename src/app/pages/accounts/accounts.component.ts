import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { FormsModule } from '@angular/forms';
import { HighlightModule } from 'ngx-highlightjs';
import { isNullOrUndefined } from 'src/app/helpers/helpers';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HighlightModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export default class AccountsComponent implements OnInit {

  isLoading = false;
  currentOption: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any[];

  broker: string;
  apiKey: string;
  apiSecret: string;
  valueToEncryptOrDecrypt: string;

  encryptedValueResult: string;
  decryptedValueResult: string;

  encryptedValueResultCompleted: boolean;
  decryptedValueResultCompleted: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credentialCode = null as any;

  constructor(
    private router: Router,
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
  ) {
    this.accounts = [];
    this.broker = 'Binance';
    this.currentOption = 'accounts';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.apiKey = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.apiSecret = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.valueToEncryptOrDecrypt = null as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.encryptedValueResult = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.decryptedValueResult = null as any;
    this.encryptedValueResultCompleted = false;
    this.decryptedValueResultCompleted = false;
  }

  async ngOnInit() {
    this.getAccounts();
  }

  async getAccounts() {
    this.isLoading = true;
    try {
      const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
        autoRedirect: true,
      });
      this.accounts = await this.nftCredentialService.getMyCredentials(pkpWalletAddress);
      // console.log('this.accounts', this.accounts);
    } catch (err) {
      // console.log(err.message);
    }
    this.isLoading = false;
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

        if (!isNullOrUndefined(decryptedFile)) {
          this.decryptedValueResult = decryptedFile;
          this.decryptedValueResultCompleted = true;
          this.credentialCode = JSON.stringify(JSON.parse(decryptedFile), null, 2);
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.log('decrypt (error)', err?.message);
      alert(`You don't have access to this credential`);
    }
  }

  async clearAll() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.valueToEncryptOrDecrypt = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.encryptedValueResult = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.decryptedValueResult = null as any;
    this.encryptedValueResultCompleted = false;
    this.decryptedValueResultCompleted = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.apiKey = null as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.apiSecret = null as any;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goToAccountOrders(account: any) {
    const reference = account?.uuid;
    this.router.navigateByUrl(`accounts/${reference}/orders`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goToAccountPositions(account: any) {
    const reference = account?.uuid || '';
    const broker = account?.provider.toLowerCase() || '';

    const rt = `accounts/${broker}/${reference}/positions`;
    if (reference && broker) {
      this.router.navigateByUrl(rt);
    }
  }
  
}
