import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';

import { EventService, EventType } from 'src/app/services/event.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export default class DashboardComponent implements OnInit {
  currentOption: string;

  constructor(private eventService: EventService) {
    this.currentOption = 'dashboard';
  }

  async ngOnInit() {}
}
