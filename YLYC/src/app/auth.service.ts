import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { User } from '../app/model/model';

@Injectable()
export class AuthService implements CanActivate {
    private token = '';
    public notificationEnabled$ = new BehaviorSubject(false);
    private user_id: string = '';
    private user: User;

    constructor(private http: HttpClient, private router: Router) { }

    login(username, password): Promise<boolean> {
        this.token = '';
        return this.http.post<any>('http://localhost:3000/login', { username, password } , { observe: 'response' })
            .toPromise()
            .then(resp => {
                console.info(resp);
                if(resp.status == 200) {
                    this.token = resp.body.token;
                    this.user = resp.body.user.user;
                    this.notificationEnabled$.next(resp.body.user.user.notification === 0 ? false : true)
                    console.info(this.user);
                }
                return true;
            })
            .catch(err => {
                return false;
            })
    }

    isLogin() {
        return this.token != null;
    }

    getUser() {
        return this.user;
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(this.isLogin()) {
            return true
        }
            
        //construct URL Tree to redirect
        return this.router.parseUrl('/error');
    }

    public isNotificationEnabled(): Observable<boolean> {
        return this.notificationEnabled$;
    }
}