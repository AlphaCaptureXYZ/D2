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

import { IAccount } from '../_shared/account.i';

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

  accounts: Array<IAccount> = new Array<IAccount>();

  accountId: string = null as any;

  form: FormGroup = new FormGroup({
    name: new FormControl(),
    username: new FormControl(),
    apiKey: new FormControl(),
    password: new FormControl(),
    environment: new FormControl('demo'),
    accountId: new FormControl(),
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
      name: [null, Validators.required],
      username: [null, Validators.required],
      apiKey: [null, Validators.required],
      password: [null, Validators.required],
      environment: [null, Validators.required],
      accountId: [null, Validators.required],
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
    await this.litActionToCheckCredentials();
  }

  async encrypt() {
    try {

      this.isLoading = true;

      const check = this.form.valid;

      if (check) {

        const credentials = JSON.stringify(this.form.value);

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

      const env: 'demo' | 'prod' = this.form.value.environment;
      const litActionCode = litActions.ig.checkCredentials(env);

      const apiKey = this.form?.value?.apiKey;

      const listActionCodeParamsA = {
        credentials: {
          apiKey,
          name: this.form?.value?.name,
          username: this.form?.value?.username,
          password: this.form?.value?.password,
          environment: this.form?.value?.environment,
        },
      };

      const litActionCallA = await litClient.runLitAction({
        chain: await this.nftCredentialService.getChain(),
        litActionCode,
        listActionCodeParams: listActionCodeParamsA,
        nodes: 1,
        showLogs: true,
      });

      const responseA = litActionCallA?.response as any;

      this.errorHandling(responseA);

      const auth = {
        apiKey,
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

      const accounts = litActionCallB?.response as any;

      this.accounts = accounts;

      if (
        responseA?.clientSessionToken &&
        responseA?.activeAccountSessionToken
      ) {
        // this.verified = true;
        // await this.encrypt();
      }

    } catch (err: any) {
      this.isLoading = false;
    }
  }

  fillAccountSelected() {
    this.accountId = this?.form?.value?.accountId;
  }

  async mintCredential() {
    await this.encrypt();
  }

  errorHandling = (response: any) => {

    const clientSessionToken = response?.clientSessionToken?.trim()?.length > 0;
    const activeAccountSessionToken = response?.activeAccountSessionToken?.trim()?.length > 0;

    if (!clientSessionToken || !activeAccountSessionToken) {
      this.error = true;
      this.errorMsg = 'Check the credentials or try again later.';
    }

  }

}
