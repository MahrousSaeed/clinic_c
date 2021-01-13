import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from '../../services/api/api.service';
import { Globals, NotificationTypes, Events } from '../../services/globals';

@Component({
	selector: 'app-doctor-screen',
	templateUrl: './doctor-screen.component.html',
	styleUrls: ['./doctor-screen.component.scss']
})
export class DoctorScreenComponent implements OnInit {
	@ViewChild(NgForm, { static: false }) form: NgForm
	services: any = []
	isVat: boolean = true
	currentService = null
	allReservations: any = []
	finshed_revealed: any = []
	new_reservations: any = []
	current_reservation: any = []
	currantYear = new Date().getFullYear()

	mainTotal: any
	totalAfterVat: number
	servicesMainTotal: number

	addModel = {
		complain: null,
		diagnosis: null,
		notes: null,
		services: []
	}

	currentPatient: any = []
	currentPatientHistory: any

	constructor(private api: ApiService, private globals: Globals) { }

	ngOnInit() {
		this.globals.socket.on('doctor', data => {
			this.globals.showToast('تم انشاء حجز جديد ', '', NotificationTypes.Info)
			this.allReservations.push(data.data.data)
			this.finshed_revealed = this.allReservations.filter(item => item.status._id === '5c8e1fd41c5c323f54e0a805')
			this.new_reservations= this.allReservations.filter(item => item.status._id === '5c8e1fc11c5c323f54e0a802')
			this.current_reservation= this.allReservations.filter(item => item.status._id === '5c8e1fd01c5c323f54e0a804')
		})

		this.globals.socket.on('currentPatient', () => {
			this.ngOnInit()
		})

		this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
			this.services = res.data.map(s => <Object>{ value: s._id, title: s.name, price: s.price })
		})

		this.api.request(this.api.endPoints.allDoctorReservations, {}, RequestTypes.GET).then(res => {
			this.allReservations = res.data
			console.log('this.allReservations ', this.allReservations);
			//"5c8e1fd41c5c323f54e0a805" ==> done 
			// "5c8e1fc11c5c323f54e0a802" ==> new 
			// 5c8e1fd01c5c323f54e0a804  => now
			this.finshed_revealed = this.allReservations.filter(item => item.status._id === '5c8e1fd41c5c323f54e0a805')
			this.new_reservations= this.allReservations.filter(item => item.status._id === '5c8e1fc11c5c323f54e0a802')
			this.current_reservation= this.allReservations.filter(item => item.status._id === '5c8e1fd01c5c323f54e0a804')



		})

		this.globals.loading(loading => {
			this.api.request(this.api.endPoints.currentReservation, {}, RequestTypes.GET).then(res => {
				this.currentPatient = res.data
				this.addModel = {
					complain: res.data.reservation.complain,
					diagnosis: res.data.reservation.diagnosis,
					notes: res.data.reservation.notes,
					services: res.data.services
				}
				this.addModel.services = res.data.services

				if (this.currentPatient.reservation) {
					this.api.request(`${this.api.endPoints.currentReservationHistory + '/' + this.currentPatient.reservation.patient._id}`, {}, RequestTypes.PATCH).then(res => {
						if (!this.globals.isOnline)
							return

						this.currentPatientHistory = res.data
						let sum = 0
						let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
						serviceTotal.forEach(servicePrice => {
							sum += Number(servicePrice.innerHTML)
						})

						this.servicesMainTotal = sum
						if (this.currentPatient.reservation.patient.nationality == "سعودى") {
							this.totalAfterVat = this.servicesMainTotal
							this.isVat = false
						} else {
							this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 5) / 100)
							this.isVat = true
						}

						loading.hide()
					})
				}
				else loading.hide()
			})
		})
	}

	submitForm = () => {
		this.globals.loading(loading => {
			this.api.request(`${'doctor/reservations/complete/' + this.currentPatient.reservation._id}`, this.addModel, RequestTypes.PUT).then((res) => {
				if (!this.globals.isOnline)
					return

				if (this.globals.isOnline)
					this.globals.socket.emit('sendToReceptions', { userId: res.data.user, data: res.data })
				this.currentPatient = []
				this.currentPatientHistory = []
				this.globals.showToast('تم الارسال بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	getHistory = () => {
		// if(this.currentPatient) {
		// 	this.api.request(`${this.api.endPoints.currentReservationHistory + '/' +this.currentPatient.patient._id}`, {}, RequestTypes.PATCH).then(res => {
		// 		this.currentPatientHistory = res.data
		// 	})
		// }	
	}

	addService = () => {
		let service = this.services.find(s => s.value == this.currentService)

		this.addModel.services.push({
			reservation: this.currentPatient.reservation._id,
			service: service.value,
			name: service.title,
			price: service.price,
			discount: 0,
		})

		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
			serviceTotal.forEach(servicePrice => {
				sum += Number(servicePrice.innerHTML)
			})

			this.servicesMainTotal = sum
			if (this.currentPatient.reservation.patient.nationality == "سعودى") {
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 5) / 100)
				this.isVat = true
			}
		}, 200)
	}

	getServicesTotal = () => {
		let total = 0
		this.addModel.services.forEach(service => {
			total += service.price
		})
		this.mainTotal = total

		return total
	}

	calcTotalAfterDiscount = () => {
		this.servicesMainTotal = 0
		let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
		serviceTotal.forEach(servicePrice => {
			this.servicesMainTotal += Number(servicePrice.innerHTML)
		})

		if (this.currentPatient.reservation.patient.nationality == "سعودى") {
			this.totalAfterVat = this.servicesMainTotal
			this.isVat = false
		} else {
			this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 5) / 100)
			this.isVat = true
		}
	}

	whenDelete = (i = null) => {
		if (i != null) {
			this.addModel.services.splice(i, 1)
			let servicesCopy = JSON.parse(JSON.stringify(this.addModel.services))
			this.addModel.services = []
			this.addModel.services = servicesCopy
		}

		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))
			serviceTotal.forEach(servicePrice => {
				sum += Number(servicePrice.innerHTML)
			})

			this.servicesMainTotal = sum
			if (this.currentPatient.reservation.patient.nationality == "سعودى") {
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 5) / 100)
				this.isVat = true
			}
		}, 200)
	}

}
