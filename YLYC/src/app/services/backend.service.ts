import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError, retry } from 'rxjs/operators';
import { AuthService } from "./auth.service";

@Injectable() 
export class BackendService {

    constructor(private http: HttpClient, private authSvc: AuthService, private router: Router) { }

    userSignUp(user) : Observable<any> {
        return this.http.post('/signup', user, { observe: 'response'})
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getReminders() {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        let params = new HttpParams().set('user_id', this.authSvc.getUser().user_id);
        return this.http.get('/getReminders', { params, headers, observe: 'response' } )
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getRecommendedMeals(reminder_id) : Observable<any> {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        return this.http.get(`/recommendMeal/${reminder_id}`, { headers, observe: 'response' })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getUserRemindersHistory() : Observable<any> {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        let params = new HttpParams().set('user_id', this.authSvc.getUser().user_id);
        return this.http.get('/getRemindersHistory', { params, headers, observe: 'response'})
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    updateReminderComplete(reminder) : Observable<any> {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        return this.http.post('/completeReminder', reminder , { headers, observe: 'response' })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    getWeatherForecast() : Observable<any> {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        return this.http.get('/getWeatherForecast', { headers, observe: 'response' })
            .pipe(
                catchError(this.handleError.bind(this))
            );
    }

    redeemRewards(type) : Observable<any> {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.authSvc.getAuthToken()
        })
        return this.http.post('/redeemRewards', { user_id: this.authSvc.getUser().user_id, type }, { headers, observe: 'response'} )
            .pipe(
                catchError(this.handleError).bind(this)
            );
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