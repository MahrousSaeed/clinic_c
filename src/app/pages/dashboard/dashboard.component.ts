import { Component, OnInit, ViewChild } from '@angular/core';
import { Globals, NotificationTypes, Events } from 'src/app/services/globals';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { NgForm } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap';
import { log } from 'util';
declare var moment: any

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	@ViewChild('updateModal', { static: true }) updateModal: ModalDirective
	@ViewChild('invoiceModal', { static: true }) invoiceModal: ModalDirective
	@ViewChild('gotoModal', { static: true }) gotoModal: ModalDirective
	@ViewChild(NgForm, { static: true }) form: NgForm
	servicesMainTotal:number 
	currentDate = new Date()
	disFlag:boolean = false
	total:number
	mainTotal:number
	show = false
	isVat:boolean = false
	totalAfterVat:number
	dashboard = null

	doctors = []
	allReservations: Array<any> = []
	reservations: Array<any> = []
	statues = []
	services = []

	currentDoctor = null

	notCompletedStatus = '5c8e1fd01c5c323f54e0a804'
	completedStatus = '5c8e1fd41c5c323f54e0a805'

	currentService = null
	currentInvoice = null
	currentReservation = null

	addModel = {
		complain: null,
		diagnosis: null,
		notes: null,
		services: [],
	}

	payment = {
		cash: false,
		cashAmount: null,
		network: false,
		networkAmount: null,
	}

	gotoId = null

	constructor(public api: ApiService, public globals: Globals) {
		api.init(api.endPoints.reservations)
	}

	ngOnInit() {
		this.updateModal.config = { backdrop: 'static', keyboard: false }
		this.invoiceModal.config = { backdrop: 'static', keyboard: false }

		this.doctors = []
		this.reservations = []

		this.api.request(this.api.endPoints.reservationsStatuses, {}, RequestTypes.POST).then(res => {
			this.statues = res.data
		})

		this.api.request(`${this.api.endPoints.reports}dashboard/${this.globals.currentUser.branch}`, {}, RequestTypes.POST).then(res => {
			this.dashboard = res.data			
		})

		this.getReservations()
	}

	getReservations = () => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}${this.globals.currentUser.branch}`, { type: 'today' }, RequestTypes.PATCH).then(res => {
				if (!this.globals.isOnline)
					return
					
				res.data.forEach(r => {
					if (r.reservation.doctor && r.reservation.patient) {
						r.reservation.patient.age = Math.abs(moment(r.reservation.patient.age).diff(moment(), 'years'))
						if (!this.doctors.some(d => d._id == r.reservation.doctor._id))
							this.doctors.push({ name: r.reservation.doctor.name, _id: r.reservation.doctor._id })
					}
				})
				this.allReservations = res.data.map(r => <Object>{ ...r.reservation, servicesCount: r.servicesCount })
				if (this.doctors.length > 0) {
					this.currentDoctor = this.doctors[0]._id
					this.reservations = res.data.filter(r => r.reservation.doctor ? (r.reservation.doctor._id == this.currentDoctor) : false)
												.map(r => <Object>{ ...r.reservation, servicesCount: r.servicesCount })
												console.log(this.reservations);
												
				}

				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	selectDoctor = (_id) => {
		this.currentDoctor = _id
		this.reservations = this.allReservations.filter(r => r.doctor ? (r.doctor._id == this.currentDoctor) : false)
	}

	changeStatus = (res_id, status, index) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}${res_id}`, { status }, RequestTypes.POST).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.reservations[index].status = res.data
				this.globals.showToast('تم تغيير الحالة بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	complete = (res) => {
		this.total = 0
		this.globals.loading(loading => {
			this.services = []
			this.currentReservation = res

			this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
				this.services = res.data.map(s => <Object>{ value: s._id, title: s.name, price: s.price })
			})

			this.api.request(`${this.api.endPoints.reservations}${this.currentReservation._id}`, {}, RequestTypes.GET).then(res => {
				if (!this.globals.isOnline)
					return
					
				this.form.reset()
				this.addModel = {
					complain: res.data.reservation.complain,
					diagnosis: res.data.reservation.diagnosis,
					notes: res.data.reservation.notes,
					services: res.data.services,
					// paymentType: res.data.reservation.paymentType && res.data.reservation.paymentType !== undefined ? res.data.reservation.paymentType : 'كاش'
				}
				let sumServicesPrices = 0
			    this.addModel.services.map(item => {
					return item.price
				}).forEach(price => {
					sumServicesPrices += price
				})
				this.servicesMainTotal = sumServicesPrices
				if(this.currentReservation.patient.nationality == "سعودى"){
					this.totalAfterVat = this.servicesMainTotal
					this.isVat = false
				} else {
					this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal*5)/100)
					this.isVat = true
					
				}
				setTimeout(() => {
					this.calcTotalAfterDiscount()
				}, 1);
				this.payment = {
					cash: false,
					cashAmount: null,
					network: false,
					networkAmount: null
				}
				if (res.data.reservation.paymentType) {
					let cashIndex = res.data.reservation.paymentType.indexOf('cash')
					let networkIndex = res.data.reservation.paymentType.indexOf('network')

					if (cashIndex > -1) {
						this.payment.cash = true
						this.payment.cashAmount = res.data.reservation.paymentTypeValues[cashIndex]
					}
					if (networkIndex > -1) {
						this.payment.network = true
						this.payment.networkAmount = res.data.reservation.paymentTypeValues[networkIndex]
					}
				}

				loading.hide()
				this.updateModal.show()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}
	calcTotalAfterDiscount = () => {
		this.servicesMainTotal = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
			serviceTotal.forEach(servicePrice=>{
				this.servicesMainTotal += Number(servicePrice.innerHTML)
			})
		
		this.disFlag = true
		this.show = false
	}

	addService = () => {
		let service = this.services.find(s => s.value == this.currentService)

		this.addModel.services.push({
			reservation: this.currentReservation._id,
			service: service.value,
			name: service.title,
			price: service.price,
			discount: 0,
		})

		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
			serviceTotal.forEach(servicePrice=>{
				sum += Number(servicePrice.innerHTML)
			})
	
			this.servicesMainTotal = sum
			if(this.currentReservation.patient.nationality == "سعودى"){
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal*5)/100)
				this.isVat = true
				
			}
		}, 200);
	}
	checktotal = () =>{
		if(this.payment.cash == true && this.payment.network ==false ){
			this.total = this.payment.cashAmount
			
		} else if(this.payment.cash == false && this.payment.network == true ){
			this.total = this.payment.networkAmount
		} else if(this.payment.cash == true && this.payment.network == true) {
			this.total = this.payment.networkAmount + this.payment.cashAmount
		}

		if(this.disFlag == false){
			if(this.total > this.getServicesTotal()){
				this.show = true
			} else {
				this.show = false
			}
		} else {
			this.show = false
		}
	}

	submitForm = (print = false) => {
		this.globals.loading(loading => {
			let data = { ...this.addModel, paymentType: [], paymentTypeValues: [] }

			if (this.payment.cash) {
				data.paymentType.push('cash')
				data.paymentTypeValues.push(this.payment.cashAmount)
			}
			if (this.payment.network) {
				data.paymentType.push('network')
				data.paymentTypeValues.push(this.payment.networkAmount)
			}

			this.api.request(`${this.api.endPoints.reservations}complete/${this.currentReservation._id}`, data, RequestTypes.PUT).then(() => {
				if (!this.globals.isOnline)
					return
					
				this.ngOnInit()
				this.globals.showToast('تم تكملة البيانات بنجاح!', '', NotificationTypes.Success)
				this.form.reset()
				this.updateModal.hide()
				loading.hide()

				if (print)
					setTimeout(() => {
						this.printInvoice(this.currentReservation._id)
					}, 500)
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	whenDelete = () => {
		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
			serviceTotal.forEach(servicePrice=>{
				sum += Number(servicePrice.innerHTML)
			})
	
			this.servicesMainTotal = sum
			if(this.currentReservation.patient.nationality == "سعودى"){
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal*5)/100)
				this.isVat = true
				
			}
		}, 200)
	}

	printInvoice = (id) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservationBill}${id}`, { branch: this.globals.currentUser.branch }, RequestTypes.POST).then(res => {
				if (!this.globals.isOnline)
					return
					
				res.data.services.forEach(service => {
					service.price = service.price - ((service.discount * service.price) / 100)
				})
				this.currentInvoice = res.data
				this.currentInvoice['vat'] = 0
				if (this.currentInvoice.reservation.patient.nationality != 'سعودى')
					this.currentInvoice['vat'] = (this.getInvoiceServicesTotal() * 5) / 100
				this.invoiceModal.show()
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	cancelInvoice = () => {
		this.invoiceModal.hide()
		this.doctors = []
		this.reservations = []
		this.getReservations()
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

	hasOngoing = (id) => this.allReservations.some(r => r.doctor ? (r.doctor._id == id && r.status._id == this.notCompletedStatus) : false)


	getServicesTotal = () => {
		let total = 0
		this.addModel.services.forEach(service => {
			total += service.price
		})
		this.mainTotal = total
		return total
	}
	getInvoiceServicesTotal = () => {
		let total = 0;
		(this.currentInvoice ? this.currentInvoice.services : []).forEach(service => {
			total += service.price
		})

		return total
	}

	gotoDoctor = (res, force = false) => {
		if (!force)
			this.gotoId = res._id

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}goto/${res ? res._id : this.gotoId}`, { force }, RequestTypes.POST).then(res => {
				if (!this.globals.isOnline)
					return
					
				if (res.type == 'exists' && !force) {
					this.gotoModal.show()
				}
				else {
					this.globals.showToast('تم تغيير الحالة بنجاح!', '', NotificationTypes.Success)
					this.getReservations()
				}

				if (force)
					this.gotoId = null

				loading.hide()
			}, () => {
				this.gotoId = null
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

}
