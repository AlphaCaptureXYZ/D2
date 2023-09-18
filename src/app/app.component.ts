import { Component } from '@angular/core';
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
import { getDefaultAccount, getEthereum, litSigAuthExpirationCheck } from './shared/shared';

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

  constructor(private eventService: EventService) { }

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

      this.ethereum = await getEthereum();

      this.ethereum.on('accountsChanged', (accounts: any[]) => {
        this.eventService.emit('METAMASK_WALLET_CHANGED', { wallet: accounts[0] });
      });
    }
  }

  callEvents() {
    this.eventService.listen().subscribe((res: any) => {
      const event = res.type as EventType;
      const data = res?.data || null;

      switch (event) {
        case 'METAMASK_WALLET_DETECTED':
          if (data?.wallet) {
            this.starting = false;
          }
          break;
      }
    });
  }
}
