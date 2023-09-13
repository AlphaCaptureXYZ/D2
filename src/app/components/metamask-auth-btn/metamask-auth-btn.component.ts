import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDefaultAccount } from 'src/app/shared/shared';
import { EventService } from 'src/app/services/event.service';

@Component({
  selector: 'app-metamask-auth-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metamask-auth-btn.component.html',
  styleUrls: ['./metamask-auth-btn.component.scss'],
})
export default class MetamaskAuthButtonComponent {
  walletAddress: string;

  constructor(private eventService: EventService) {
    this.walletAddress = null as any;
  }

  async auth() {
    const account = await getDefaultAccount();
    this.walletAddress = account;
    this.eventService.emit('METAMASK_WALLET_DETECTED', {
      wallet: this.walletAddress,
    });
  }
}
