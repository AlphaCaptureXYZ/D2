import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/accounts.component'),
  },
  {
    path: 'accounts/:accountReference/orders',
    loadComponent: () => import('./pages/orders/orders.component'),
  },

  // binance specific
  {
    path: 'accounts/binance',
    loadComponent: () => import('./brokerages/binance/account/binance.component'),
  },

  // IG Group specific
  {
    path: 'accounts/ig',
    loadComponent: () => import('./brokerages/ig/account/ig.component'),
  },
  {
    path: 'accounts/ig/:accountReference/positions',
    loadComponent: () => import('./brokerages/ig/positions/postions.component'),
  },

  // GlobalBlock specific
  {
    path: 'accounts/globalblock',
    loadComponent: () => import('./brokerages/globalblock/account/globalblock.component'),
  },
  {
    path: 'accounts/globalblock/:accountReference/positions',
    loadComponent: () => import('./brokerages/globalblock/positions/postions.component'),
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component'),
  },
  {
    path: 'orders/:orderReference',
    loadComponent: () => import('./pages/orders/order-detail/order-detail.component'),
  },
  {
    path: 'trading',
    loadComponent: () => import('./pages/trading/trading.component'),
  },
  {
    path: 'trading/basic',
    loadComponent: () =>
      import('./pages/trading/basic/trading-basic.component'),
  },
  {
    path: 'trading/basic/:broker',
    loadComponent: () =>
      import('./pages/trading/basic/trading-basic.component'),
  },
  {
    path: 'trading/managed',
    loadComponent: () =>
      import('./pages/trading/managed/trading-managed.component'),
  },
  {
    path: 'trading/managed/:broker',
    loadComponent: () =>
      import('./pages/trading/managed/trading-managed.component'),
  },
  {
    path: 'nfts/ideas',
    loadComponent: () => import('./pages/nfts/ideas/ideas.component'),
  },
  {
    path: 'nfts/idea/:nftId',
    loadComponent: () => import('./pages/nfts/idea-view/idea-view.component'),
  },
  {
    path: 'nfts/strategies',
    loadComponent: () => import('./pages/nfts/strategies/strategies.component'),
  },
  {
    path: 'nfts/strategies/:id',
    loadComponent: () =>
      import('./pages/nfts/strategy-view/strategy-view.component'),
  },
  {
    path: 'strategies/:strategyReference/orders',
    loadComponent: () => import('./pages/orders/orders.component'),
  },
  {
    path: 'triggers',
    loadComponent: () => import('./pages/triggers/list/triggers-list.component'),
  },
  {
    path: 'triggers/create',
    loadComponent: () => import('./pages/triggers/create/triggers-create.component'),
  },
  {
    path: 'triggers/:id',
    loadComponent: () => import('./pages/triggers/view/trigger-view.component'),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component'),
  },
  {
    path: 'faqs',
    loadComponent: () => import('./pages/faqs/faqs.component'),
  },
  {
    path: 'wallets/mpc',
    loadComponent: () => import('./pages/pkp/pkp.component'),
  },
  {
    path: 'guides',
    loadComponent: () => import('./pages/guides/list/list.component'),
  },
  {
    path: 'guides/proxy-service',
    loadComponent: () => import('./pages/guides/proxy-service/proxy-service.component'),
  },
  {
    path: 'guides/event-listener',
    loadComponent: () => import('./pages/guides/event-listener/event-listener.component'),
  },
  {
    path: 'support',
    loadComponent: () => import('./pages/support/support.component'),
  },
];
