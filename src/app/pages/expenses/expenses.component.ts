import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';

@Component({
	selector: 'app-expenses',
	templateUrl: './expenses.component.html',
	styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []

	addModel = {
		date: new Date(),
		expense: null,
		cost: null,
		description: '',
		branch: this.globals.currentUser.branch,
	}

	filter: string = ''
	sort: number = 1
	range: Date[] = null

	editId = null
	deleteId = null

	expenses: Array<any> = []

	constructor(private api: ApiService, private globals: Globals) {
		api.init(api.endPoints.expenses)
	}

	ngOnInit() {
		this.api.request(`${this.api.endPoints.expenseTypes}${this.globals.currentUser.branch}`, null, RequestTypes.PATCH).then(res => {
			this.expenses = res.data. map(r => <Object>{ value: r._id, title: r.name,isActive: r.isActive }).filter(res=> res.isActive == true)			
		})

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.expenses}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
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
		this.addModel.description = ''
	}

	edit = (id) => {
		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.addModel = {
					branch: res.data.branch._id,
					cost: res.data.cost,
					date: new Date(res.data.date),
					description: res.data.description,
					expense: res.data.expense ? res.data.expense._id : null
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
				this.api.create({ ...this.addModel, branch: this.globals.currentUser.branch }).then(() => {
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
			date: new Date(),
			expense: null,
			cost: null,
			description: '',
			branch: this.globals.currentUser.branch,
		}
		this.editId = null
		this.deleteId = null
	}

	filterData = (dates = null) => {
		this.dataFiltered = JSON.parse(JSON.stringify(this.data))

		if (this.filter != '')
			this.dataFiltered = this.dataFiltered.filter(d => {
				let dataString = JSON.stringify(d).toLowerCase()
				return dataString.indexOf(this.filter.toLowerCase()) > -1
			})

		this.dataFiltered = this.dataFiltered.sort((a, b) => {
			let _a = new Date(a.createdAt).getTime(), _b = new Date(b.createdAt).getTime()
			return this.sort == 1 ? (_b - _a) : (_a - _b)
		})

		if (dates)
			this.dataFiltered = this.dataFiltered.filter(d => (new Date(d.date)) >= dates[0] && (new Date(d.date)) <= dates[1])
		else if (this.range)
			this.dataFiltered = this.dataFiltered.filter(d => (new Date(d.date)) >= this.range[0] && (new Date(d.date)) <= this.range[1])

		this.dataFiltered = JSON.parse(JSON.stringify(this.dataFiltered))
	}

}
