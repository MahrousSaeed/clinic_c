import { Component, OnInit } from '@angular/core';
import { ApiService, RequestTypes } from '../../services/api/api.service';
import { Globals, NotificationTypes } from '../../services/globals';

@Component({
	selector: 'app-attendance',
	templateUrl: './attendance.component.html',
	styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
	users: any = []
	attendance: any = []
	addModel = {
		user: null
	}

	constructor(private api: ApiService, private globals: Globals) {
		this.api.init(this.api.endPoints.attendance)
	}

	ngOnInit() {
		this.api.request(this.api.endPoints.users + `${'all/' + this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.users = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})

		this.globals.loading(loading => {
			this.api.all().then(res => {
				if (!this.globals.isOnline)
					return
					
				res.data.forEach(element => {
					element['user_id'] = element.user._id
				})
				let groupedData = this.globals.groupBy(res.data, 'user_id')
				let attendences = []

				Object.keys(groupedData).forEach(key => {
					let item = groupedData[key]

					attendences.push(
						{
							name: item[0].user.name,
							mobile: item[0].user.mobile,
							start: item[0].createdAt,
							end: item.length > 1 ? (item[item.length - 1] !== undefined ? item[item.length - 1].createdAt : null) : null
						})
				})

				this.attendance = attendences

				loading.hide()
			}, () => {
				this.globals.showToast('حدث خطا برجاء المحاولة مرة اخري', '', NotificationTypes.Error)
			})
		})

	}

	submitForm = () => {
		this.globals.loading(loading => {
			this.api.create(this.addModel).then(() => {
				if (!this.globals.isOnline)
					return

				this.ngOnInit()
				this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

}
