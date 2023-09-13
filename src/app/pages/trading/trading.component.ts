import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import TradingBasicFormComponent from '../../brokerages/binance/trading/basic/trading-basic-form.component';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [CommonModule, RouterModule, TradingBasicFormComponent],
  templateUrl: './trading.component.html',
  styleUrls: ['./trading.component.scss'],
})
export default class TradingComponent {
  currentOption = 'trading';

  constructor(private eventService: EventService) {
  }
}
