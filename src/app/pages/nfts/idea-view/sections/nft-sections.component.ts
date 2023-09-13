import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { v4 } from '@ixily/activ-web';
import { EventService } from 'src/app/services/event.service';

@Component({
  selector: 'app-nft-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nft-sections.component.html',
  styleUrls: ['./nft-sections.component.scss'],
})
export default class NftSectionsComponent implements OnInit {
  @Input() idea = {} as v4.ITradeIdea;
  @Input() open? = {} as v4.ITradeIdeaIdea;
  @Input() adjustment? = {} as v4.ITradeIdeaIdea;
  @Input() close? = {} as v4.ITradeIdeaIdea;

  data = {} as v4.ITradeIdeaIdea;

   constructor(private router: Router, private eventService: EventService) {
   }

  async ngOnInit() {

    console.log('encruption', this.idea.access?.encryption?.encrypt);

    if (this.open?.kind === 'open') {
      this.data = this.open;
    } else if (this.adjustment?.kind === 'adjust') {
      this.data = this.adjustment;
    } else if (this.close?.kind === 'close') {
      this.data = this.close;
    }

  }

  goBasic = ():void => {
    this.eventService.emit('TO_BASIC', { 
      pricingProvider: this.idea.pricing.provider,
      asset: this.data?.asset.description
    }) 
    this.router.navigateByUrl('trading/basic')
  }

  goManaged = () => {
    this.eventService.emit('TO_MANAGED', { 
      pricingProvider: this.idea.pricing.provider,
      asset: this.data?.asset.description
    }) 
    this.router.navigateByUrl('trading/managed')
  }

}
