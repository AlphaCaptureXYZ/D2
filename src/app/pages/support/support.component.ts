import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EventService, EventType } from 'src/app/services/event.service';
import NavbarAuthComponent from 'src/app/components/navbar-auth/navbar-auth.component';
import LeftMenuComponent from 'src/app/components/left-menu/left-menu.component';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        NavbarAuthComponent,
        LeftMenuComponent,
    ],
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss']
})
export default class SupportComponent implements OnInit {

    currentOption: string;

    constructor(
        private eventService: EventService,
    ) {
        this.currentOption = 'support';
    }

    async ngOnInit() {

    }

}