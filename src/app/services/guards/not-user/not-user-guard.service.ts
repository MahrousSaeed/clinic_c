import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { Globals } from '../../globals';

@Injectable()
export class NotUserGuard implements CanActivate {
	constructor(private globals: Globals, private router: Router) { }
	
	canActivate = (): boolean => {
		if (this.globals.currentUser == null)
			return true

		this.router.navigate(["/dash/dashboard"])			
		return false
	}
}
