import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Globals } from '../../globals';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class IsAdminGuard implements CanActivate {
	constructor(private globals: Globals, private router: Router) { }
	canActivate(
		next: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		if (this.globals.currentUser.isAdmin == true)
			return true
		else {
			if (this.globals.currentUser.isSystemAdmin == true)
				this.router.navigate(["/dash/admindb"])
			else this.router.navigate(["/dash/dashboard"])
			return true
		}
	}
}
