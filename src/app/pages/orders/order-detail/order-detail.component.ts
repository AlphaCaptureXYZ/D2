import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { HighlightModule } from 'ngx-highlightjs';
import { WeaveDBService } from 'src/app/services/weavedb.service';

interface IOrder {
  id: string;
  provider: string;
  ticker: string;
  direction: 'buy' | 'sell';
  price: number;
  quantity: number;
  createdAt: number;
  nftIdLinked: number;
  environment: 'demo' | 'prod';
  raw: any;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HighlightModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export default class OrdersComponent {

  isLoading: boolean;

  orderReference: string
  orderDetails: any;
  rawInfo: any;

  constructor(
    private weaveDBService: WeaveDBService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.orderReference = null as any;
    this.isLoading = false;
  }

  async ngOnInit() {
    this.orderReference = (this.activatedRoute.snapshot?.params as any)?.orderReference;
    this.getOrder();
  }

  async getOrder() {
    this.isLoading = true;

    const docID = this.orderReference;

    const order = await this.weaveDBService.getDataByDocID<any>(docID);

    this.orderDetails = order;
    this.rawInfo = JSON.stringify(this.orderDetails, null, 2);

    this.isLoading = false;
  }

}
