import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap/modal';
// import Cities from '../../../assets/cities.json'

@Component({
	selector: 'app-branches',
	templateUrl: './branches.component.html',
	styleUrls: ['./branches.component.scss']
})
export class BranchesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []
	fileNum: boolean = false
	editflag: boolean = false
	addModel = {
		name: null,
		phone: null,
		address: null,
		city: null,
		profileStart: null,
		numberOfVacation: null,
		numberOfVacationMonth: null,
		cleanVacation: null,
		incomeLimit: null
	}

	filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	_cities = []

	createAdmin = false
	branchUser = {
		email: null,
		password: null
	}

	constructor(private api: ApiService, public globals: Globals) {
		api.init(api.endPoints.branches)
	}

	ngOnInit() {
		this.createAdmin = false
		this.branchUser = {
			email: null,
			password: null
		}

		this.globals.loading(loading => {
			this.api.all().then(res => {
				if (!this.globals.isOnline)
					return

				this.data = res.data
				this.dataFiltered = Object.assign([], this.data)

				this.filterData()
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
		this._cities = this.globals.cities.map(c => <Object>{ value: c, title: c })
	}

	edit = (id) => {
		
		this.globals.loading(loading => {
			this.editId = id

			window.scrollTo(0, 0)
			this.api.read(this.editId).then(res => {
				console.log(res);
				if(res.data.admin !== null) {
					this.branchUser.email = res.data.admin.email
					this.editflag = true
				} else {
					this.editflag = false
				}
				// this.branchUser.email = res.data.admin.email
				this.globals.editBranch.next('sdsdsd')
				if (!this.globals.isOnline)
					return

				this.createAdmin = false
				this.branchUser.password= null

				this.addModel = {
					address: res.data.address,
					name: res.data.branch.name,
					phone: res.data.branch.phone,
					city: res.data.branch.city,
					profileStart: res.data.branch.profileStart,
					numberOfVacation: res.data.branch.numberOfVacation,
					numberOfVacationMonth: res.data.branch.numberOfVacationMonth,
					cleanVacation: res.data.branch.cleanVacation,
					incomeLimit: res.data.branch.incomeLimit
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
		let data = { ...this.addModel }

		if (this.createAdmin)
			data = { ...this.addModel, ...this.branchUser }

		if (this.addModel.address == null)
			delete data.address
		if (this.addModel.numberOfVacation == null)
			delete data.numberOfVacation
		if (this.addModel.numberOfVacationMonth == null)
			delete data.numberOfVacationMonth
		if (this.addModel.cleanVacation == null)
			delete data.cleanVacation
		if (this.addModel.incomeLimit == null)
			delete data.incomeLimit

		if (this.editId) {
			this.globals.loading(loading => {
				this.api.update(this.editId, data).then(() => {
					if (!this.globals.isOnline)
						return

					this.form.reset()
					this.editId = null
					this.ngOnInit()
					this.editflag = false
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
					this.fileNum = false
					this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
					loading.hide()
				}, (error) => {
					console.log(error);
					
					if (error.error.message == "Branch already exists with same profile start number!") {
						this.globals.showToast('عفوا يوجد فرع بنفس رقم الملف برجاء تغير رقم الملف!', '', NotificationTypes.Error)
						this.fileNum = true
					} else if(error.error.message == "there is a branch already exist with same name") {
						this.globals.showToast('عفوا يوجد فرع بنفس الاسم  برجاء تغير  اسم الفرع!', '', NotificationTypes.Error)
					} else if(error.error.message == "User already exist!") {
						this.globals.showToast('عفوا يوجد  هذا الايميل موجود  برجاء تغير  البريد الالكتروني !', '', NotificationTypes.Error)
					}
					 else {
						this.fileNum = false
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
					}
					loading.hide()
				})
			})
		}
	}

	cancel = () => {
		this.form.reset()
		this.addModel = {
			name: null,
			phone: null,
			address: null,
			city: null,
			profileStart: null,
			numberOfVacation: null,
			numberOfVacationMonth: null,
			cleanVacation: null,
			incomeLimit: null
		}
		this.editId = null
		this.deleteId = null
		this.createAdmin = false
		this.branchUser = {
			email: null,
			password: null
		}
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
