import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';

@Component({
	selector: 'app-doctors-schedule',
	templateUrl: './doctors-schedule.component.html',
	styleUrls: ['./doctors-schedule.component.scss']
})
export class DoctorsScheduleComponent implements OnInit {
	@ViewChild('scheduleModal', { static: true }) scheduleModal: ModalDirective
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('formSchedule', { static: true }) formSchedule: NgForm
	
	doctor = null
	doctors: Array<any> = []

	schedule: Array<any> = null

	addModel = {
		day_of_week: null,
		start_time: null,
		end_time: null,
		doctor: null
	}

	editId = null
	deleteId = null

	days = [
		{ value: 1, title: 'السبت' },
		{ value: 2, title: 'الأحد' },
		{ value: 3, title: 'الإثنين' },
		{ value: 4, title: 'الثلاثاء' },
		{ value: 5, title: 'الأربعاء' },
		{ value: 6, title: 'الخميس' },
		{ value: 7, title: 'الجمعة' },
	]

	daysFiltered = []

	constructor(private api: ApiService, private globals: Globals) {
		api.init(api.endPoints.schedule)
	}

	ngOnInit() {
		this.daysFiltered = Object.assign([], this.days)

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.doctors}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
				this.doctors = res.data.map(r => <Object>{ value: r._id, title: r.name })
				loading.hide()
			}, () => loading.hide())
		})
	}

	getSchedule = () => {
		this.globals.loading(loading => {
			this.api.read(this.doctor, { branch: this.globals.currentUser.branch }).then(res => {
				if (!this.globals.isOnline)
					return
					
				res.data.forEach(_schedule => {
					_schedule['day'] = this.days.find(d => d.value == _schedule.day_of_week).title
				})
				res.data.sort((a, b) => this.days.find(d => d.value == a.day_of_week).value > this.days.find(d => d.value == b.day_of_week).value ? 1 : -1)
				this.schedule = res.data

				this.daysFiltered = this.days.filter(d => res.data.findIndex(r => r.day_of_week == d.value) < 0)
				
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	submitScheduleForm = () => {
		this.addModel.doctor = this.doctor

		if (this.editId) {
			this.globals.loading(loading => {
				this.api.update(this.editId, this.addModel).then(() => {
					if (!this.globals.isOnline)
						return
					
					this.formSchedule.reset()
					this.editId = null
					this.getSchedule()

					this.globals.showToast('تم التعديل بنجاح!', '', NotificationTypes.Success)
					this.scheduleModal.hide()
					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
		else {
			this.globals.loading(loading => {
				this.api.create(this.addModel).then(() => {
					if (!this.globals.isOnline)
						return
					
					this.formSchedule.reset()
					this.getSchedule()

					this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
					this.scheduleModal.hide()
					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
	}

	edit = (_schedule) => {
		this.formSchedule.reset()

		this.editId = _schedule._id
		this.addModel = {
			day_of_week: _schedule.day_of_week,
			doctor: _schedule.doctor._id,
			end_time: _schedule.end_time,
			start_time: _schedule.start_time
		}

		this.scheduleModal.show()
	}

	delete = () => {
		this.globals.loading(loading => {
			this.api.delete(this.deleteId).then(() => {
				if (!this.globals.isOnline)
					return
					
				this.deleteId = null
				this.deleteModal.hide()
				this.getSchedule()

				this.globals.showToast('تم الحذف بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

}
