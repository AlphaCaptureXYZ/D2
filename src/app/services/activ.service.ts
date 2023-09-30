import { Injectable } from '@angular/core';

import IXilyACTIV from '@ixily/activ-web';

import { Router } from '@angular/router';

import { getEthereum } from '../shared/shared';
import { WALLET_NETWORK_CHAIN_NAME } from '../shared/web3-helpers';

import { CONTRACT, SDK } from '@ixily/activ-web';
import CI = CONTRACT.CONTRACT_INTERFACES;
import v4 = SDK.v4;

import { isNullOrUndefined, wait } from '../helpers/helpers';

declare let Jimp: any;

@Injectable({
  providedIn: 'root',
})
export class ActivService {
  private ethereum: any;
  private activ: IXilyACTIV;

  private userWalletIsConnected: boolean;

  constructor(private router: Router) {
    this.activ = null as any;
    this.ethereum = null;
    this.userWalletIsConnected = false;
  }

  getUtils() {
    return this.activ.getUtils();
  }

  async isWalletConnected() {
    let isConnected = false;
    try {
      this.ethereum = await getEthereum();
      const accounts = await this.ethereum?.request({
        method: 'eth_requestAccounts',
      });
      isConnected =
        accounts?.find((account: any) => account) || null ? true : false;
    } catch (err) {
      // console.error('ActivService isWalletConnected (error)', err.message);
    }
    return isConnected;
  }

  async init(config?: { reset?: boolean }) {
    try {
      await wait(500);

      this.ethereum = await getEthereum();

      let networkName: string = null as any;

      try {
        const accounts = await this.ethereum?.request({
          method: 'eth_requestAccounts',
        });

        this.userWalletIsConnected =
          accounts?.find((account: any) => account) || null ? true : false;
        networkName = await this.getNetworkName();
      } catch (err) {
        // console.error('ActivService userWalletIsConnected (error)', err.message);
      }

      const isPublic = isNullOrUndefined(this.ethereum) ? true : false;

      if (config?.reset) {
        this.activ = null as any;
      }

      if (isNullOrUndefined(this.activ)) {
        this.activ = new IXilyACTIV({
          webProvider: (window as any).ethereum,
          public: isPublic,
        });

        await this.networkCheck();

        await this.activ.init({
          Jimp,
          ipfsProxyEnabled: true,
          network: networkName as any,
          showLogsToDebug: true,
        });

        this.overrideSettings(true, this.ethereum);
      } else {
        this.overrideSettings(true, this.ethereum);
        await this.networkCheck();
      }
    } catch (err) {
      // console.error('ActivService (error)', err.message);
      this.overrideSettings(true, null);
    }
  }

  private overrideSettings(configured: boolean, provider: any) {
    try {
      this.activ?.overrideSettings({ configured, provider });
    } catch (err) {
      // console.error('ActivService [overrideSettings] (error)', err.message);
    }
  }

  async networkCheck() {
    const network = await this.getNetworkName();
    const getSupportedChainNetworks = await this.getSupportedChainNetworks();

    if (!getSupportedChainNetworks.includes(network as any)) {
      if (network !== '') {
        this.router.navigate(['/']);
      }
    }
  }

  getVersion() {
    return this.activ.getVersion();
  }

  async getNetworkName() {
    let chainNetworkName = '';

    try {
      this.ethereum = await getEthereum();
      if (this.ethereum) {
        const chainId: any = this.ethereum?.networkVersion || null;
        const chainNerworkId = Number(chainId);

        chainNetworkName =
          WALLET_NETWORK_CHAIN_NAME(chainNerworkId) || 'unknown';
      }
    } catch (err) {
      // console.error('ActivService getNetworkName (error)', err.message);
    }

    return chainNetworkName;
  }

  async getSettings() {
    let settings = null;
    try {
      settings = await this.activ.getSettings();
    } catch (err) {
      console.log('error getSettings', err);
    }
    return settings;
  }

  async isPublic() {
    return this.activ.isPublic();
  }

  async getSupportedChainNetworks() {
    return this.activ.getSupportedChainNetworks();
  }

  async getIdeaByNftId(id: number) {
    await this.init();
    return await this.activ.getIdeaByNftId(id);
  }

  async getAllIdeas(page = 1, limit = 10, filter?: CI.ITradeIdeaIdeaKind[]) {
    if (filter === undefined) {
      filter = ['open', 'close'] as CI.ITradeIdeaIdeaKind[];
    }
    await this.init();
    return this.activ.getPublicIdeas(page, limit /*, filter*/);
  }

  async listMyIdeas(page = 1, limit = 10, filter?: CI.ITradeIdeaIdeaKind[]) {
    if (filter === undefined) {
      filter = ['open', 'close'] as CI.ITradeIdeaIdeaKind[];
    }
    await this.init();
    return this.activ.getAccessibleIdeas(page, limit /*, filter*/);
  }

  // Strategies
  async listMyStrategies(
    page = 1,
    limit = 10
  ): Promise<CI.ITradeIdeaStrategy[]> {
    await this.init();
    return this.activ.query().listAllMyStrategies();
  }

  async listAccessibleStrategies(
    page = 1,
    limit = 10
  ): Promise<CI.ITradeIdeaStrategy[]> {
    await this.init();
    return (await this.activ.listAccesibleStrategies(page, limit)).data;
  }

  async listAllStrategies(
    page = 1,
    limit = 10
  ): Promise<CI.ITradeIdeaStrategy[]> {
    await this.init();
    return (await this.activ.listAllStrategies(page, limit)).data;
  }

  // Single Strategy
  async getStrategyInfoDetails(strategyReference: string): Promise<{
    strategy: CI.ITradeIdeaStrategy;
    creator: CI.ITradeIdeaCreator;
  }> {
    await this.init();
    return await this.activ.getStrategyInfoDetails(strategyReference);
  }

  async listIdeasByStrategyReference(
    strategyReference: string,
    page = 1,
    limit = 10,
    filterType = ['open', 'close'] as CI.ITradeIdeaIdeaKind[]
  ) {
    await this.init();
    const ideas = await this.activ.getIdeasByStrategy(
      strategyReference
      /*
      page,
      limit,
      
      filterType
      */
    );
    return ideas.filter((ones) => {
      if (typeof ones.idea === 'string') {
        return false;
      } else {
        return (
          filterType.find(
            (oneFilter) => oneFilter === (ones.idea as CI.ITradeIdeaIdea).kind
          ) !== undefined
        );
      }
    });
  }
}
