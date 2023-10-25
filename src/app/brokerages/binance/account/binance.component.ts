import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { EventService } from 'src/app/services/event.service';

import { publicIp } from 'public-ip';

import { environment } from 'src/environments/environment';

import { copyValue } from 'src/app/helpers/helpers';

// @ts-ignore
import { blobToBase64String } from 'lit-js-sdk';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { NFTCredentialService } from 'src/app/services/nft-credential.service';

import * as litActions from 'src/app/scripts/lit-actions';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';

@Component({
  selector: 'app-accounts-binance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './binance.component.html',
  styleUrls: ['./binance.component.scss'],
})
export default class AccountsBinanceComponent implements OnInit {
  currentOption = 'accounts-binance';
  ipAddress = '';
  defaultProxyIp = environment.defaultProxyIp;
  defaultProxyUrl = environment.defaultProxyUrl;
  verified = false;
  submitted = false;

  isLoading = false;

  error: boolean = false;
  errorMsg: string = '';

  form: FormGroup = new FormGroup({
    name: new FormControl(''),
    publicApi: new FormControl(''),
    secretApi: new FormControl(''),
    environment: new FormControl('demo'),
  });

  constructor(
    private nftCredentialService: NFTCredentialService,
    private pKPGeneratorService: PKPGeneratorService,
    private eventService: EventService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.getIpAddress();
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      publicApi: ['', Validators.required],
      secretApi: ['', Validators.required],
      environment: ['', Validators.required],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  async verifyForm() {
    // make a call to Binance
    await this.verifyCredentials();
    // if successful, then we can enable the Submit button
    // if not, then we show an error message
    // if the form is change, then the user needs to re-verify before they can submit
  }

  submitForm() {
    this.submitted = true;
    if (this.form.invalid) {
      this.verified = false;
      this.submitted = false;
      return;
    }
    this.encrypt();
  }

  async getIpAddress() {
    this.ipAddress = await publicIp();
  }

  goToAccounts = (): void => {
    this.router.navigateByUrl('accounts');
  };

  async verifyCredentials() {
    // call Binance to check the credentials work, before we create via Lit
    await this.litActionToCheckCredentials();
  }

  async encrypt() {
    try {

      this.isLoading = true;
      const check = this.form.valid;

      if (check) {

        const credentials = JSON.stringify({
          apiKey: this.form.value.publicApi,
          apiSecret: this.form.value.secretApi,
        });

        console.log('epador [encrypt] (credentials)', credentials);

        const initialAccessControlConditionsNFT = [
          {
            contractAddress: await this.nftCredentialService.getContractAddress(),
            standardContractType: 'ERC1155',
            method: 'balanceOf',
            parameters: [':userAddress', '0'],
            returnValueTest: {
              comparator: '>',
              value: '0',
            },
            chain: await this.nftCredentialService.getChain(),
          },
        ];

        console.log('epador [encrypt] (initialAccessControlConditionsNFT)', initialAccessControlConditionsNFT);

        const {
          encryptedFile,
          encryptedSymmetricKey,
          encryptedSymmetricKeyString,
        } = await litClient.encryptString(
          credentials,
          initialAccessControlConditionsNFT,
        );

        console.log('epador [encrypt] (encryptedFile)', encryptedFile);
        console.log('epador [encrypt] (encryptedSymmetricKey)', encryptedSymmetricKey);
        console.log('epador [encrypt] (encryptedSymmetricKeyString)', encryptedSymmetricKeyString);

        const encryptedFileB64 = await blobToBase64String(encryptedFile);

        const credentialEncrypted = `${encryptedFileB64}||${encryptedSymmetricKeyString}`;

        const pkpInfo = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
          autoRedirect: true,
        });

        const pkpKey = pkpInfo?.pkpPublicKey;

        const pkpWalletAddress = litClient.getPkpWalletAddress(pkpKey);

        const {
          tokenId,
        } = await this.nftCredentialService.mintCredential(
          'Binance',
          this.form.value.name,
          this.form.value.environment,
          credentialEncrypted,
          pkpWalletAddress,
        );

        const accessControlConditionsNFT = [
          {
            contractAddress: await this.nftCredentialService.getContractAddress(),
            standardContractType: 'ERC1155',
            method: 'balanceOf',
            parameters: [':userAddress', tokenId?.toString()],
            returnValueTest: {
              comparator: '>',
              value: '0',
            },
            chain: await this.nftCredentialService.getChain(),
          },
        ];

        console.log('epador [encrypt] (accessControlConditionsNFT)', accessControlConditionsNFT);

        await litClient.updateAccessControlConditions(
          encryptedSymmetricKey,
          accessControlConditionsNFT,
        );

        this.goToAccounts();

      }

      this.isLoading = false;

    } catch (err) {
      this.isLoading = false;
    }
  }

  async litActionToCheckCredentials() {
    try {
      this.isLoading = true;

      const env: 'demo' | 'prod' = this.form.value.environment;
      const litActionCode = litActions.binance.getAccount(env);

      const listActionCodeParams = {
        credentials: {
          apiKey: this.form?.value?.publicApi,
          apiSecret: this.form?.value?.secretApi,
        },
      };

      const litActionCall = await litClient.runLitAction({
        chain: await this.nftCredentialService.getChain(),
        litActionCode,
        listActionCodeParams,
        nodes: 1,
        showLogs: true,
      });

      const response = litActionCall?.response as any;

      this.errorHandling(response);

      if (response?.msg) {
        alert(response?.msg);
      }

      if (response?.uid) {
        this.verified = true;
        await this.encrypt();
      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  copyProxyIp() {
    copyValue(this.defaultProxyIp);
  }

  copyMyIp() {
    copyValue(this.ipAddress);
  }

  errorHandling = (response: any) => {

    const error = response?.error;

    if (error) {
      console.log('errorHandling (response)', response);
      console.log('errorHandling (error)', error);
    }

    if (error?.includes('Invalid API-key')) {
      this.error = true;
      this.errorMsg = 'Invalid API-key, IP, or permissions for action.';
    }

    if (error?.includes('API-key format invalid')) {
      this.error = true;
      this.errorMsg = 'API-key format invalid.';
    }
  }

}
