import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Reminder, WeatherForecast } from '../model/model';
import { BackendService } from '../services/backend.service';
import { CameraService } from '../services/camera.services';
import * as GlobalConstants from '../constants/global.constants';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
  weatherForecast: WeatherForecast = {
    start_date: new Date(),
    end_date: new Date(),
    forecast: []
  }

  //Reminder Type
  rTypeWater = GlobalConstants.REMINDER_TYPE_WATER;
  rTypeBreakfast = GlobalConstants.REMINDER_TYPE_BREAKFAST;
  rTypeLunch = GlobalConstants.REMINDER_TYPE_LUNCH;
  rTypeDinner = GlobalConstants.REMINDER_TYPE_DINNER;

  constructor(private backendSvc: BackendService, private router: Router, private cameraSvc: CameraService, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.refreshReminders();
  }

  suggestMeal(reminder) {
    this.backendSvc.getRecommendedMeals(reminder.id)
      .subscribe(res => {
        if(res.status == 200) {
          reminder.image = res.body.recommendedMeal.image;
          reminder.message = res.body.recommendedMeal.message;
        }
      })
  }

  completeReminder(i) {
    //Change to MultiPart if have imageData
    let formData = new FormData();
    if(this.latestReminders[i].imageData != null)
    {
      console.info('Update Image Data', this.latestReminders[i]);
      formData.set('id', this.latestReminders[i].id.toString());
      formData.set('reminder_type_id', this.latestReminders[i].reminder_type_id.toString());
      formData.set('title', this.latestReminders[i].title);
      formData.set('image', this.latestReminders[i].image);
      formData.set('s3_image_key', this.latestReminders[i].s3_image_key);
      formData.set('message', this.latestReminders[i].message);
      formData.set('reminder_date', this.latestReminders[i].reminder_date.toString());
      formData.set('user_id', this.latestReminders[i].user_id);
      formData.set('status', this.latestReminders[i].status.toString());
      formData.set('rewards_pts', this.latestReminders[i].rewards_pts.toString());
      formData.set('created_date', this.latestReminders[i].created_date.toString());
      formData.set('timelapsed', this.latestReminders[i].timelapsed);
      formData.set('image-file', this.latestReminders[i].imageData);

      this.backendSvc.updateReminderComplete(formData)
        .subscribe(resp => {
            if(resp.status == 200)
              this.refreshReminders();
        })
    }
    else{
      this.backendSvc.updateReminderComplete(this.latestReminders[i])
        .subscribe(resp => {
            if(resp.status == 200)
              this.refreshReminders();
        })
    }
  }

  refreshReminders() {
    this.latestReminders = [];
    this.oldReminders = [];
    this.backendSvc.getReminders()
      .subscribe(resp => {
        if(resp.status == 200) {
          this.reminders = resp.body as Reminder[];
        }
        //Handle Camera Returned Image
        //console.info('Camera Svc Image' , this.cameraSvc.hasImage())
        if(this.cameraSvc.hasImage()) {
          let image = this.cameraSvc.getImage();
          console.info(image);
          this.reminders.forEach(d => {
            if(d.id == image.reminder_id)
            {
              console.info('im here setting image');
              d.image = image.imageAsDataUrl,
              d.message = image.message;
              d.imageData = image.imageData
            }
          })
          this.cameraSvc.clearImage();
        }
        this.sortReminders(this.reminders);
      },
      err => {
        if(err.status == 403)
          this.authSvc.logout();
      })
  }

  captureImage(reminder) {
    this.router.navigate(['/capture',  reminder.id ]);
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
            if(diff.hours >= 3)
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

  getWeatherForecast() {
    this.backendSvc.getWeatherForecast()
      .subscribe(resp => {
        if(resp.status == 200)
          this.weatherForecast = resp.body.weatherForecast as WeatherForecast;
        console.info(this.weatherForecast);
      })
  }
}
