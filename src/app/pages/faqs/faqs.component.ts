import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EventService, EventType } from 'src/app/services/event.service';
import NavbarAuthComponent from 'src/app/components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from 'src/app/components/left-menu/left-menu.component';

@Component({
    selector: 'app-faqs',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        NavbarAuthComponent,
        LeftMenuComponent,
    ],
    templateUrl: './faqs.component.html',
    styleUrls: ['./faqs.component.scss']
})
export default class FaqsComponent implements OnInit {

    currentOption: string;

    constructor(
        private eventService: EventService,
    ) {
        this.currentOption = 'faqs';
    }

    async ngOnInit() {

    }

}