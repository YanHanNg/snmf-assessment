import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
//import { SwPush } from '@angular/service-worker';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AuthService } from './auth.service';

@Injectable()

export class WebNotificationService {

    //Vapid Public Key
    readonly VAPID_PUBLIC_KEY = 'BIfwSXS9sdWcn1V9bVfA18--BkKBSpBd1eKA_Almkkvhn7HPUoZb2ftVnsPkFZMoHrs4wGN8-CUdYFfRwh1O6Vk';

    constructor(private http: HttpClient, private afMessaging: AngularFireMessaging, private authSvc: AuthService) { 
        afMessaging.onMessage(function(payload) {
            //console.log("onMessage: ", payload);
            navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope').then(registration => {
                registration.showNotification(
                    payload.notification.title,
                    payload.notification
                )
            });
        });
    }

    subscribeToNotification(user: string) {
        this.afMessaging.requestToken // getting tokens
            .subscribe(
            (token) => { // USER-REQUESTED-TOKEN
                console.log('Permission granted! Save to the server!', token);
                this.mapTokenToUser(token, user)
            },
            (error) => {
                console.error(error);
            })
    }

    unSubscribeToNotification(user: string) {
        this.http.post('http://localhost:3000/notificationsUnSub', { user }, { observe: 'response' })
            .subscribe(resp => {
                console.info(resp);
                if(resp.status == 200)
                    this.authSvc.notificationEnabled$.next(resp.body['notification'])
            })
    }

    //Send Subscription of the User to Server
    mapTokenToUser(token: any, user: string) {
        this.http.post('http://localhost:3000/notificationsSub', { token, user }, { observe: 'response'})
            .subscribe(resp => {
                console.info(resp);
                if(resp.status == 200)
                    this.authSvc.notificationEnabled$.next(resp.body['notification'])
            });
    }

    getNotification() {
        return this.http.get('http://localhost:3000/getNotification').toPromise();
    }
}