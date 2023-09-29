import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {

  private dataSource: any;
  private data: any;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.dataSource = new BehaviorSubject<any>({});
    this.data = this.dataSource.asObservable();
  }

  emit(type: EventType, data?: any) {
    this.dataSource.next({ type, data });
  }

  listen() {
    return this.data;
  }

  finish() {
    this.dataSource.next({});
  }
}

/* list of linked events */
export type EventType =
  | 'METAMASK_WALLET_DETECTED'
  | 'METAMASK_WALLET_CHANGED'
  | 'METAMASK_NETWORK_CHANGED'
  | 'TRADE_VIA_WS_LISTENER'
  | 'TO_BASIC'
  | 'TO_MANAGED';