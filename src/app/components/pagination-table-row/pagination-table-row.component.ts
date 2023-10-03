import { Component, OnInit, Input, EventEmitter, Output, OnChanges } from '@angular/core';
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
export default class PaginationTableRowComponent implements OnInit, OnChanges {

    @Input() page: number = 0;
    @Input() limit: number = 10;

    @Input() total: number = 0;

    @Output() changed = new EventEmitter<{
        page: number,
        limit: number,
        total: number,
    }>();

    totalPagesToSwitch: number = 0;

    constructor() {

    }


    async ngOnInit() {
        this.totalPagesToSwitch = Math.ceil(this.total / this.limit);
    }

    async ngOnChanges() {
        this.totalPagesToSwitch = Math.ceil(this.total / this.limit);
    }

    emit() {
        this.changed.emit({
            page: this.page,
            limit: this.limit,
            total: this.total,
        });
    }

    next() {
        if (this.page < this.totalPagesToSwitch) {
            this.page++;
            this.emit();
        }
    }

    previous() {
        if (this.page > 1) {
            this.page--;
            this.emit();
        }
    }

}   