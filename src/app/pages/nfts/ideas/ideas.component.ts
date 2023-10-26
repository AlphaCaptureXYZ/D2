import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import { ActivService } from 'src/app/services/activ.service';
import { CONTRACT } from '@ixily/activ-web';
import CI = CONTRACT.CONTRACT_INTERFACES;

import { displayImage } from 'src/app/shared/shared';

@Component({
  selector: 'app-nfts-ideas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ideas.component.html',
  styleUrls: ['./ideas.component.scss'],
})
export default class NftIdeasComponent implements OnInit {
  currentOption = 'nft-ideas';
  allIdeas: CI.ITradeIdea[];
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;
  isLoading = false;
  itemMenu = 'accessible';
  subitemMenu = 'progress';
  myFilter = ['open'] as CI.ITradeIdeaIdeaKind[];

  constructor(
    private cRef: ChangeDetectorRef,
    private activService: ActivService,
    private eventService: EventService,
    private router: Router
  ) {
    this.allIdeas = [];
  }

  async ngOnInit() {
    this.cRef.detectChanges();
    await this.getIdeas();
  }

  viewIdea = (id: number): void => {
    const route = 'nfts/idea/' + id;
    this.router.navigateByUrl(route);
  };

  async getIdeas() {
    this.isLoading = true;
    let getAllIdeas: any;
    this.allIdeas = [];

    if (this.itemMenu === 'accessible') {
      getAllIdeas = (await this.activService.getNftsClientBy(1, 10, this.myFilter) as any)?.data;
    } else {
      getAllIdeas = (await this.activService.getNftsOwnerBy(1, 10, this.myFilter) as any)?.data;
    }

    for (const i in getAllIdeas) {
      if (i) {
        // if we have a string, it means the data is encrypted
        // but if we have an object (which we expect), it means we have a properly decrypted idea
        // the simplest test is to check if we have an nftId which we will always have if there is decrypted data
        if (getAllIdeas[i]?.nftId) {
          const idea = getAllIdeas[i] as CI.ITradeIdea;
          idea.idea = getAllIdeas[i].idea as CI.ITradeIdeaIdea;

          if (idea?.idea?.asset?.image) {
            idea.idea.asset.image.b64 =
              idea?.idea?.asset?.image?.b64 ?? 'assets/img/without_image.jpg';
          }

          this.allIdeas.push(idea);
        }
      }
    }
    this.allIdeas.sort((a: any, b: any) => {
      if (a.nftId < b.nftId) {
        return 1;
      } else if (a.nftId > b.nftId) {
        return -1;
      } else {
        return 0;
      }
    });
    if (this.allIdeas.length > 0) {
      let image;
      for (let i = 0; i < this.allIdeas.length; i++) {
        if (typeof this.allIdeas[i].idea === 'string') {
          throw new Error('Domain Error: Not expected encrypted idea here.');
        }
        const ideaIdea = this.allIdeas[i].idea as CI.ITradeIdeaIdea;
        image = await displayImage('idea', ideaIdea.asset.image!);
        // this.allIdeas[i].idea.asset.image.b64 = image?.source;
      }
    }
    // this.allIdeas = getAllIdeas?.data as CI.ITradeIdeaIdea[];
    this.isLoading = false;
    console.log('ideas', this.allIdeas);
    this.cRef.detectChanges();
  }

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
    if (this.currentPage < this.allIdeas.length / this.pageSize) {
      this.start += this.pageSize;
      this.end = this.start + this.pageSize;
      this.currentPage++;
    }
  };

  goInProgress = (): void => {
    this.subitemMenu = 'progress';
    if (this.myFilter[0] !== 'open') {
      this.myFilter = ['open'];
      this.getIdeas();
    }
  };

  goClosed = (): void => {
    this.subitemMenu = 'closed';
    if (this.myFilter[0] !== 'close') {
      this.myFilter = ['close'];
      this.getIdeas();
    }
  };

  goMenu = (value: string): void => {
    if (this.itemMenu !== value) {
      this.itemMenu = value;
      this.getIdeas();
    }
  };

  isString = (value: any): boolean => {
    return typeof value === 'string';
  };

  sureIdeaDecrypted = (value: any): CI.ITradeIdeaIdea => {
    if (typeof value?.idea === 'string') {
      throw new Error('Domain Error: Not expected encrypted idea here.');
    }
    const tidea = value as unknown as CI.ITradeIdeaIdea;
    return tidea;
  };
}
