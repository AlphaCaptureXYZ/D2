import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WeaveDBService } from 'src/app/services/weavedb.service';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-trigger-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trigger-view.component.html',
  styleUrls: ['./trigger-view.component.scss'],
})
export default class TriggerViewComponent implements OnInit {

  currentOption = 'trigger-view';
  trigger: any;
  isLoading = false;

  constructor(
    private weaveDBService: WeaveDBService,
  ) {
    this.trigger = {};
  }

  async ngOnInit() {
    await this.getTriggerSingle();
  }

  async getTriggerSingle() {
    this.isLoading = true;

    try {
      console.log('call trigger');
      const docID = '0x0d111f8a500685d685a93b9320d7818e';
      this.trigger = await this.weaveDBService.getDataByDocID<any>(docID);
      console.log('trigger', this.trigger);
    } catch (err) {
      console.log('get trigger error', err);
      this.isLoading = false;
    }

    this.isLoading = false;
  }
}
