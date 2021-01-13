import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes, Events } from 'src/app/services/globals';
import { environment } from 'src/environments/environment';

// import Cities from '../../../assets/cities.json'
import { Router } from '@angular/router';
import { PageState } from 'ngx-paginate';
declare var translate: any
declare var moment: any

@Component({
	selector: 'app-patient-profiles',
	templateUrl: './patient-profiles.component.html',
	styleUrls: ['./patient-profiles.component.scss']
})


export class PatientProfilesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('invoiceModal', { static: true }) invoiceModal: ModalDirective
	@ViewChild('billsModal', { static: true }) billsModal: ModalDirective
	@ViewChild('reservationsModal', { static: true }) reservationsModal: ModalDirective
	@ViewChild(NgForm, { static: true }) form: NgForm

	data: Array<any> = []
	dataFiltered: Array<any> = []

	nextNumber = null
	countDisabled: boolean = true
	addModel = {
		number: null,
		name_ar: null,
		name_en: null,
		age: null,
		gender: null,
		mobile: null,
		address: null,
		nationalId: null,
		notes: '',
		nationality: null,
		reservationsCount: 0,
		type: false
		// contract: null
	}
	patientAge = null

	filterNumber: string = ''
	filterMobile: string = ''
	filterName: string = ''
	// filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	contracts: Array<any> = []

	translating = false
	checkingNumber = false
	checkingMobile = false

	numberExists = false
	mobileExists = false

	_cities = []

	userBills = []

	currentInvoice = null
	currentBillServices = []

	patientReservations = []

	notCompletedStatus = '5c8e1fd01c5c323f54e0a804'
	completedStatus = '5c8e1fd41c5c323f54e0a805'

	page: PageState = {
		currentPage: 1,
		numberOfPages: 1,
		pageSize: 1,
		totalItems: 1
	}

	pageChange(pageState: PageState) {
		this.page = pageState
		this.loadData(pageState.currentPage)
	}

	constructor(private api: ApiService, public globals: Globals, public router: Router, private changeDetection: ChangeDetectorRef) {
		api.init(api.endPoints.patients)
	}

	ngOnInit() {
		translate.engine = 'google'
		translate.key = environment.googleApiKey
		translate.from = 'ar'

		if (this.globals.isOnline) {
			this.api.request(this.api.endPoints.contracts, null, RequestTypes.PATCH).then(res => {
				this.contracts = res.data.map(r => <Object>{ value: r._id, title: r.name })
			})

			this.api.request(`${this.api.endPoints.branches}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
				this.addModel.address = res.data.city
			})
		}

		this.loadData(1)

		this._cities = this.globals.cities.map(c => <Object>{ value: c, title: c })

		this.addModel.notes = ''

		if (this.globals.NetworkSubscribers.patients.online == null)
			this.globals.NetworkSubscribers.patients.online = Events.subscribe('online', () => {
				if (this.globals.isOnline && this.router.url == "/dFash/profiles")
					if (confirm('يوجد إتصال بالانترنت, هل تريد إعادة تحميل البيانات؟'))
						this.ngOnInit()
			})
		if (this.globals.NetworkSubscribers.patients.offline == null)
			this.globals.NetworkSubscribers.patients.offline = Events.subscribe('offline', () => {
				if (!this.globals.isOnline && this.router.url == "/dash/profiles")
					if (confirm('لا يوجد إتصال بالإنترنت, هل تريد تحميل الداتا الغير متصلة بالإنترنت؟'))
						this.ngOnInit()
			})
	}

	filterPatients = (e, filterName, filterValue) => {
		if (e.which == 13) {
			this.globals.loading(loading => {
				let filters = {}
				filters[filterName] = filterValue

				this.api.request(`${this.api.endPoints.patientsFilter}${this.globals.currentUser.branch}`, filters, RequestTypes.POST).then(res => {
					this.data = res.data
					this.dataFiltered = Object.assign([], this.data)

					if (filterValue == "") {
						this.page = {
							currentPage: res.meta.currentPage,
							numberOfPages: res.meta.pages,
							pageSize: res.meta.perPage,
							totalItems: res.meta.total
						}
					}
					else {
						this.page = {
							currentPage: 1,
							numberOfPages: Math.ceil(res.total / res.meta.perPage),
							pageSize: res.meta.perPage,
							totalItems: res.total
						}
					}


					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}

	}

	loadData = (page) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.patients}${this.globals.currentUser.branch}?offline_only=true&page=${page}`, {}, RequestTypes.PATCH).then(res => {
				if (this.globals.isOnline)
					this.data = res.data
				else this.data = res.rows.map(r => r.doc)

				if (!this.globals.isOnline && this.data.length > 0)
					this.globals.DBS.PATIENTS.hasOffflineData = true

				this.page = {
					currentPage: this.globals.isOnline ? res.meta.currentPage : 1,
					numberOfPages: this.globals.isOnline ? res.meta.pages : 1,
					pageSize: this.globals.isOnline ? res.meta.perPage : 100,
					totalItems: this.globals.isOnline ? res.meta.total : res.rows.length
				}

				if (this.globals.isOnline) {
					this.nextNumber = res.nextNumber
					this.addModel.number = this.nextNumber
				}

				this.dataFiltered = Object.assign([], this.data)
				
				try {
					this.changeDetection.detectChanges()
				} catch (e) {}

				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	typeChangeing = () => {
		if (this.addModel.type == true) {
			this.countDisabled = false
		} else {
			this.countDisabled = true
		}
	}

	edit = (id) => {
		this.countDisabled = true

		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (res.data)
					res = res.data

				this.addModel = {
					number: res.number,
					name_ar: res.name_ar,
					name_en: res.name_en,
					age: new Date(res.age),
					gender: res.gender,
					mobile: res.mobile,
					address: res.address,
					notes: res.notes,
					nationalId:res.nationalId,
					nationality: res.nationality,
					reservationsCount: res.reservationsCount,
					type: res.type
				}

				this.translating = false
				this.checkingNumber = false
				this.checkingMobile = false
				this.numberExists = false
				this.mobileExists = false

				setTimeout(() => {
					window.scrollTo(0, 0)
				}, 100)

				loading.hide()
			}, (e) => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	delete = () => {
		this.globals.loading(loading => {
			this.api.delete(this.deleteId).then(res => {					
				this.deleteId = null
				this.deleteModal.hide()
				this.ngOnInit()

				if (this.globals.isOnline) {
					this.nextNumber = res.nextNumber
					this.addModel.number = this.nextNumber
				}

				this.globals.showToast('تم الحذف بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	submitForm = (reserve: boolean = false) => {
		this.addModel.number = this.addModel.number + ''
		this.addModel.mobile = this.addModel.mobile.trim()

		if (this.editId) {
			if (this.addModel.type == true) {
				Events.publish('reservationCount', true)
			}

			this.globals.loading(loading => {
				let data = { ...this.addModel, ...(this.globals.isOnline ? {} : { offline: true }) }
				// data.number = this.globals.isOnline ? data.number : null
				if (!this.globals.isOnline){
					delete data.number;
					delete data.type;
					// data['createdAt'] = (new Date()).toISOString()
					data['isDeleted'] = false
				} else {
					data.number = data.number
				}
				this.api.update(this.editId, data).then(res => {
					this.form.reset()
					this.editId = null
					this.ngOnInit()

					if (this.globals.isOnline) {
						this.nextNumber = res.nextNumber
						this.addModel.number = this.nextNumber
					}

					this.globals.showToast('تم التعديل بنجاح!', '', NotificationTypes.Success)
					loading.hide()

					if (reserve) {
						this.router.navigate(['/dash/reservations'], {
							queryParams: {
								patientId: res.data._id
							}
						})
					}
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
		else {
			if (this.addModel.type == true) {
				Events.publish('reservationCount', true)
			}
			this.globals.loading(loading => {
				let data = { ...this.addModel, branch: this.globals.currentUser.branch, ...(this.globals.isOnline ? {} : { offline: true }) }
				// data.number = this.globals.isOnline ? data.number : null
				// Math.floor(Math.random() * 10000)
				if (!this.globals.isOnline){
					delete data.number;
					delete data.type;
					// data['createdAt'] = (new Date()).toISOString()
					data['isDeleted'] = false
				} else {
					data.number = data.number
				}
				console.log('p data',data);
				if(data.reservationsCount == null){
					data.reservationsCount = 0
				}
				this.api.create(data).then(res => {
					console.log('p res', res );
					
					this.form.reset()
					this.addModel.reservationsCount = 0
					this.ngOnInit()

					if (!this.globals.isOnline)
						this.globals.DBS.PATIENTS.hasOffflineData = true

					this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
					loading.hide()

					if (this.globals.isOnline) {
						this.addModel.number = res.nextNumber
						this.nextNumber = res.nextNumber
					}

					if (reserve) {
						this.router.navigate(['/dash/reservations'], {
							queryParams: {
								patientId: this.globals.isOnline ? res.data._id : res.id
							}
						})
					}
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
	}

	reset = () => {
		this.form.reset()
		setTimeout(() => {
			if (this.globals.isOnline)
				this.addModel.number = this.nextNumber
		}, 10)
	}

	cancel = () => {
		let num = this.addModel.number
		this.form.reset()
		this.addModel = {
			number: num,
			name_ar: null,
			name_en: null,
			age: null,
			gender: null,
			mobile: null,
			address: null,
			notes: '',
			nationality: null,
			nationalId:null,
			reservationsCount: 0,
			type: false
			// contract: null
		}
		setTimeout(() => {
			if (this.globals.isOnline)
				this.addModel.number = this.nextNumber
		}, 10)
		this.editId = null
		this.deleteId = null
	}

	filterData = () => {
		this.dataFiltered = JSON.parse(JSON.stringify(this.data))

		this.dataFiltered = this.dataFiltered.filter(d => {
			let dataString = JSON.stringify(d).toLowerCase()
			return dataString.indexOf("") > -1
		})

		this.dataFiltered = this.dataFiltered.sort((a, b) => {
			let _a = new Date(a.createdAt).getTime(), _b = new Date(b.createdAt).getTime()
			return this.sort == 1 ? (_b - _a) : (_a - _b)
		})

		this.dataFiltered = JSON.parse(JSON.stringify(this.dataFiltered))
	}

	nameKeyUp = () => this.globals.isOnline ? this.translating = true : this.translating = false

	numberKeyUp = () => this.globals.isOnline ? this.checkingNumber = true : this.checkingNumber = false

	mobileKeyUp = () => this.globals.isOnline ? this.checkingMobile = true : this.checkingMobile = false

	checkNumber = () => {
		if (this.globals.isOnline) {
			if (this.addModel.number && this.addModel.number.trim() != '')
				this.api.request(`${this.api.endPoints.patients}search/${this.globals.currentUser.branch}`, { type: 'number', filter: this.addModel.number }, RequestTypes.POST).then(res => {
					this.numberExists = res.exists
					this.checkingNumber = false
				})
			else this.checkingNumber = false
		}
		else this.checkingNumber = false
	}

	checkMobile = () => {
		if (this.globals.isOnline) {
			if (this.addModel.mobile && this.addModel.mobile.trim() != '')
				this.api.request(`${this.api.endPoints.patients}search/${this.globals.currentUser.branch}`, { type: 'mobile', filter: this.addModel.mobile.trim() }, RequestTypes.POST).then(res => {
					this.mobileExists = res.exists
					this.checkingMobile = false
				})
			else this.checkingMobile = false
		}
		else this.checkingMobile = false
	}

	async translateName() {
		if (this.globals.isOnline) {
			if (this.addModel.name_ar && this.addModel.name_ar.trim() != '')
				this.addModel.name_en = await translate(this.addModel.name_ar, 'en')
			else this.addModel.name_en = ''
			this.translating = false
		}
		else this.translating = false
	}

	ageChanged = () => {
		if (this.patientAge)
			this.addModel.age = moment().startOf('year').add(-this.patientAge, 'years').toDate()
		else this.addModel.age = null
	}

	bdChanged = (date) => {
		if (date)
			this.patientAge = Math.abs(moment(date).diff(moment(), 'years'))
		else this.patientAge = null
	}

	reserve = (patient) => {
		this.router.navigate(['/dash/reservations'], {
			queryParams: {
				patient: JSON.stringify(patient)
			}
		})
	}

	bills = (id) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.patients}bills/${id}`, {}, RequestTypes.GET).then(res => {
				if (res.data.length > 0) {
					this.userBills = res.data
					this.billsModal.show()
				}
				else {
					this.userBills = []
					this.globals.showToast('لا يوجد فواتير!', '', NotificationTypes.Info)
				}

				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	showBill = (id) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservationBill}${id}`, { branch: this.globals.currentUser.branch }, RequestTypes.POST).then(res => {
				res.data.services.forEach(service => {
					service.price = service.price - ((service.discount * service.price) / 100)
				})
				
				// console.log();
				// let data_vat_percent = res.data.map(i => {
				// 	console.log(i);
				// 	if (moment(i.date).isAfter('2020-07-05T00:00:00Z')) {
				// 		return { ...i, vat_percent: '15' }
				// 	} else {
				// 		return { ...i, vat_percent: '5' }
				// 	}
				// })

				this.currentInvoice = res.data
				if (moment(this.currentInvoice.bill.date).isAfter('2020-07-05T00:00:00Z')) {
					this.currentInvoice = {...this.currentInvoice, vat_percent: '15'}
				} else {
					this.currentInvoice = {...this.currentInvoice, vat_percent: '5'}
				}
				this.currentInvoice['vat'] = 0
				if (this.currentInvoice.reservation.patient && this.currentInvoice.reservation.patient.nationality != 'سعودى')
					this.currentInvoice['vat'] = moment(this.currentInvoice.bill.date).isAfter('2020-07-05T00:00:00Z') ?(this.getInvoiceServicesTotal() * 15) / 100 : (this.getInvoiceServicesTotal() * 5) / 100
				this.invoiceModal.show()
				loading.hide()
				console.log('this.currentInvoice',this.currentInvoice);
				
				// _data.bill['vat'] = moment(_data.bill.date).isAfter('2020-07-05T00:00:00Z') ? (this.getInvoiceServicesTotal(_data) * 15) / 100 : (this.getInvoiceServicesTotal(_data) * 5) / 100

			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	getInvoiceServicesTotal = () => {
		let total = 0;
		(this.currentInvoice ? this.currentInvoice.services : []).forEach(service => {
			total += service.price
		})

		return total
	}

	startInvoicePrint = () => {
		this.globals.loading(loading => {
			this.api.request('/assets/print-settings.json', null, RequestTypes.GET, false).then(data => {
				this.doPrint(data || this.globals.printSettings)
				loading.hide()
			}, () => {
				this.doPrint(this.globals.printSettings)
				loading.hide()
			})
		})
	}

	doPrint = (settings) => {
		let w = window.open()
		let services = ''
		let servicesTop = settings.servicesTop
		let servicesHeight = settings.servicesHeight

		this.currentInvoice.services.forEach((service, index) => {
			services = `${services}
			<p style="left: ${settings.serviceEmpty}; top: ${servicesTop + (index * servicesHeight)}px;"></p>
			<p style="left: ${settings.serviceName}; top: ${servicesTop + (index * servicesHeight)}px;">${service.service.name}</p>
			<p style="left: ${settings.servicePrice}; top: ${servicesTop + (index * servicesHeight)}px;">${service.price}</p>
			<p style="left: ${settings.serviceDiscount}; top: ${servicesTop + (index * servicesHeight)}px;">${service.discount}%</p>
			<p style="left: ${settings.serviceDiscountPrice}; top: ${servicesTop + (index * servicesHeight)}px;">${(service.discount * service.price) / 100}</p>
			<p style="left: ${settings.serviceTotalPrice}; top: ${servicesTop + (index * servicesHeight)}px;">${service.price}</p>`
		})

		if (this.currentInvoice.reservation.patient.nationality != 'سعودى') {
			services = `${services}
			<p style="left: ${settings.serviceEmpty}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;"></p>
			<p style="left: ${settings.serviceName}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;">ضريبة مضافة</p>
			<p style="left: ${settings.servicePrice}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;"></p>
			<p style="left: ${settings.serviceDiscount}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;">5%</p>
			<p style="left: ${settings.serviceDiscountPrice}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;"></p>
			<p style="left: ${settings.serviceTotalPrice}; top: ${servicesTop + (this.currentInvoice.services.length * servicesHeight)}px;">${this.currentInvoice.vat}</p>`
		}

		let invoiceRemaining = (this.getInvoiceServicesTotal() + this.currentInvoice.vat) - this.currentInvoice.bill.paidAmount

		w.document.write(`<html>
		<head>
			<meta charset="UTF-8">
			<style>
				body {
					margin: 0;
					padding: 0;
					font-size: 10pt;
				}

				* {
					box-sizing: border-box;
					-moz-box-sizing: border-box;
				}

				.page {
					width: 21cm;
					min-height: 7.42500cm;
					margin: 1cm auto;
					border: 1px white solid;
					border-radius: 5px;
					background: white;
				}

				.subpage {
					position: relative;
					height: 7.42500cm;
				}

				@page {
					size: A4;
					margin: 0;
				}

				@media print {
					.page {
						margin: 0;
						border: initial;
						border-radius: initial;
						width: initial;
						min-height: initial;
						box-shadow: initial;
						background: initial;
						page-break-after: always;
					}
				}

				p {
					position: absolute;
				}
			</style>
		</head>
		
		<body>
			<div class="book">
				<div class="page">
					<div class="subpage">
						<p style="left: ${settings.bill.left}; top: ${settings.bill.top};">
							${this.currentInvoice.bill.number || '-'}
						</p>
						<p style="left: ${settings.patientName.left}; top: ${settings.patientName.top};">
							${this.currentInvoice.reservation.patient.name_ar}
						</p>
						<p style="left: ${settings.patientNumber.left}; top: ${settings.patientNumber.top};">
							${this.currentInvoice.reservation.patient.number || '-'}
						</p>
		
						<p style="left: ${settings.date.left}; top: ${settings.date.top};">
							${moment().format('LL')}
						</p>
						<p style="left: ${settings.time.left}; top: ${settings.time.top};">
							${moment().format('hh:mm A')}
						</p>
						<p style="left: ${settings.doctor.left}; top: ${settings.doctor.top};">
							${this.currentInvoice.reservation.doctor.name}
						</p>
		
						${services}
		
						<p style="left: ${settings.username.left}; top: ${settings.username.top};">
							${this.currentInvoice.bill.user.name}
						</p>
						<p style="left: ${settings.paidAmount.left}; top: ${settings.paidAmount.top};">
							${this.currentInvoice.bill.paidAmount}
						</p>
		
						<p style="left: ${settings.invoiceTotal.left}; top: ${settings.invoiceTotal.top};">
							${this.getInvoiceServicesTotal() + this.currentInvoice.vat}
						</p>
						<p style="left: ${settings.invoiceRemaining.left}; top: ${settings.invoiceRemaining.top};">
							${invoiceRemaining < 0 ? 0 : invoiceRemaining}
						</p>
					</div>
				</div>
			</div>
		</body>
		</html>`)

		w.print()
		w.close()
	}

	reservations = (id) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}patient/${id}`, {}, RequestTypes.GET).then(res => {

				if (res.data.length > 0) {
					this.patientReservations = res.data.map(d => <Object>{ ...d.reservation, services: d.services })
					this.reservationsModal.show()
				}
				else {
					this.globals.showToast('لا يوجد حجوزات!', '', NotificationTypes.Info)
					// loading.hide()
				}
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}
}
