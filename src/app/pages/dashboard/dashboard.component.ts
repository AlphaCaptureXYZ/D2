import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import { CommonModule } from '@angular/common';

import { NFTCredentialService } from 'src/app/services/nft-credential.service';

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
  accounts: any[];

  constructor(
      private eventService: EventService,
      private nftCredentialService: NFTCredentialService,
    ) {
    this.currentOption = 'dashboard';
    this.accounts = [];

  }

  async ngOnInit() {
    this.getAccounts();
  }

  async getAccounts() {
    this.isLoadingAccounts = true;
    try {
      this.accounts = await this.nftCredentialService.getMyCredentials();
    } catch(err) {
      // console.log(err.message);
    }
    this.isLoadingAccounts = false;
  }

}
