import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Globals } from '../../globals';

@Injectable({
  providedIn: 'root'
})
export class IsSystemAdminGuard implements CanActivate {
  constructor(private globals: Globals, private router: Router) { }
	canActivate(
		next: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		if (this.globals.currentUser.isSystemAdmin == true)
			return true
		else {
			this.router.navigate(["/dash/dashboard"])
			return true
		}
	}
}
