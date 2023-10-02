import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { CONTRACT } from '@ixily/activ-web';
import { EventService } from 'src/app/services/event.service';
import CI = CONTRACT.CONTRACT_INTERFACES;

@Component({
  selector: 'app-nft-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nft-sections.component.html',
  styleUrls: ['./nft-sections.component.scss'],
})
export default class NftSectionsComponent implements OnInit {
  private _idea? = undefined as CI.ITradeIdea | undefined;
  @Input()
  set idea(idea: CI.ITradeIdea) {
    if (idea !== undefined) {
      this._idea = idea;
      this.updateData();
    }
  }
  get idea(): CI.ITradeIdea | undefined {
    return this._idea;
  }
  @Input() open? = undefined as CI.ITradeIdeaIdea | undefined;
  @Input() adjustment? = undefined as CI.ITradeIdeaIdea | undefined;
  @Input() close? = undefined as CI.ITradeIdeaIdea | undefined;

  data = undefined as CI.ITradeIdeaIdea | undefined;

  constructor(private router: Router, private eventService: EventService) {}

  asureIdea = (): void => {
    if (this.idea === undefined) {
      throw new Error(
        'Ideas View NFT Section Component Error: Idea is undefined'
      );
    }
  };

  asureDecrypted = (): void => {
    this.asureIdea();
    if (typeof this.idea!.idea === 'string') {
      throw new Error(
        'Ideas View NFT Section Component Error: Idea is encrypted'
      );
    }
  };

  async ngOnInit() {
    this.updateData();
  }

  updateData() {
    this.asureDecrypted();
    console.log('encruption', this.idea!.access?.encryption?.encrypt);
    console.log(this.idea);
    if (this.open?.kind === 'open') {
      this.data = this.open;
    } else if (this.adjustment?.kind === 'adjust') {
      this.data = this.adjustment;
    } else if (this.close?.kind === 'close') {
      this.data = this.close;
    }
  }

  goBasic = (): void => {
    this.asureDecrypted();
    this.eventService.emit('TO_BASIC', {
      pricingProvider: this.idea!.pricing.provider,
      asset: this.data?.asset.description,
    });
    this.router.navigateByUrl('trading/basic');
  };

  goManaged = () => {
    this.asureDecrypted();
    this.eventService.emit('TO_MANAGED', {
      pricingProvider: this.idea!.pricing.provider,
      asset: this.data?.asset.description,
    });
    this.router.navigateByUrl('trading/managed');
  };
}
