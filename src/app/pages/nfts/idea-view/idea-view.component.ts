import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import { ActivService } from 'src/app/services/activ.service';
import { v4 } from '@ixily/activ-web';

import NftSectionsComponent from './sections/nft-sections.component';

// interface OpenType {
//   idea: v4.ITradeIdeaIdea;
//   ideaSha512Hash: string;
//   nftId: number;
//   url: string;
// }

@Component({
  selector: 'app-idea-view',
  standalone: true,
  imports: [CommonModule, RouterModule, NftSectionsComponent],
  templateUrl: './idea-view.component.html',
  styleUrls: ['./idea-view.component.scss'],
})
export default class IdeaViewComponent implements OnInit {
  idea = {} as v4.ITradeIdea;
  ideaCore = {} as v4.ITradeIdeaIdea;
  access = {} as v4.ITradeIdeaAccess;
  wallets: string[];
  nftId = 0;
  settings = {} as v4.IWalletSettings;

  // nft parts
  open = {} as v4.ITradeIdeaIdea;
  adjustments = [] as v4.ITradeIdeaIdea[];
  close = {} as v4.ITradeIdeaIdea;

  tokenStandard: string;
  isEncrypted = false;

  currentOption = 'idea-view';

  constructor(
    private activService: ActivService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.wallets = [];
    this.adjustments = [];
    this.tokenStandard = 'ERC-1155';
  }

  async ngOnInit() {
    this.nftId = this.route.snapshot.params['nftId'];
    await this.getSettings();
    await this.getIdea();
  }

  async getIdea() {
    if (Number(this.nftId) > 0) {
      this.idea = await this.activService.getIdeaByNftId(this.nftId);

      // allow for data that is unencrypted
      if (this.idea.nftId) {
        this.ideaCore = this.idea.idea as v4.ITradeIdeaIdea;
        this.access = this.idea.access as v4.ITradeIdeaAccess;
        this.wallets = this.access.wallets;
        this.isEncrypted = this.idea?.access?.encryption?.encrypt || true;

        console.log('idea', this.idea);

        // depending on the status of our idea, we'll split out the nft parts i.e. the open. adjustment or close
        if (this.idea.status === 2 || this.idea.status === 3) {
          // then we have a closed idea
          // we need to look up our chain of ideas
          if (this.ideaCore.chainIdeas) {
            // this should always exist given the closed statud
            this.open = this.ideaCore?.chainIdeas[0].idea as v4.ITradeIdeaIdea;

            if (this.ideaCore.chainIdeas.length > 0) {
              // loop through and add our adjustments
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              for (const [
                index,
              ] of this.ideaCore.chainIdeas.entries()) {
                if (index > 0) {
                  this.adjustments.push(
                    this.ideaCore?.chainIdeas[index].idea as v4.ITradeIdeaIdea
                  );
                }
              }
            }
          }

          //
          if (this.idea.status === 2) {
            // add the final adjustment to the array
            this.adjustments.push(this.ideaCore as v4.ITradeIdeaIdea);
          } else if (this.idea.status === 3) {
            this.close = this.ideaCore as v4.ITradeIdeaIdea;
          }
        } else if (this.idea.status === 1) {
          // we only have the open, no previous ideas
          this.open = this.ideaCore as v4.ITradeIdeaIdea;
        }
      }
    }
    // console.log('idea open', this.open);
    // console.log('idea adjustments', this.adjustments);
    // console.log('idea close', this.close);
    // console.log('idea', this.idea);
  }

  async getSettings() {
    this.settings = await this.activService.getSettings() as v4.IWalletSettings;
  }

  back = (): void => {
    this.router.navigateByUrl('nfts/ideas');
  };
}
