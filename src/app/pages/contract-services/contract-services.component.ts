import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';

@Component({
	selector: 'app-contract-services',
	templateUrl: './contract-services.component.html',
	styleUrls: ['./contract-services.component.scss']
})
export class ContractServicesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []

	addModel = {
		contract: null,
		service: null,
		price: null,
		startDate: null,
		endDate: null
	}

	filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	contracts: Array<any> = []
	services: Array<any> = []

	constructor(private api: ApiService, private globals: Globals) {
		api.init(api.endPoints.contractServices)
	}

	ngOnInit() {
		this.api.request(this.api.endPoints.contracts, null, RequestTypes.PATCH).then(res => {
			this.contracts = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})
		this.api.request(this.api.endPoints.services, null, RequestTypes.PATCH).then(res => {
			this.services = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})
		
		this.globals.loading(loading => {
			this.api.all().then(res => {
				this.data = res.data
				this.dataFiltered = Object.assign([], this.data)
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
				this.addModel = {
					contract: res.data.contract._id,
					service: res.data.service._id,
					price: res.data.price,
					startDate: new Date(res.data.startDate),
					endDate: new Date(res.data.endDate)
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
		this.addModel.price = this.addModel.price + ''
		if (this.editId) {
			this.globals.loading(loading => {
				this.api.update(this.editId, this.addModel).then(() => {
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
				this.api.create(this.addModel).then(() => {
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
			contract: null,
			service: null,
			price: null,
			startDate: null,
			endDate: null
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
