import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventService } from 'src/app/services/event.service';
import { ActivService } from 'src/app/services/activ.service';
import { SDK, CONTRACT } from '@ixily/activ-web';
import v4 = SDK.v4;
import CI = CONTRACT.CONTRACT_INTERFACES;

import NftSectionsComponent from './sections/nft-sections.component';

// interface OpenType {
//   idea: CI.ITradeIdeaIdea;
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
  idea = undefined as CI.ITradeIdea | undefined;
  ideaCore = {} as CI.ITradeIdeaIdea;
  access = {} as CI.ITradeIdeaAccess;
  wallets: string[];
  nftId = 0;
  settings = {} as v4.IWalletSettings;

  // nft parts
  open = {} as CI.ITradeIdeaIdea;
  adjustments = [] as CI.ITradeIdeaIdea[];
  close = {} as CI.ITradeIdeaIdea;

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
      if (this.idea?.nftId) {
        if (typeof this.idea.idea === 'string') {
          throw new Error('View Idea Error: Unexpected encrypted idea here.');
        }
        this.ideaCore = this.idea.idea as CI.ITradeIdeaIdea;
        this.access = this.idea.access as CI.ITradeIdeaAccess;
        this.wallets = this.access?.wallets || [];
        this.isEncrypted = this.idea?.access?.encryption?.encrypt || true;

        console.log('idea', this.idea);

        if (typeof this.idea!.idea === 'string') {
          throw new Error(
            'Domain Error: Idea is a encrypted string when we expected to be decrypted'
          );
        }

        const ideaIdea = this.idea!.idea as CI.ITradeIdeaIdea;

        // depending on the status of our idea, we'll split out the nft parts i.e. the open. adjustment or close
        if (ideaIdea.kind === 'adjust' || ideaIdea.kind === 'close') {
          // then we have a closed idea
          // we need to look up our chain of ideas
          if (this.ideaCore.chainIdeas) {
            // this should always exist given the closed statud
            this.open = this.ideaCore?.chainIdeas[0].idea as CI.ITradeIdeaIdea;

            if (this.ideaCore.chainIdeas.length > 0) {
              // loop through and add our adjustments
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              for (const [index] of this.ideaCore.chainIdeas.entries()) {
                if (index > 0) {
                  this.adjustments.push(
                    this.ideaCore?.chainIdeas[index].idea as CI.ITradeIdeaIdea
                  );
                }
              }
            }
          }

          //
          if (ideaIdea.kind === 'adjust') {
            // add the final adjustment to the array
            this.adjustments.push(this.ideaCore as CI.ITradeIdeaIdea);
          } else if (ideaIdea.kind === 'close') {
            this.close = this.ideaCore as CI.ITradeIdeaIdea;
          }
        } else if (ideaIdea.kind === 'open') {
          // we only have the open, no previous ideas
          this.open = this.ideaCore as CI.ITradeIdeaIdea;
        }
      }
    }
    // console.log('idea open', this.open);
    // console.log('idea adjustments', this.adjustments);
    // console.log('idea close', this.close);
    // console.log('idea', this.idea);
  }

  async getSettings() {
    this.settings =
      (await this.activService.getSettings()) as v4.IWalletSettings;
  }

  back = (): void => {
    this.router.navigateByUrl('nfts/ideas');
  };
}
