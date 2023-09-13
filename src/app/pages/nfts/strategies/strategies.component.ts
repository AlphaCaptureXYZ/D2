import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService } from 'src/app/services/event.service';
import { ActivService } from 'src/app/services/activ.service';
import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './strategies.component.html',
  styleUrls: ['./strategies.component.scss'],
})
export default class SrategiesComponent implements OnInit {
  currentOption = 'nft-ideas';
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;
  pageNumber = 1;
  strategies: v4.ITradeIdeaStrategy[];
  isLoading = false;
  itemMenu = 'accessible';

  constructor(
    private activService: ActivService,
    private eventService: EventService,
    private router: Router
  ) {
    this.strategies = [];
  }

  ngOnInit(): void {
    this.getStrategies();
  }

  goMenu = (value: string): void => {
    if (this.itemMenu !== value) {
      this.itemMenu = value;
      this.getStrategies();
    }
  };

  async getStrategies() {
    this.isLoading = true;
    // strategies the user has explicit access to
    if (this.itemMenu === 'accessible') {
      this.strategies = await this.activService.listAccessibleStrategies(
        this.pageNumber,
        this.pageSize
      );
    } else {
      this.strategies = await this.activService.listMyStrategies(
        this.pageNumber,
        this.pageSize
      );
    }
    // console.log('allStrategies', this.strategies);
    this.isLoading = false;
  }

  viewStrategy = (id: string): void => {
    const route = 'nfts/strategies/' + id;
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
    if (this.currentPage < this.strategies.length / this.pageSize) {
      this.start += this.pageSize;
      this.end = this.start + this.pageSize;
      this.currentPage++;
    }
  };
}
