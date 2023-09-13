import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import * as helpers from '../helpers/helpers';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard {

    constructor(
        private router: Router,
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        routerState: RouterStateSnapshot
    ) {
   
    }
}