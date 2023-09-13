import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventService, EventType } from 'src/app/services/event.service';
import MetamaskAuthButtonComponent from 'src/app/components/metamask-auth-btn/metamask-auth-btn.component';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [
    CommonModule,
    MetamaskAuthButtonComponent,
  ],
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
})
export default class SplashComponent {
  @Input() starting?: boolean;

  constructor(private eventService: EventService) { }
}
