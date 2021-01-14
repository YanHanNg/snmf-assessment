import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { User } from '../model/model';

@Injectable()
export class AuthService implements CanActivate {
    private token = localStorage.getItem('ylycToken');
    public notificationEnabled$ = new BehaviorSubject(false);
    public rewards_pts$ = new BehaviorSubject(0);
    private user: User = JSON.parse(localStorage.getItem('ylycUser'));

    constructor(private http: HttpClient, private router: Router) { }

    login(username, password): Promise<boolean> {
        this.token = '';
        localStorage.setItem('ylycToken', '');
        return this.http.post<any>('/login', { username, password } , { observe: 'response' })
            .toPromise()
            .then(resp => {
                if(resp.status == 200) {
                    this.token = resp.body.token;
                    localStorage.setItem('ylycToken', this.token);
                    this.user = resp.body.user.user;
                    localStorage.setItem('ylycUser', JSON.stringify(this.user));
                    this.notificationEnabled$.next(resp.body.user.user.notification === 0 ? false : true)
                    this.rewards_pts$.next(resp.body.user.user.rewards_pts);
                }
                return true;
            })
            .catch(err => {
                return false;
            })
    }

    isLogin() {
        return this.token;
    }

    getAuthToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    getUserInfo() {
        let headers = new HttpHeaders({
            Authorization: 'Bearer ' + this.getAuthToken()
        })
        return this.http.post('/getUserInfo', { user_id: this.user.user_id }, { headers, observe: 'response' })
            .pipe(
                catchError(this.handleError.bind(this))
            )
            .subscribe(resp => {
                if(resp.status == 200)
                {
                    //@ts-ignore
                    this.user = resp.body.user;
                    //@ts-ignore
                    this.rewards_pts$.next(resp.body.user.rewards_pts);
                }
            })
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(this.isLogin()) {
            return true
        }
            
        //construct URL Tree to redirect
        return this.router.parseUrl('/error');
    }

    logout() {
        console.info('Auth Service Logout Called');
        localStorage.setItem('ylycUser', '');
        localStorage.setItem('ylycToken', '');
        this.user = null;
        this.token = null;
        this.router.navigate(['/'])
            .catch(err => [
                console.info('error: ', err)
            ])
    }

    public isNotificationEnabled(): Observable<boolean> {
        return this.notificationEnabled$;
    }

    public getRewardsPoints(): Observable<number> {
        return this.rewards_pts$;
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
                this.logout();
            }
                
        }
        // Return an observable with a user-facing error message.
        return throwError(
            'Something bad happened; please try again later.');
      }
}