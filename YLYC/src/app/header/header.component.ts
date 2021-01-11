import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { SwPush } from '@angular/service-worker';
import { WebNotificationService } from '../web.notification.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private authSvc: AuthService,
    private webNotificationService: WebNotificationService) { }

  notification: boolean;

  ngOnInit(): void {
    this.authSvc.isNotificationEnabled().subscribe( bool => {
      //this.notification = bool ? "Enabled" : "Disabled"
      this.notification = bool;
    })
  }

  toggleNotifcation() {
    // if(this.notification === "Disabled")
    if(!this.notification)
      this.webNotificationService.subscribeToNotification(this.authSvc.getUser().user_id);
    else
      this.webNotificationService.unSubscribeToNotification(this.authSvc.getUser().user_id);
  }

  isGranted = Notification.permission === 'granted';
  submitNotification(): void {
    this.webNotificationService.subscribeToNotification(this.authSvc.getUser().user_id);
  }

  getNotification() {
    this.webNotificationService.getNotification()
      .then(results => results);
  }
}
