import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import TradingBasicFormComponent from '../../../brokerages/binance/trading/basic/trading-basic-form.component';

@Component({
  selector: 'app-trading-basic',
  standalone: true,
  imports: [CommonModule, RouterModule, TradingBasicFormComponent],
  templateUrl: './trading-basic.component.html',
  styleUrls: ['./trading-basic.component.scss'],
})
export default class TradingBasicComponent {
  currentOption: string;

  constructor() {
    this.currentOption = 'trading-basic';
  }
}
