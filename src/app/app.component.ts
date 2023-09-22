import { ChangeDetectorRef, Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';

import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import NavbarAuthComponent from './components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from './components/left-menu/left-menu.component';
import SplashComponent from './pages/splash/splash.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventService, EventType } from './services/event.service';
// import { environment } from 'src/environments/environment';
import { getDefaultAccount, defaultNetworkSwitch, getEthereum, litSigAuthExpirationCheck, getDefaultNetwork } from './shared/shared';
import { WALLET_NETWORK_CHAIN_NAME, isSupportedNetwork } from './shared/web3-helpers';
import { filter, map } from 'rxjs';

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

  currentNetworkInfo: any;

  constructor(
    private router: Router,
    private eventService: EventService,
    private cRef: ChangeDetectorRef,
  ) {
    this.currentNetworkInfo = null;
  }

  async ngOnInit() {
    initFlowbite();
    await litSigAuthExpirationCheck();
    this.callEvents();
    this.detectAuth();
    this.listenRouteChange();
  }

  async detectAuth() {

    const account = await getDefaultAccount();

    if (account) {

      this.eventService.emit('METAMASK_WALLET_DETECTED', { wallet: account });

      this.starting = false;

      const defaultNetwork = await getDefaultNetwork();

      this.currentNetworkInfo = {
        ...defaultNetwork,
        firstTime: true,
      };

      this.eventService.emit('METAMASK_NETWORK_CHANGED', this.currentNetworkInfo);

      this.ethereum = await getEthereum();

      this.ethereum.on('accountsChanged', (accounts: any[]) => {
        this.eventService.emit('METAMASK_WALLET_CHANGED', { wallet: accounts[0] });
      });

      this.ethereum.on('networkChanged', async (networkId: number) => {
        const network = WALLET_NETWORK_CHAIN_NAME(networkId);

        this.currentNetworkInfo = {
          id: networkId,
          name: network,
          firstTime: false,
        };

        this.eventService.emit('METAMASK_NETWORK_CHANGED', this.currentNetworkInfo);
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
          await this.networkSupporCheck();
          break;
      }
    });
  }

  async networkSupporCheck() {
    const path = window.location.pathname;

    const skipByPath = [
      '/wallets/mpc',
    ].includes(path);

    if (skipByPath) {
      this.isSupportedNetwork = true;
    }

    if (!skipByPath) {
      const check = isSupportedNetwork(this.currentNetworkInfo?.name);
      this.isSupportedNetwork = check;
      this.cRef.detectChanges();

      if (!this.isSupportedNetwork) {
        await defaultNetworkSwitch();
      }
    }
  }

  listenRouteChange() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          const path = window.location.pathname;
          return path
        })
      )
      .subscribe((path: string) => {
        this.networkSupporCheck();
      });
  };
}
