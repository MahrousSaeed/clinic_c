import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';

@Component({
	selector: 'app-doctors',
	templateUrl: './doctors.component.html',
	styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []
	minDate = new Date('1/1/2000')
	addModel = {
		name: null,
		email: null,
		number:'1',
		// address: null,
		// gender: null,
		// birthdate: null,
		mobile: null,
		password: null,
		password2: null,
		isAdmin: false,
		branch: this.globals.currentUser.branch,
		role: '5c7e54acffd81d307c66b39d', //Doctor role id
		passportStart:null,
		passportEnd:null,
		residenceNumber:null,
		residenceStart:null,
		residenceEnd:null,
		workStart:null,
		workEnd:null,
		incomeLimit:null
	}

	filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	roles: Array<any> = []

	constructor(private api: ApiService, public globals: Globals) {
		api.init(api.endPoints.users)
	}

	ngOnInit() {
		this.api.request(this.api.endPoints.roles, null, RequestTypes.PATCH).then(res => {
			this.roles = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.doctors}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
				this.data = res.data
				this.dataFiltered = Object.assign([], this.data)
				this.filterData()
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})

		this.addModel.branch = this.globals.currentUser.branch
		this.addModel.role = '5c7e54acffd81d307c66b39d'
		this.addModel.isAdmin = false
		
	}

	edit = (id) => {
		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (!this.globals.isOnline)
					return					

				this.addModel = {
					incomeLimit:res.data.incomeLimit,
					number:'1',
					name: res.data.name,
					branch: res.data.branch._id,
					email: res.data.email,
					isAdmin: res.data.isAdmin,
					password: null,
					password2: null,
					mobile:res.data.mobile,
					passportStart:new Date(res.data.passportStart),
					passportEnd:new Date(res.data.passportEnd),
					residenceNumber:res.data.residenceNumber,
					residenceStart:new Date(res.data.residenceStart),
					residenceEnd:new Date(res.data.residenceEnd),
					workStart:new Date(res.data.workStart),
					workEnd:new Date(res.data.workEnd),

					role: res.data.role ? res.data.role._id : '5c7e54acffd81d307c66b39d' //Doctor role id
				}

				setTimeout(() => {
					window.scrollTo(0, 0)
				}, 100)

				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	delete = () => {
		this.globals.loading(loading => {
			this.api.delete(this.deleteId).then(() => {
				if (!this.globals.isOnline)
					return
					
				this.deleteId = null
				this.deleteModal.hide()
				this.ngOnInit()

				this.globals.showToast('تم الحذف بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	submitForm = () => {
		this.addModel.mobile = this.addModel.mobile.toString()
		let data = this.globals.omit(this.addModel, 'password2')
		if (this.addModel.isAdmin)
			data = this.globals.omit(data, 'role')

		if (this.editId) {
			data = this.globals.omit(data, 'branch')
			this.globals.loading(loading => {
				this.api.update(this.editId, data).then(() => {
					if (!this.globals.isOnline)
						return
					
					this.form.reset()
					this.editId = null
					this.ngOnInit()

					this.globals.showToast('تم التعديل بنجاح!', '', NotificationTypes.Success)
					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
		else {
			this.globals.loading(loading => {
				this.api.create(data).then(() => {
					if (!this.globals.isOnline)
						return
					
					this.form.reset()
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

	cancel = () => {
		this.form.reset()
		this.addModel = {
			incomeLimit:null,
			number:'1',
			name: null,
			email: null,
			mobile:null,
			password: null,
			password2: null,
			isAdmin: false,
			branch: this.globals.currentUser.branch,
			role: '5c7e54acffd81d307c66b39d',
			passportStart:null,
			passportEnd:null,
			residenceNumber:null,
			residenceStart:null,
			residenceEnd:null,
			workStart:null,
			workEnd:null,
		}
		this.editId = null
		this.deleteId = null
	}

	filterData = () => {
		this.dataFiltered = JSON.parse(JSON.stringify(this.data))

		this.dataFiltered = this.dataFiltered.filter(d => {
			let dataString = JSON.stringify(d).toLowerCase()
			return dataString.indexOf(this.filter.toLowerCase()) > -1
		})

		this.dataFiltered = this.dataFiltered.sort((a, b) => {
			let _a = new Date(a.createdAt).getTime(), _b = new Date(b.createdAt).getTime()
			return this.sort == 1 ? (_b - _a) : (_a - _b)
		})

		this.dataFiltered = JSON.parse(JSON.stringify(this.dataFiltered))
	}

}
