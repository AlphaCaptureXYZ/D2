import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventService, EventType } from 'src/app/services/event.service';
import NavbarAuthComponent from 'src/app/components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from 'src/app/components/left-menu/left-menu.component';
import { SDK, CONTRACT } from '@ixily/activ-web';
import v4 = SDK.v4;
import CI = CONTRACT.CONTRACT_INTERFACES;
import { ActivService } from 'src/app/services/activ.service';
import { displayImage } from 'src/app/shared/shared';

@Component({
  selector: 'app-strategy-view',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarAuthComponent, LeftMenuComponent],
  templateUrl: './strategy-view.component.html',
  styleUrls: ['./strategy-view.component.scss'],
})
export default class StrategyViewComponent implements OnInit {
  currentOption: string;
  reference = '';
  strategy = {} as CI.ITradeIdeaStrategy;
  creator = {} as CI.ITradeIdeaCreator;
  ideas = [] as any[];
  isLoading = false as boolean;
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;
  itemMenu = 'progress';

  constructor(
    private activService: ActivService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.currentOption = 'strategy-view';
  }

  async ngOnInit() {
    this.reference = this.route.snapshot.params['id'];
    await this.getStrategy();
    await this.getIdeasByStrategy();
  }

  getStrategy = async (): Promise<void> => {
    const data = await this.activService.getStrategyInfoDetails(this.reference);
    this.strategy = data.strategy;
    this.creator = data.creator;
    console.log('strategy details', this.strategy);
  };

  getIdeasByStrategy = async (): Promise<void> => {
    this.isLoading = true;
    let filter;
    if (this.itemMenu === 'progress') {
      filter = ['open'] as CI.ITradeIdeaIdeaKind[];
    } else {
      filter = ['close'] as CI.ITradeIdeaIdeaKind[];
    }
    const data = await this.activService.listIdeasByStrategyReference(
      this.reference,
      1,
      10,
      filter
    );
    this.ideas = data;
    if (this.ideas.length > 0) {
      let image;
      for (let i = 0; i < this.ideas.length; i++) {
        image = await displayImage('idea', this.ideas[i].idea.asset.image);
        this.ideas[i].idea.asset.image.b64 = image?.source;
      }
    }
    console.log('data ideas', this.ideas);
    this.isLoading = false;
  };

  back = (): void => {
    this.router.navigateByUrl('nfts/strategies');
  };

  viewIdea = (id: number): void => {
    const route = 'nfts/idea/' + id;
    this.router.navigateByUrl(route);
  };

  toPage = (value: number): void => {
    this.start = (value - 1) * this.pageSize;
    this.end = this.start + this.pageSize;
    this.currentPage = value;
  };

  previous = (): void => {
    if (this.start > 1) {
      this.start -= this.pageSize;
      this.end -= this.pageSize;
      this.currentPage--;
    }
  };

  next = (): void => {
    if (this.currentPage < this.ideas.length / this.pageSize) {
      this.start += this.pageSize;
      this.end = this.start + this.pageSize;
      this.currentPage++;
    }
  };

  goInProgress = (): void => {
    if (this.itemMenu !== 'progress') {
      this.itemMenu = 'progress';
      this.getIdeasByStrategy();
    }
  };

  goClosed = (): void => {
    if (this.itemMenu !== 'closed') {
      this.itemMenu = 'closed';
      this.getIdeasByStrategy();
    }
  };

  goToStrategyOrders() {
    const reference = this.strategy.reference
    this.router.navigateByUrl(`strategies/${reference}/orders`);
  }
}
