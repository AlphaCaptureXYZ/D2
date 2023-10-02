import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination-table-row',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './pagination-table-row.component.html',
    styleUrls: ['./pagination-table-row.component.scss']
})
export default class PaginationTableRowComponent implements OnInit {

    @Input() page: number = 1;
    @Input() limit: number = 30;

    @Input() totalData: any[] = [];

    constructor() {

    }

    async ngOnInit() {

    }

}   