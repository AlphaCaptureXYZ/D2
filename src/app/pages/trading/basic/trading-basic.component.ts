import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import TradingBasicBinanceFormComponent from 'src/app/brokerages/binance/trading/basic/trading-basic-form.component';

import TradingBasicIGFormComponent from 'src/app/brokerages/ig/trading/basic/trading-basic-form.component';

@Component({
  selector: 'app-trading-basic',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TradingBasicBinanceFormComponent,
    TradingBasicIGFormComponent,
  ],
  templateUrl: './trading-basic.component.html',
  styleUrls: ['./trading-basic.component.scss'],
})
export default class TradingBasicComponent {

  currentOption: string;
  provider: string;

  constructor() {
    this.currentOption = 'trading-basic';
    this.provider = null as any;
  }

  selectFormToShow(provider: string) {
    this.provider = provider;
  }
}
