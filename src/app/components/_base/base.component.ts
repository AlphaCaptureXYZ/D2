import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-base',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss']
})
export default class BaseComponent implements OnInit {

    constructor() {

    }

    async ngOnInit() {

    }

}   