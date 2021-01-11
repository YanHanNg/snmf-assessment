import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, retry } from 'rxjs/operators';
import { AuthService } from "../auth.service";
import { Reminder } from "../model/model";

@Injectable() 
export class BackendService {

    constructor(private http: HttpClient, private authSvc: AuthService) { }

    userSignUp(user) : Observable<any> {
        return this.http.post('http://localhost:3000/signup', user, { observe: 'response'})
            .pipe(
                catchError(this.handleError)
            );
    }

    getReminders() {
        console.info(this.authSvc.getUser().user_id);
        let params = new HttpParams().set('user_id', this.authSvc.getUser().user_id);
        return this.http.get('http://localhost:3000/getReminders', { params, observe: 'response' } )
            .pipe(
                catchError(this.handleError)
            );

    }

    updateReminderComplete(reminder: Reminder) : Observable<any> {
        return this.http.post('http://localhost:3000/completeReminder', { reminder } , { observe: 'response' })
            .pipe(
                catchError(this.handleError)
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