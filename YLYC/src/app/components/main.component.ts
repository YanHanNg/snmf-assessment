import { Component, OnInit } from '@angular/core';
import { Reminder } from '../models';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  reminders: Reminder[] = [];

  constructor() { }

  ngOnInit(): void {
    let rem: Reminder = {
      title: 'Breakfast',
      image: '',
      message: 'Time for Breakfast',
      time_lapsed: '2 mins ago'
    }

    this.reminders.push(rem);
    
  }

}
