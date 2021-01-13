import { Component, OnInit } from '@angular/core';
import { Reminder } from '../model/model';
import { AuthService } from '../services/auth.service';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  remindersHistory: Reminder[] = [];

  constructor(private backendSvc: BackendService, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.backendSvc.getUserRemindersHistory()
      .subscribe(resp => {
        if(resp.status == 200) {
          this.remindersHistory = resp.body as Reminder[];
        }
      },
      err => {
        if(err.status == 403)
          this.authSvc.logout();
      })
  }
}
