import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

// import { v4 } from '@ixily/activ-web';

@Component({
  selector: 'app-idea-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './idea-result.component.html',
  styleUrls: ['./idea-result.component.scss'],
})
// implements OnInit
export default class IdeaResultComponent  {
  // @Input() idea = {} as v4.ITradeIdea;

  // constructor(
  // ) {
  // }

  // async ngOnInit() {

  // }  
}
