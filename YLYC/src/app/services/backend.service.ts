import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError, retry } from 'rxjs/operators';
import { AuthService } from "./auth.service";

@Injectable() 
export class BackendService {

    constructor(private http: HttpClient, private authSvc: AuthService, private router: Router) { }

    headers = new HttpHeaders({
        Authorization: 'Bearer ' + this.authSvc.getAuthToken()
    })

    userSignUp(user) : Observable<any> {
        return this.http.post('/signup', user, { observe: 'response'})
            .pipe(
                //catchError(this.handleError)
            );
    }

    getReminders() {
        let params = new HttpParams().set('user_id', this.authSvc.getUser().user_id);
        return this.http.get('/getReminders', { params, headers: this.headers , observe: 'response' } )
            .pipe(
                // catchError(this.handleError)
            );
    }

    getRecommendedMeals(reminder_id) : Observable<any> {
        return this.http.get(`/recommendMeal/${reminder_id}`, { headers: this.headers, observe: 'response' })
            .pipe(
                //catchError(this.handleError)
            );
    }

    getUserRemindersHistory() : Observable<any> {
        let params = new HttpParams().set('user_id', this.authSvc.getUser().user_id);
        return this.http.get('/getRemindersHistory', { params, headers: this.headers, observe: 'response'})
            .pipe(
                //catchError(this.handleError)
            );
    }

    updateReminderComplete(reminder) : Observable<any> {
        return this.http.post('/completeReminder', reminder , { headers: this.headers, observe: 'response' })
            .pipe(
                // catchError(this.handleError)
            );
    }

    getWeatherForecast() : Observable<any> {
        return this.http.get('/getWeatherForecast', { headers: this.headers, observe: 'response' })
            .pipe(
                //catchError(this.handleError)
            );
    }

    redeemRewards(type) : Observable<any> {
        return this.http.post('/redeemRewards', { user_id: this.authSvc.getUser().user_id, type }, { headers: this.headers, observe: 'response'} )
            .pipe(
                // catchError(this.handleError)
            );
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong.
            console.error(
                `Backend returned code ${error.status}, ` +
                `body was: ${error.error}`);
        }
        // Return an observable with a user-facing error message.
        return throwError(
            'Something bad happened; please try again later.');
      }
}