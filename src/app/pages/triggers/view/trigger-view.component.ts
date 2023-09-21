import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

  triggerId: string;

  constructor(
    private route: ActivatedRoute,
    private weaveDBService: WeaveDBService,
  ) {
    this.trigger = {};
    this.triggerId = null as any;
  }

  async ngOnInit() {
    this.triggerId = this.route.snapshot.params['id'];
    await this.getTriggerSingle();
  }

  async getTriggerSingle() {
    this.isLoading = true;

    try {
      this.trigger = await this.weaveDBService.getDataByDocID<any>(this.triggerId);
      console.log('get trigger', this.trigger);
    } catch (err) {
      // console.log('get trigger error', err);
      this.isLoading = false;
    }

    this.isLoading = false;
  }
}
