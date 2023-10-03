import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { HighlightModule } from 'ngx-highlightjs';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import PaginationTableRowComponent from 'src/app/components/pagination-table-row/pagination-table-row.component';

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

const defaultPage = 1;
const defaultLimit = 10;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HighlightModule, PaginationTableRowComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export default class OrdersComponent implements OnInit {

  isLoading = false;
  rawInfo: any;
  orders: IOrder[];

  totalOrders = 0;
  ordersPage = defaultPage;
  ordersLimit = defaultLimit;

  arrayLoader = Array.from({ length: defaultLimit }, (_, i) => i);

  constructor(
    private weaveDBService: WeaveDBService,
    private router: Router,
  ) {
    this.orders = [];
    this.isLoading = false;
  }

  resetIndicators() {
    this.totalOrders = 0;
    this.ordersPage = defaultPage;
    this.ordersLimit = defaultLimit;
  }

  async ngOnInit() {
    this.getOrders();
  }

  async refresh() {
    this.resetIndicators();
    this.getOrders();
  }

  async getOrders() {
    this.isLoading = true;
    this.orders = [];

    const ordersData = await this.weaveDBService.getAllData<any>({
      type: 'order',
      page: this.ordersPage,
      limit: this.ordersLimit,
    });

    this.totalOrders = ordersData?.total || 0;
    let orders = ordersData?.data;

    this.orders = orders?.map((data: any) => {

      let order: IOrder = null as any;

      const provider = data?.provider;
      const additionalInfo = data?.result?.additionalInfo;
      const response = data?.result?.response;

      const orderDirectionObj: any = {
        BUY: 'buy',
        SELL: 'sell',
      };

      if (provider === 'Binance') {
        order = {
          provider,
          id: response?.orderId?.toString(),
          ticker: response?.symbol,
          direction: orderDirectionObj[response?.side] || null,
          quantity: Number(response?.executedQty),
          price: Number(response?.fills?.find((res: any) => res)?.price || 0),
          createdAt: response?.transactTime,
          raw: data,
          environment: additionalInfo?.environment,
          nftIdLinked: additionalInfo?.nftId || null,
        }
      }
      return order;

    }).filter((order) => {
      return order !== null;
    });

    this.isLoading = false;
  }

  setRawInfo(order: IOrder) {
    this.rawInfo = JSON.stringify(order.raw, null, 2);
    this.router.navigateByUrl(`/orders/${order.raw.docId}`);
  }

  resetRawInfo() {
    this.rawInfo = null;
  }

  goToIdeaPage(order: IOrder) {
    window.open(`/nfts/idea/${order.nftIdLinked}`, '_blank');
  }

  paginationChanged(event: any) {
    this.ordersPage = event.page;
    this.ordersLimit = event.limit;
    this.getOrders();
  }

}
