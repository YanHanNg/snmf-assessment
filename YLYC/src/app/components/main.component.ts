import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Reminder } from '../model/model';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  @ViewChild('panel1') panel1: ElementRef;
  @ViewChild('panel2') panel2: ElementRef;

  reminders: Reminder[] = [];
  latestReminders: Reminder[] = [];
  oldReminders: Reminder[] = [];

  constructor(private backendSvc: BackendService) { }

  ngOnInit(): void {
    this.refreshReminders();
  }

  completeReminder(i) {
    this.backendSvc.updateReminderComplete(this.latestReminders[i])
      .subscribe(resp => {
          if(resp.status == 200)
            this.refreshReminders();
      })
  }

  refreshReminders() {
    this.latestReminders = [];
    this.oldReminders = [];
    this.backendSvc.getReminders()
      .subscribe(resp => {
        if(resp.status == 200)
          this.reminders = resp.body as Reminder[];
        
        this.sortReminders(this.reminders);
      })
  }

  sortReminders(reminders: Reminder[]) {
    for(let r of reminders)
    {
        //Check the Time Lapse
        //@ts-ignore
        const since = Date.parse(r.reminder_date);
        const elapsed = (new Date().getTime() - since) / 1000;

        if(elapsed >= 0) {
          let diff = { days: 0, hours: 0, minutes: 0, seconds: 0};

          diff.days    = Math.floor(elapsed / 86400);
          diff.hours   = Math.floor(elapsed / 3600 % 24);
          diff.minutes = Math.floor(elapsed / 60 % 60);
          diff.seconds = Math.floor(elapsed % 60);

          let timelapsed = ''
          if(diff.days > 0) {
            r.timelapsed = `${diff.days} Days Ago`;
            this.oldReminders.push(r);
          }
          else if(diff.hours > 0) {
            r.timelapsed = `${diff.hours} Hours Ago`;
            if(diff.hours >= 2)
              this.oldReminders.push(r);
            else
              this.latestReminders.push(r);
          }
          else if(diff.minutes > 0) {
            r.timelapsed =`${diff.minutes} Minutes Ago`;
            this.latestReminders.push(r);
          }
          else if(diff.seconds > 0) {
            r.timelapsed = `${diff.seconds} Seconds Ago`;
            this.latestReminders.push(r);
          }
        }
    }
  }

  togglePanel() {
    //If Either is Active Trigger a Refresh
    if(this.panel1.nativeElement.classList.toggle("active") || this.panel2.nativeElement.classList.toggle("active"))
      this.refreshReminders();
  }
}
