import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import { CommonModule } from '@angular/common';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';
import { IPkpInfo, PKPGeneratorService } from 'src/app/services/pkp-generator.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export default class DashboardComponent implements OnInit {

  currentOption: string;
  isLoadingAccounts = false;
  isLoadingMPCWallet = false;

  accounts: any[];
  pkpInfo: IPkpInfo;

  constructor(
    private eventService: EventService,
    private nftCredentialService: NFTCredentialService,
    private pkpGeneratorService: PKPGeneratorService
  ) {
    this.currentOption = 'dashboard';
    this.accounts = [];
    this.pkpInfo = null as any;
  }

  async ngOnInit() {
    this.getAccounts();
    this.getMPCWallet();
  }

  async getAccounts() {
    this.isLoadingAccounts = true;
    try {
      this.accounts = await this.nftCredentialService.getMyCredentials();
    } catch (err) {
      this.isLoadingAccounts = false;
    }
    this.isLoadingAccounts = false;
  }

  async getMPCWallet() {
    this.isLoadingMPCWallet = true;
    try {
      this.pkpInfo = await this.pkpGeneratorService.getPKPInfo(); 
    } catch (err) {
      this.isLoadingMPCWallet = false;
    }
    this.isLoadingMPCWallet = false;
  }

}
