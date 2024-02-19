import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WeaveDBService } from 'src/app/services/weavedb.service';
import { PKPGeneratorService } from 'src/app/services/pkp-generator.service';
import { NFTCredentialService } from 'src/app/services/nft-credential.service';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-triggers-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './triggers-list.component.html',
  styleUrls: ['./triggers-list.component.scss'],
})
export default class TriggersListComponent implements OnInit {

  currentOption = 'triggers-view';
  triggers: any[];
  triggersCopy: any[];
  triggersTelegram: any[];
  isLoading = false;

  constructor(
    private weaveDBService: WeaveDBService,
    private pKPGeneratorService: PKPGeneratorService,
    private nftCredentialService: NFTCredentialService,
    private router: Router,
  ) {
    this.triggers = [];
    this.triggersCopy = [];
    this.triggersTelegram = [];  
  }

  async ngOnInit() {
    await this.getTriggers();
  }

  async getTriggers() {
    this.isLoading = true;

    try {
      const triggersData = await this.weaveDBService.getAllData<any>({
        type: 'trigger',
      });

      this.triggers = triggersData?.data;

      const { pkpWalletAddress } = await this.pKPGeneratorService.getOrGenerateAutoPKPInfo({
        autoRedirect: true,
      });

      this.triggers = this.triggers?.filter((trigger) => {
        const check = trigger?.pkpWalletAddress?.toLowerCase() === pkpWalletAddress?.toLowerCase();
        return check;
      });

      // split out the different type
      for (const i in this.triggers) {
        if (i) {
          const trigger = this.triggers[i];
          // console.log('trigger', trigger);

          switch (trigger.action) {
            case 'copy-trade':
              this.triggersCopy.push(trigger);
              break;
            case 'telegram-notification':
              this.triggersTelegram.push(trigger);
              break;  
          }      
    
        }
      }

      // console.log('this.triggers', this.triggers);
      console.log('this.triggersCopy', this.triggersCopy);
      console.log('this.triggersTelegram', this.triggersTelegram);

    } catch (err) {
      this.isLoading = false;
    }

    this.isLoading = false;
  }

  async deleteTrigger(data: any) {
    const docId = data.docId;

    this.isLoading = true;
    try {
      await this.weaveDBService.deleteData(docId);
      await this.getTriggers();
    } catch (err) {
      this.isLoading = false;
    }
    this.isLoading = false;

  }

  goTo(option: string) {
    if (option === 'create-trigger') {
      this.router.navigateByUrl('/triggers/create');
    }
  }

}
