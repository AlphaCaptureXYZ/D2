import { ChangeDetectorRef, Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';

import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import NavbarAuthComponent from './components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from './components/left-menu/left-menu.component';
import SplashComponent from './pages/splash/splash.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventService, EventType } from './services/event.service';
// import { environment } from 'src/environments/environment';
import { getDefaultAccount, defaultNetworkSwitch, getEthereum, litSigAuthExpirationCheck, getDefaultNetwork } from './shared/shared';
import { WALLET_NETWORK_CHAIN_NAME, isSupportedNetwork } from './shared/web3-helpers';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NavbarAuthComponent,
    LeftMenuComponent,
    SplashComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: `./app.component.html`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'web-app';
  currentOption = 'dashboard';
  starting = true;

  ethereum: any;

  isSupportedNetwork = false;

  constructor(
    private eventService: EventService,
    private cRef: ChangeDetectorRef,
  ) { }

  async ngOnInit() {
    initFlowbite();
    await litSigAuthExpirationCheck();
    this.callEvents();
    this.detectAuth();
  }

  async detectAuth() {

    const account = await getDefaultAccount();

    if (account) {

      this.eventService.emit('METAMASK_WALLET_DETECTED', { wallet: account });

      this.starting = false;

      const defaultNetwork = await getDefaultNetwork();

      this.eventService.emit('METAMASK_NETWORK_CHANGED', {
        ...defaultNetwork,
        firstTime: true,
      });

      this.ethereum = await getEthereum();

      this.ethereum.on('accountsChanged', (accounts: any[]) => {
        this.eventService.emit('METAMASK_WALLET_CHANGED', { wallet: accounts[0] });
      });

      this.ethereum.on('networkChanged', async (networkId: number) => {
        const network = WALLET_NETWORK_CHAIN_NAME(networkId);
        this.eventService.emit('METAMASK_NETWORK_CHANGED', {
          id: networkId,
          name: network,
          firstTime: false,
        });
      });
    }
  }

  callEvents() {
    this.eventService.listen().subscribe(async (res: any) => {
      const event = res.type as EventType;
      const data = res?.data || null;

      switch (event) {
        case 'METAMASK_WALLET_DETECTED':
          if (data?.wallet) {
            this.starting = false;
          }
          break;
        case 'METAMASK_NETWORK_CHANGED':
          await this.networkSupporCheck(data);
          break;
      }
    });
  }

  async networkSupporCheck(payload: any) {
    const check = isSupportedNetwork(payload?.name);
    this.isSupportedNetwork = check;
    this.cRef.detectChanges();

    if (!this.isSupportedNetwork) {
      await defaultNetworkSwitch();
    }

  }
}
