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
  selector: 'app-accounts-ig',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ig.component.html',
  styleUrls: ['./ig.component.scss'],
})
export default class AccountsIGComponent implements OnInit {

  currentOption = 'accounts-ig';
  verified = false;
  submitted = false;

  isLoading = false;

  error: boolean = false;
  errorMsg: string = '';

  form: FormGroup = new FormGroup({
    username: new FormControl(),
    apiKey: new FormControl(),
    password: new FormControl(),
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
    this.form = this.formBuilder.group({
      username: [null, Validators.required],
      apiKey: [null, Validators.required],
      password: [null, Validators.required],
      environment: [null, Validators.required],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  async verifyForm() {
    await this.verifyCredentials();
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

        const credentials = JSON.stringify(this.form.value);

        console.log('credentials', this.form.value);

        const chain = await this.nftCredentialService.getChain();

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
            chain,
          },
        ];

        const {
          encryptedFile,
          encryptedSymmetricKey,
          encryptedSymmetricKeyString,
        } = await litClient.encryptString(
          credentials,
          initialAccessControlConditionsNFT,
        );

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
          'IG',
          this.form.value.username,
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
            chain,
          },
        ];

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
      const litActionCode = litActions.ig.checkCredentials(env);

      const listActionCodeParams = {
        credentials: {
          username: this.form?.value?.username,
          apiKey: this.form?.value?.apiKey,
          password: this.form?.value?.password,
          environment: this.form?.value?.environment,
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

      console.log('IG response', response)

      if (
        response?.clientSessionToken &&
        response?.activeAccountSessionToken
      ) {
        this.verified = true;
        await this.encrypt();
      }

      this.isLoading = false;

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  errorHandling = (response: any) => {

    const clientSessionToken = response?.clientSessionToken;
    const activeAccountSessionToken = response?.activeAccountSessionToken;

    if (!clientSessionToken || !activeAccountSessionToken) {
      this.error = true;
      this.errorMsg = 'Check the credentials or try again later.';
    }

  }

}
