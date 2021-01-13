import { Component, OnInit } from '@angular/core';
import { RequestTypes, ApiService } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes, Events } from 'src/app/services/globals';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Router } from '@angular/router';
import io from 'socket.io-client';
import { environment } from '../../../../environments/environment';
@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
	email = ''
	password = ''
	emailField:boolean = false

	loginError = false
	
	constructor(private auth: AuthService, private globals: Globals, private router: Router,private api:ApiService) { }

	ngOnInit() {}

	submitForm = () => {
		this.globals.loading(loading => {
			this.auth.login(this.email, this.password).then((res: any) => {
				if (!this.globals.isOnline)
					return
								
				this.auth.loginUser({
					email: res.body.email,
					id: res.body._id,
					image: res.body.image,
					name: res.body.name,
					role: res.body.role === undefined ? null : res.body.role,
					branch: res.body.branch._id,
					token: res.headers.get('x-auth'),
					isAdmin: res.body.isAdmin === undefined ? false :  res.body.isAdmin,
					isSystemAdmin: res.body.isSystemAdmin === undefined ? false :  res.body.isSystemAdmin,
					address: res.body.address,
					birthdate: res.body.birthdate,
					gender: res.body.gender,
					mobile: res.body.mobile
				})

				
				setTimeout(() => {
					Events.publish('user-login')
					Events.publish('user-updated')
				}, 500)

				if (res.body.role) {
					if(res.body.role.name === "doctor"){
						this.router.navigate(['/dash/doctor-screen'])
					} else {
						this.router.navigate(['/dash/dashboard'])
					}
				}
				else {
					this.router.navigate(['/dash/dashboard'])
				}
				
				loading.hide()
			}, () => {
				loading.hide()
				this.loginError = true
			})
		})
	}

	forgetPassword = () => {
		this.globals.loading(loading => {
			this.api.create({email:this.email},this.api.endPoints.forgetPassword).then(() => {
				if (!this.globals.isOnline)
					return
					
				this.globals.showToast('برجاء تفقد الايميل الخاص بك','',NotificationTypes.Success)
				this.globals.userMail = this.email
				this.router.navigate(['/newpassword'])
				loading.hide()
			}, () => {
				this.globals.showToast('حدث خطا برجاء المحاولة مرة اخري ','',NotificationTypes.Error)
				loading.hide()
			})
		})
		
	}

}
