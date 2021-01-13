import { Component, OnInit } from '@angular/core';
import { ApiService, RequestTypes } from '../../services/api/api.service';
import { Globals, NotificationTypes, Events } from '../../services/globals';

@Component({
	selector: 'app-vacation-requests',
	templateUrl: './vacation-requests.component.html',
	styleUrls: ['./vacation-requests.component.scss']
})
export class VacationRequestsComponent implements OnInit {

	branch: any
	vacations: any = []
	rejectRequest: boolean = false
	acceptRequest: boolean = false
	reasonText: string = ''

	constructor(private api: ApiService, private globals: Globals) {
		this.api.init()
	}

	ngOnInit() {
		this.globals.loading((loading) => {
			this.api.request(this.api.endPoints.allVacationRequest, '', RequestTypes.GET).then(res => {
				this.vacations = res.data

				Events.publish('vacations length', this.vacations.length)
				loading.hide()
			}, () => {
				loading.hide()
			})
		})
		this.api.request(this.api.endPoints.branches + `${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.branch = res.data
		})
		Events.subscribe('update-vacation-requests', () => this.refresh())
	}

	refresh = () => {
		this.ngOnInit()
		Events.publish('vacations length', this.vacations.length)
	}

	acceptVacation = (id) => {
		this.globals.loading(loading => {
			this.api.update(id, { status: 'accept', status_note: this.reasonText }, this.api.endPoints.allVacationRequest).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.globals.showToast('تم قبول طلب الاجازة بنجاح', '', NotificationTypes.Success)
				this.globals
				Events.publish('vacations length', this.vacations.length)
				this.ngOnInit()
				this.reasonText = ''
				loading.hide()
			}, () => {
				this.globals.showToast('حدث خطأ برجاء المحاولة مرة اخري ', '', NotificationTypes.Error)
				loading.hide()
			})
		})
	}

	rejectVacation = (id) => {
		this.globals.loading(loading => {
			this.api.update(id, { status: 'reject', status_note: this.reasonText }, this.api.endPoints.allVacationRequest).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.globals.showToast('تم رفض طلب الاجازة بنجاح', '', NotificationTypes.Success)
				setTimeout(() => {
					Events.publish('vacations length', this.vacations.length)
				}, 1);
				this.ngOnInit()
				this.reasonText = ''
				loading.hide()
			}, () => {
				this.globals.showToast('حدث خطأ برجاء المحاولة مرة اخري ', '', NotificationTypes.Error)
				loading.hide()
			})
		})

	}
	
	requestReason = (text) => {
		this.reasonText = text
	}
}
