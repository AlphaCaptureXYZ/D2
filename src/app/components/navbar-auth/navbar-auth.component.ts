import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// import { getEthereum } from 'src/app/shared/shared';
import { EventService, EventType } from 'src/app/services/event.service';
import { ShortenContractAddress } from 'src/app/pipes/shorten-contract-address.pipe';
import { ActivService } from 'src/app/services/activ.service';

// import { BigNumber, ethers } from "ethers";
// import { WALLET_NETWORK_CHAIN_IDS } from 'src/app/shared/web3-helpers';

@Component({
  selector: 'app-navbar-auth',
  standalone: true,
  imports: [CommonModule, ShortenContractAddress, RouterModule],
  templateUrl: './navbar-auth.component.html',
  styleUrls: ['./navbar-auth.component.scss'],
})
export default class NavbarAuthComponent implements OnInit {
  walletAddress: string;
  networkName: string;

  constructor(
    private eventService: EventService,
    private activService: ActivService
  ) {
    this.walletAddress = null as any;
    this.networkName = null as any;
  }

  async ngOnInit() {
    this.callEvents();
  }

  callEvents() {
    this.eventService.listen().subscribe((res: any) => {
      const event = res.type as EventType;
      const data = res?.data || null;

      switch (event) {
        case 'METAMASK_WALLET_DETECTED':
          this.walletAddress = data?.wallet || null;
          this.getNetwork();
          break;
        case 'METAMASK_WALLET_CHANGED':
          window.location.reload();
          break;
      }
    });
  }

  getNetwork = async (): Promise<void> => {
    this.networkName = await this.activService.getNetworkName();
  };

  getBalance = async (): Promise<void> => {
    const balance = await (window.ethereum as any).
      request({
        method: "eth_getBalance",
        params: [this.walletAddress, "latest"],
      });

    const wei = parseInt(balance.toString(), 16);

    // convert wei to MATIC
    const matic = wei / 1000000000000000000;
    // convert wei to ETH
    const eth = wei / 1000000000000000000;

    if ([
      'mumbai',
    ].includes(this.networkName)) {
      alert(`Your balance is ${matic.toFixed(4)} MATIC`);
    };

    if ([
      'ethereum',
    ].includes(this.networkName)) {
      alert(`Your balance is ${eth.toFixed(4)} ETH`);
    };

  };
}
