import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ActivService } from 'src/app/services/activ.service';

import IXilyACTIV from '@ixily/activ-web';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.scss'],
})
export default class LeftMenuComponent implements OnInit {
  @Input() currentOption: string;
  sdk = '';

  constructor(
    private router: Router,
    private activService: ActivService,
  ) {
    this.currentOption = 'dashboard';
  }

  async ngOnInit() {
    const path = this.router.url;
    if (path !== '/dashboard') {
      this.currentOption = path.slice(1);
      console.log(this.currentOption);
    }
    this.getSdkVersion();
  }

  async getSdkVersion() {
    const activ = new IXilyACTIV({
      webProvider: (window as any).ethereum,
    });

    this.sdk = await activ.getVersion();
  }

  goToPage(option: string) {
    if (option === 'dashboard') {
      this.router.navigateByUrl('/dashboard');
    }

    // Brokerage
    if (option === 'accounts') {
      this.router.navigateByUrl('/accounts');
    }

    if (option === 'orders') {
      this.router.navigateByUrl('/orders');
    }

    if (option === 'trading') {
      this.router.navigateByUrl('/trading');
    }

    // NFTs
    if (option === 'ideas') {
      this.router.navigateByUrl('/nfts/ideas');
    }

    if (option === 'strategies') {
      this.router.navigateByUrl('/nfts/strategies');
    }

    // Triggers
    if (option === 'triggers-view') {
      this.router.navigateByUrl('/triggers');
    }

    if (option === 'triggers-create') {
      this.router.navigateByUrl('/triggers/create');
    }

    // Additional
    if (option === 'settings') {
      this.router.navigateByUrl('/settings');
    }

    if (option === 'support') {
      this.router.navigateByUrl('/support');
    }
  }
}
