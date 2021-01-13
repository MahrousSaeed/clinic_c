import { Injectable } from '@angular/core'
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/do'
import { Router } from '@angular/router'
import { AuthService } from './auth/auth.service'
import { Globals, NotificationTypes } from './globals'
import { EMPTY } from 'rxjs';

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(private router: Router, private authService: AuthService, private globals: Globals) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.globals.isOnline) {
            return next.handle(req).do(() => {}, err => {
                this.globals.spinnerService.hide()
                
                if (err instanceof HttpErrorResponse && err.status == 401) {
                    // this.authService.logout()
                    this.authService.logoutUser()
                    this.router.navigate(['/login'])
                }
            })
        }
        else {
            this.globals.spinnerService.hide()
            this.globals.showToast('لا يوجد إتصال بالإنترنت!', '', NotificationTypes.Warning)
            return EMPTY;
        }
    }
}