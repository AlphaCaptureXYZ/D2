import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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
export default class TradingComponent implements OnInit {
  currentOption = 'trading';

  constructor(
    private router: Router,
    private eventService: EventService) {
  }

  ngOnInit(): void {
    // if we have a selected order type already, then redirect
    const selectedOrderType = localStorage.getItem('selectedOrderType');

    if (selectedOrderType) {
      // redirect
      switch (selectedOrderType) {
        case 'basic':
          this.router.navigateByUrl('/trading/basic');
          break;
        case 'managed':
          this.router.navigateByUrl('/trading/managed');
          break;
      }
    }

  }
}
