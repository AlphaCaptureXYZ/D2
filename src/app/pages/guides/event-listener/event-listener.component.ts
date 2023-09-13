import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-guide-event-listener',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
    ],
    templateUrl: './event-listener.component.html',
    styleUrls: ['./event-listener.component.scss']
})
export default class GuideEventListenerComponent {

}   