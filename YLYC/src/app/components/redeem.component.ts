import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-redeem',
  templateUrl: './redeem.component.html',
  styleUrls: ['./redeem.component.css']
})
export class RedeemComponent implements OnInit {

  constructor(private authSvc: AuthService, private backendSvc: BackendService) { }

  rewards_pts: number;
  jokeMessage: string = "Laughter is the Best Medicine, Redeem Some Jokes.";

  ngOnInit(): void {
    this.authSvc.getUserInfo();
    this.authSvc.rewards_pts$
      .subscribe(points => this.rewards_pts = points);
  }

  redeemJokes() {
    this.backendSvc.redeemRewards('jokes')
      .subscribe(resp => {
        if(resp.status == 200){
          this.jokeMessage = resp.body.joke;
          //call get UserInfo to Update the Points
          this.authSvc.getUserInfo();
        }
      },
      err => {
        console.info(err);
        if(err.status == 409)
          this.jokeMessage = err.error.message;
          
      });
  }

}
