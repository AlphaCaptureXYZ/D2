import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';

import TradingBasicBinanceFormComponent from 'src/app/brokerages/binance/trading/basic/trading-basic-form.component';

import TradingBasicIGFormComponent from 'src/app/brokerages/ig/trading/basic/trading-basic-form.component';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TradingBasicBinanceFormComponent,
    TradingBasicIGFormComponent,
  ],
  templateUrl: './trading.component.html',
  styleUrls: ['./trading.component.scss'],
})
export default class TradingComponent {
  currentOption = 'trading';

  constructor(private eventService: EventService) {
  }
}
