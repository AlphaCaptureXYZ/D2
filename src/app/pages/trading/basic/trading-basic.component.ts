import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
export default class TradingBasicComponent implements OnInit {

  currentOption: string;
  provider: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,    
  ) {
    this.currentOption = 'trading-basic';
    this.provider = null as any;
    localStorage.setItem('selectedOrderType', 'basic');

  }

  async ngOnInit() {
    console.log('this.route.snapshot.params', this.route.snapshot.params);
    if (this.route.snapshot.params['broker']) {
        this.provider = this.route.snapshot.params['broker'].toLowerCase();
        console.log('this.provider param', this.provider);
        localStorage.setItem('selectedBroker', this.provider);
      } else {
        const selectedBroker = localStorage.getItem('selectedBroker');
        if (selectedBroker) {
            this.provider = selectedBroker;
        }
    }
}

  selectFormToShow(provider: string) {
    this.provider = provider;
    localStorage.setItem('selectedBroker', provider);
  }
}
