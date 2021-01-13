import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api/api.service';
import { Globals, NotificationTypes, Events } from '../../services/globals';
import { Router } from '@angular/router';

@Component({
	selector: 'app-new-password',
	templateUrl: './new-password.component.html',
	styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {
	addModel = {
		code: null,
		email: this.globals.userMail,
		password: null

	}
	
	test = null
	confirmPassword: null
	constructor(private api: ApiService, private globals: Globals, private router: Router) { }

	ngOnInit() {}

	submitForm = () => {
		this.globals.loading(loading => {
			this.api.create(this.addModel, this.api.endPoints.verifyToken).then(() => {
				if (!this.globals.isOnline)
					return
					
				this.router.navigate(['/login'])
				this.globals.showToast('تم تغير الرقم السري بنجاح', '', NotificationTypes.Success)

				loading.hide()
			}, () => {
				this.globals.showToast('حدث خطأ برجاء المحاولة مرة اخري', '', NotificationTypes.Error)
				loading.hide()
			})
		})
	}

	preventSpace = (e) => {
		if (e.keyCode == 32) {
			return false;
		}
	}
}
