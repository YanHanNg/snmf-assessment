import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
//import { SwPush } from '@angular/service-worker';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AuthService } from './auth.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()

export class WebNotificationService {

    //Vapid Public Key
    //readonly VAPID_PUBLIC_KEY = 'BIfwSXS9sdWcn1V9bVfA18--BkKBSpBd1eKA_Almkkvhn7HPUoZb2ftVnsPkFZMoHrs4wGN8-CUdYFfRwh1O6Vk';

    headers = new HttpHeaders({
        Authorization: 'Bearer ' + this.authSvc.getAuthToken()
    })

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
                if(token!=null)
                    this.mapTokenToUser(token, user)
            },
            (error) => {
                console.error(error);
            })
    }

    unSubscribeToNotification(user: string) {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        this.http.post('/notificationsUnSub', { user }, { headers, observe: 'response' })
            .pipe(
                catchError(this.handleError.bind(this))
            )
            .subscribe(resp => {
                console.info(resp);
                if(resp.status == 200)
                    this.authSvc.notificationEnabled$.next(resp.body['notification'])
            })
    }

    //Send Subscription of the User to Server
    mapTokenToUser(token: any, user: string) {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        this.http.post('/notificationsSub', { token, user }, { headers, observe: 'response'})
            .pipe(
                catchError(this.handleError.bind(this))
            )
            .subscribe(resp => {
                console.info(resp);
                if(resp.status == 200)
                    this.authSvc.notificationEnabled$.next(resp.body['notification'])
            });
    }

    private handleError (error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong.
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
            if(error.status == 403) {
                console.info('Executing logout from 403 Resp Code >>>>> ', error.error);
                this.authSvc.logout();
            }     
        }
        // Return an observable with a user-facing error message.
        return throwError(
            'Something bad happened; please try again later.');
      }
}