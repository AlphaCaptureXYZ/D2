import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WeaveDBService } from 'src/app/services/weavedb.service';

// import { EventService } from 'src/app/services/event.service';
// import { ActivService } from 'src/app/services/activ.service';
// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-triggers-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './triggers-view.component.html',
  styleUrls: ['./triggers-view.component.scss'],
})
export default class TriggersViewComponent implements OnInit {

  currentOption = 'triggers-view';
  triggers: any[];
  isLoading = false;

  constructor(
    private weaveDBService: WeaveDBService,
  ) {
    this.triggers = [];
  }

  async ngOnInit() {
    await this.getTriggers();
  }

  async getTriggers() {
    this.isLoading = true;

    try {
      this.triggers = await this.weaveDBService.getAllData<any>({
        type: 'trigger',
      });
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
}
