import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { User } from '../model/model';

@Injectable()
export class AuthService implements CanActivate {
    private token = '';
    public notificationEnabled$ = new BehaviorSubject(false);
    public rewards_pts$ = new BehaviorSubject(0);
    private user_id: string = '';
    private user: User;

    constructor(private http: HttpClient, private router: Router) { }

    login(username, password): Promise<boolean> {
        this.token = '';
        return this.http.post<any>('/login', { username, password } , { observe: 'response' })
            .toPromise()
            .then(resp => {
                if(resp.status == 200) {
                    this.token = resp.body.token;
                    this.user = resp.body.user.user;
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
        return this.http.post('/getUserInfo', { user_id: this.user.user_id }, { observe: 'response' })
            .pipe()
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
        this.user = null;
        this.token = null;
        this.router.navigate(['/']);
    }

    public isNotificationEnabled(): Observable<boolean> {
        return this.notificationEnabled$;
    }

    public getRewardsPoints(): Observable<number> {
        return this.rewards_pts$;
    }
}