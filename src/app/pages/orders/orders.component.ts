import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { HighlightModule } from 'ngx-highlightjs';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import PaginationTableRowComponent from 'src/app/components/pagination-table-row/pagination-table-row.component';

import { IPaging } from 'src/app/interfaces/interfaces';
import { isNullOrUndefined } from 'src/app/helpers/helpers';

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
  status: string,
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

  accountReference: string = null as any;
  strategyReference: string = null as any;

  constructor(
    private route: ActivatedRoute,
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
    this.accountReference = this.route.snapshot.params['accountReference'];
    this.strategyReference = this.route.snapshot.params['strategyReference'];
    this.getOrders();
  }

  async refresh() {
    this.resetIndicators();
    this.getOrders();
  }

  async getOrders() {
    this.isLoading = true;
    this.orders = [];

    let ordersData: IPaging<any>;

    if (!isNullOrUndefined(this.accountReference)) {

      ordersData = await this.weaveDBService.getAllData<any>({
        type: 'order',
        page: this.ordersPage,
        limit: this.ordersLimit,
        filter: {
          accountReference: this.accountReference,
        }
      });

    } else if (!isNullOrUndefined(this.strategyReference)) {

      ordersData = await this.weaveDBService.getAllData<any>({
        type: 'order',
        page: this.ordersPage,
        limit: this.ordersLimit,
        filter: {
          strategyReference: this.strategyReference,
        }
      });

    } else {
      ordersData = await this.weaveDBService.getAllData<any>({
        type: 'order',
        page: this.ordersPage,
        limit: this.ordersLimit,
      });
    }

    this.totalOrders = ordersData?.total || 0;
    const orders = ordersData?.data;
    // console.log('orders data', orders);

    this.orders = orders?.map((data: any) => {

      let order: IOrder = null as any;

      const provider = data?.provider;
      const additionalInfo = data?.result?.additionalInfo;

      let response = data?.result?.response;

      const orderDirectionObj: any = {
        BUY: 'buy',
        SELL: 'sell',
      };

      if (Array?.isArray(response)) {
        if (response.length > 0) {
          response = response[response.length - 1];
        }
      }

      order = {
        provider,
        id: response?.orderId?.toString() || response?.dealId?.toString() || null,
        ticker: response?.symbol,
        direction: orderDirectionObj[response?.side || response?.direction] || null,
        quantity: Number(response?.executedQty || response?.size),
        price: Number(response?.fills?.find((res: any) => res)?.price || 0),
        createdAt: response?.transactTime || response?.date,
        raw: data,
        status: response?.dealStatus,
        environment: additionalInfo?.environment,
        nftIdLinked: additionalInfo?.nftId || null,
      }

      return order;

    }).filter((order) => {
      return order !== null;
    });

    this.isLoading = false;
  }

  async deleteOrderInfo(order: IOrder) {
    // console.log('delete this order', order);

    // delete the doc
    if (order.raw.docId) {
      await this.weaveDBService.deleteData(order.raw.docId);
      // refresh the docs
      // it takes a few seconds for this data to refresh
      await this.getOrders();
    }
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
