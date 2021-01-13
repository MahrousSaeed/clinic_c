import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';

@Component({
	selector: 'app-expense-types',
	templateUrl: './expense-types.component.html',
	styleUrls: ['./expense-types.component.scss']
})
export class ExpenseTypesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []

	addModel = {
		name: null,
		isActive: false
	}

	filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	constructor(private api: ApiService, private globals: Globals) {
		api.init(api.endPoints.expenseTypes)
	}

	ngOnInit() {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.expenseTypes}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
				this.data = res.data
				this.dataFiltered = Object.assign([], this.data)
				this.filterData()			
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})

	}

	edit = (id) => {
		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.addModel = {
					name: res.data.name,
					isActive: res.data.isActive
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
		if (this.editId) {
			this.globals.loading(loading => {
				this.api.update(this.editId, this.addModel).then(() => {
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
				this.api.request(`${this.api.endPoints.expenseTypes}${this.globals.currentUser.branch}`, this.addModel, RequestTypes.POST).then(() => {
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
			name: null,
			isActive: false
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
