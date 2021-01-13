import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { Globals } from '../../globals';

@Injectable()
export class UserGuard implements CanActivate {
	constructor(private globals: Globals, private router: Router) { }
	
	canActivate = (route: ActivatedRouteSnapshot): boolean => {
		if (this.globals.currentUser != null) {
			if (this.globals.currentUser.isSystemAdmin) {
				this.router.navigate(["/dash/admindb"])
				return false
			}
			else
				return true
		}

		this.router.navigate(["/login"])
		return false
	}

	canShow = (roles) => this.globals.currentUser.isAdmin ? true : roles.indexOf(this.globals.currentUser.role.name) > -1
}
