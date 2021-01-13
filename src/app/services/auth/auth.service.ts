import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Globals, LoginUser } from '../globals';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiURL: string = environment.apiURL

	constructor(private http: HttpClient, private globals: Globals) { }

	public login = (email: string, password: string) =>
		this.http.post(`${this.apiURL}admin/auth/login`, { email, password }, { observe: 'response' }).toPromise()

	public logout = () =>
		this.http.post(`${this.apiURL}admin/auth/logout`, {}, {
			headers: {
				Authorization: `Bearer ${this.globals.currentUser ? this.globals.currentUser.token : null}`
			}
		}).toPromise()

	public loginUser = (userData: LoginUser) => {
		this.globals.currentUser = userData
		this.globals.secureStorage.setItem('current:user', userData)
	}
	public logoutUser = () => {
		this.globals.currentUser = null
		this.globals.secureStorage.removeItem('current:user')
	}
}
