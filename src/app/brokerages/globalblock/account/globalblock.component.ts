import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import litClient from "src/app/scripts/Lit";

import { EventService } from 'src/app/services/event.service';

// import { publicIp } from 'public-ip';

// import { environment } from 'src/environments/environment';

// import { copyValue } from 'src/app/helpers/helpers';

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
  selector: 'app-accounts-globalblock',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './globalblock.component.html',
  styleUrls: ['./globalblock.component.scss'],
})
export default class AccountsGlobalBlockComponent implements OnInit {

  currentOption = 'accounts-globalblock';
  verified = false;
  submitted = false;

  isLoading = false;
  isVerifying = false;

  error = false;
  errorMsg = '';

  form: FormGroup = new FormGroup({
    name: new FormControl(),
    username: new FormControl(),
    publicKey: new FormControl(),
    secretKey: new FormControl(),
    environment: new FormControl('production'),
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
      name: ['Trade account', Validators.required],
      publicKey: ['yu_ijwHrcAd5swgEOm5lx76~+hAMsMO8zHhs', Validators.required],
      secretKey: ['MOkpW-m4eSxSp~7RhIxahd.puTfPGhGvea6HcKvVStlzJ4v7Uv', Validators.required],
      environment: ['prod', Validators.required],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  async verifyForm() {
    this.error = false;
    this.errorMsg = '';

    this.isVerifying = true;
    await this.verifyCredentials();
    this.isVerifying = false;
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

      const env: 'prod' = this.form.value.environment;
      const auth = {
          publicKey: this.form?.value?.publicKey,
          secretKey: this.form?.value?.secretKey,
      };
      const litActionCode = await litActions.globalblock.checkCredentials(env, auth);
      // console.log('litActionCode', litActionCode);

      const listActionCodeParamsA = {
        credentials: {
          name: this.form?.value?.name,
          publicKey: auth.publicKey,
          secretKey: auth.secretKey,
          environment: this.form?.value?.environment,
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
      const responseA = litActionCallA?.response as any;
      // console.log('responseA', responseA);

      this.errorHandling(responseA);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.isLoading = false;
    }
  }


  async mintCredential() {
    await this.encrypt();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorHandling = (response: any) => {

    // there's either an array or an error message
    const status = response?.code || '';

    if (status === 'UNAUTHORIZED') {
      this.error = true;
      this.errorMsg = 'Check the credentials or try again later.';
      this.verified = false;
    } else {
      this.verified = true;
      this.error = false;
      this.errorMsg = '';
    }

  }

}
