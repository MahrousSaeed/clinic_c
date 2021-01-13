import { Component, OnInit } from '@angular/core';
import { Globals, NotificationTypes } from '../../services/globals';
import { ApiService, RequestTypes } from '../../services/api/api.service';

@Component({
	selector: 'app-notification-page',
	templateUrl: './notification-page.component.html',
	styleUrls: ['./notification-page.component.scss']
})
export class NotificationPageComponent implements OnInit {
	notifications: any
	bills:any
	constructor(public globals: Globals, private api: ApiService) { }

	ngOnInit() {
		this.api.read(null, null, this.api.endPoints.notifications + this.globals.currentUser.branch).then(res => {
			this.notifications = res
			console.log(this.notifications);

		})
		this.globals.loading(loading => {
			this.api.request(this.api.endPoints.unpaid_bills, null, RequestTypes.GET).then(res => {
				this.bills = res.data
				console.log('this.dataFiltered', this.bills);
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

}
