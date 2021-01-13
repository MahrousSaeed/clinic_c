import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes, Events } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { PageState } from 'ngx-paginate';
import {
	CalendarEvent,
	CalendarEventAction,
	CalendarEventTimesChangedEvent,
	CalendarView
} from 'angular-calendar';
declare var moment: any
import Swal from 'sweetalert2'

@Component({
	selector: 'app-reservations',
	templateUrl: './reservations.component.html',
	styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('invoiceModal', { static: true }) invoiceModal: ModalDirective
	@ViewChild('updateModal', { static: true }) updateModal: ModalDirective
	@ViewChild('gotoModal', { static: true }) gotoModal: ModalDirective
	@ViewChild(NgForm, { static: true }) form: NgForm
	doctorbusy: boolean = true
	total: number
	mainTotal: number
	servicesMainTotal: number
	isVat: boolean = false
	totalAfterVat: number
	doctorRoom: boolean = false
	paymentLess: boolean = false
	endTimeFlag: boolean = false
	timeInputs_flag: boolean = false
	servicesMainTotal1: any
	doctor_schedule = []
	selected_date_times
	offlineMinTime
	disFlag: boolean = false
	doctor_changed: boolean = false
	doctorEvents: CalendarEvent[] = []
	doctor_days_of_week = []

	currentDate = new Date()
	show = false
	data: Array<any> = []
	dataFiltered: Array<any> = []
	random = Math.random()
	addModel = {
		patient: null,
		doctor: null,
		date: null,
		time: null,
		end_time: null,
		notes: '',
		branch: this.globals.currentUser.branch,
		services: []
	}

	filterDoctor = 'all'
	filterPatient = 'all'
	filterRange: Date[] = null

	filterNumber: string = ''
	filterMobile: string = ''
	filterName: string = ''
	sort: number = 1

	editId = null
	editTime = null
	editLoading = null

	deleteId = null

	reservationType = 1

	patients = []
	patients2 = []
	doctors = []
	doctors2 = []
	statues = []

	patientsOffline = []

	daysDisabled = []
	doctorDays: Array<{ value, value2, title, hours }> = []

	hours = []

	firstTime = true

	paramPatient = null
	hadParam = false

	addCompleteModel = {
		complain: null,
		diagnosis: null,
		notes: null,
		services: []
	}

	currentService = null
	currentInvoice = null
	currentReservation = null

	services = []

	minutesInterval = 10

	payment = {
		cash: false,
		cashAmount: null,
		network: false,
		networkAmount: null,
	}

	gotoId = null

	page: PageState = {
		currentPage: 1,
		numberOfPages: 1,
		pageSize: 1,
		totalItems: 1
	}

	pageFilter: PageState = {
		currentPage: 1,
		numberOfPages: 1,
		pageSize: 1,
		totalItems: 1
	}

	$endPatientSubscriber = null

	constructor(private api: ApiService,
		public globals: Globals,
		public activatedRoute: ActivatedRoute,
		public router: Router,
		private changeDetection: ChangeDetectorRef
	) {
		api.init(api.endPoints.reservations)
		activatedRoute.queryParams.subscribe(params => {
			if (params['patient']) {
				this.hadParam = true
				this.paramPatient = JSON.parse(params['patient'])

				router.navigate([], { queryParams: { patient: null }, queryParamsHandling: 'merge' })
			}
		})
	}

	ngOnInit() {
		this.reservationType == 1

		if (this.$endPatientSubscriber == null) {
			this.$endPatientSubscriber = Events.subscribe('end patient', res => {
				this.dataFiltered.forEach(item => {
					if (item.patient._id === res.patient) {
						item.status._id = '5cb8c2b9bfaae1089bda11e2'
					}
				})
				// console.log('this.dataFiltered', this.dataFiltered);

			})
		}
		// console.log('this.dataFiltered',this.dataFiltered);


		this.deleteModal.config = { backdrop: 'static', keyboard: false }
		this.updateModal.config = { backdrop: 'static', keyboard: false }
		this.invoiceModal.config = { backdrop: 'static', keyboard: false }

		if (this.paramPatient) {
			this.patients = [{ value: this.paramPatient._id, title: this.paramPatient.name_ar, data: this.paramPatient }]
			this.patients2 = [{ value: this.paramPatient._id, title: this.paramPatient.name_ar, data: this.paramPatient }]
			this.addModel.patient = this.paramPatient._id
		}

		if (!this.globals.isOnline) {
			this.api.request(`${this.api.endPoints.patients}${this.globals.currentUser.branch}?offline_only=true`, null, RequestTypes.PATCH).then(res => {
				console.log('res ofline', res);

				this.patientsOffline = res.rows.map(r => r.doc)
			})
		}

		this.api.request(`${this.api.endPoints.patients}${this.globals.currentUser.branch}`, null, RequestTypes.PATCH).then(res => {
			console.log('patients',res);

			this.patients = []
			this.patients2 = []

			if (this.globals.isOnline)
				res = res.data
			else res = res.rows.map(r => r.doc)

			if (!this.globals.isOnline && res.length > 0)
				this.globals.DBS.PATIENTS.hasOffflineData = true

			this.patients = res.map(r => <Object>{ value: r._id, title: r.name_ar, data: r })
			this.patients2 = res.map(r => <Object>{ value: r._id, title: r.name_ar, data: r })
			console.log('patientsOffline',this.patientsOffline);
			
			this.patients = [...this.patients, ...this.patientsOffline.map(r => <Object>{ value: r._id, title: r.name_ar, data: r })]
			this.patients2 = [...this.patients2, ...this.patientsOffline.map(r => <Object>{ value: r._id, title: r.name_ar, data: r })]
		})

		this.api.request(`${this.api.endPoints.doctors}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			if (res.data)
				res = res.data
			else res = res.rows.map(r => r.doc)

			this.doctors = res.map(r => <Object>{ value: r._id, title: r.name, data: r })
			this.doctors2 = res.map(r => <Object>{ value: r._id, title: r.name, data: r })
		})

		// this.api.request(this.api.endPoints.reservationsStatuses, {}, RequestTypes.POST).then(res => {
		// 	this.statues = res.data
		// })

		this.getReservations(1, 1)

		//Nearest 10 minutes
		// this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
		// this.addModel.date = new Date()

		this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
			if (res.data)
				res = res.data
			else res = res.rows.map(r => r.doc)

			this.services = res.map(s => <Object>{ value: s._id, title: s.name, price: s.price, data: s })
		})

		if (this.globals.NetworkSubscribers.reservations.online == null)
			this.globals.NetworkSubscribers.reservations.online = Events.subscribe('online', () => {
				if (this.globals.isOnline && this.router.url == "/dash/reservations")
					if (confirm('يوجد إتصال بالنترنت, هل تريد إعادة تحميل البيانات؟'))
						this.ngOnInit()
			})
		if (this.globals.NetworkSubscribers.reservations.offline == null)
			this.globals.NetworkSubscribers.reservations.offline = Events.subscribe('offline', () => {
				if (!this.globals.isOnline && this.router.url == "/dash/reservations")
					if (confirm('لا يوجد إتصال بالإنترنت, هل تريد تحميل الداتا الغير متصلة بالإنترنت؟'))
						this.ngOnInit()
			})
	}

	pageChange(pageState: PageState) {
		this.page = pageState
		this.getReservations(this.reservationType, pageState.currentPage)
	}

	pageChangeFilter(pageState: PageState) {
		this.pageFilter = pageState
		this.getReservations(3, pageState.currentPage)
	}
	patientChanged = (e) => {
		console.log(e);
		
	}

	submitForm = () => {
		this.addModel.branch = this.globals.currentUser.branch
		this.addModel.end_time = this.addModel.end_time.replace(/\s/g, '');
		this.addModel.time = this.addModel.time.replace(/\s/g, '');
		if (this.editId) {
			this.globals.loading(loading => {
				let data = { ...this.addModel, ...(this.globals.isOnline ? {} : { offline: true }) }

				if (!this.globals.isOnline) {
					data.doctor = this.doctors.find(d => d.value == data.doctor).data
					data.patient = this.patients.find(d => d.value == data.patient).data
					data.services = data.services.map(s => <Object>{ ...s, service: this.services.find(d => d.value == s._id).data })
				}

				this.api.update(this.editId, data).then(() => {
					this.form.reset()
					this.addModel.notes = ''
					this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
					this.addModel.date = new Date()
					this.addModel.services = []

					this.editId = null
					this.doctorDays = []
					this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)

					this.globals.showToast('تم التعديل بنجاح!', '', NotificationTypes.Success)
					loading.hide()
				}, e => {
					loading.hide()
					if (e.error.type == 'exists')
						this.globals.showToast('يوجد حجز بنفس الميعاد!', '', NotificationTypes.Error)
					else
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			})
		}
		else {
			this.addModel.date = moment(this.addModel.date).format('YYYY-MM-DD')
			// console.log(this.addModel.date);

			this.globals.loading(loading => {
				let data = { ...this.addModel, ...(this.globals.isOnline ? {} : { offline: true }) }

				if (!this.globals.isOnline) {
					// delete data['offlineID']
					data.doctor = this.doctors.find(d => d.value == data.doctor).data
					data.patient = this.patients.find(d => d.value == data.patient).data
					data.services = data.services.map(s => <Object>{ ...s, service: this.services.find(d => d.value == s._id).data })
				}
				console.log(data);

				this.api.create(data).then((res) => {
					console.log(res);

					if (this.globals.isOnline)
						this.globals.socket.emit('patientReservation', { userId: res.data.doctor._id, data: res })

					if (!this.globals.isOnline)
						this.globals.DBS.RESERVATIONS.hasOffflineData = true

					this.form.reset()
					this.addModel.notes = ''
					this.addModel.services = []
					this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
					this.addModel.date = new Date()

					this.doctorDays = []
					this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)

					this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
					loading.hide()
				}, e => {
					// console.log(e);

					if (e.error.message == 'Reservation conflict with another patient') {
						Swal.fire({
							position: 'center',
							icon: 'error',
							title: 'خطأ ...',
							html: `يوجد حجز للعميل <strong style="color:red" > ${e.error.data.patient.name_ar}</strong> في هذا الميعاد <br> البداية: ${moment.utc(e.error.data.startDate).format('hh:mm A')} النهاية:${moment.utc(e.error.data.endDate).format('hh:mm A')} <br> برجاء تغير الميعاد`
						})
					} else if (e.error.message == 'doctor in a vacation in this date do you want to force it') {
						Swal.fire({
							title: 'هل انت متأكد؟',
							text: "هذا الطبيب في اجازة الان هل تريد الاستمرار!",
							icon: 'warning',
							showCancelButton: true,
							confirmButtonColor: '#3085d6',
							cancelButtonColor: '#d33',
							confirmButtonText: 'نعم!',
							cancelButtonText: 'الغاء'
						}).then((result) => {
							console.log('result', result);
							if (result.value) {
								let forcedata = { ...data, isForce: true }
								this.api.create(forcedata).then((res) => {
									console.log(res);

									if (this.globals.isOnline)
										this.globals.socket.emit('patientReservation', { userId: res.data.doctor._id, data: res })

									if (!this.globals.isOnline)
										this.globals.DBS.RESERVATIONS.hasOffflineData = true

									this.form.reset()
									this.addModel.notes = ''
									this.addModel.services = []
									this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
									this.addModel.date = new Date()

									this.doctorDays = []
									this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)

									this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
								}, () => {
									this.globals.showToast('حدث خطا برجاء المحاولة مرة اخري !', '', NotificationTypes.Error)

								})
							}

							if (result.value) {
								//   Swal.fire(
								// 	'Deleted!',
								// 	'Your file has been deleted.',
								// 	'success'
								//   )
							}
						})
					}
					else if (e.error.message == 'end date smaller than start date or equal') {
						Swal.fire({
							position: 'center',
							icon: 'error',
							title: 'خطأ ...',
							text: 'تاريخ انتهاء الحجز يجب ان يكون اكبر من تاريخ البداية!'
						})
					} else {
						this.globals.showToast('حدث خطا برجاء المحاولة مرة اخري !', '', NotificationTypes.Error)
					}
					loading.hide()

				})
			})
		}
	}

	cancel = () => {
		this.form.reset()
		this.addModel = {
			branch: this.globals.currentUser.branch,
			date: new Date(),
			doctor: null,
			notes: '',
			end_time: null,
			patient: null,
			time: null,
			services: []
		}
		this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
		this.editId = null
		this.deleteId = null
	}

	resetForm = () => {
		this.form.reset()
		this.doctorDays = []
		this.addModel.notes = ''
		this.addModel.time = moment(Math.ceil((+moment()) / (+moment.duration(this.minutesInterval, "minutes"))) * (+moment.duration(this.minutesInterval, "minutes"))).locale('en').format('hh:mm A')
		this.addModel.date = new Date()
	}

	doctorChanged = (id, _callback = null) => {
		this.doctor_changed = true
		if (id) {
			if (this.globals.isOnline) {
				console.log('is online');

				this.globals.loading(loading => {
					// available times
					this.api.request(`${this.api.endPoints.get_doctor_dates}${id}`, {}, RequestTypes.GET).then(res => {
						console.log(res);
						if (res.schedule.length === 0) {
							this.addModel.time = null
							this.addModel.end_time = null
							this.timeInputs_flag = true
						} else {
							this.timeInputs_flag = false
						}
						console.log(this.timeInputs_flag);

						this.doctor_schedule = res.schedule
						this.doctorDays = res.schedule.map(d => {
							let day = { value: 0, value2: 0, start_time: '', end_time: '', title: '', hours: null }

							if (d.day_of_week == 1)
								day = { value: 6, value2: 1, start_time: d.start_time, end_time: d.end_time, title: 'السبت', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 2)
								day = { value: 0, value2: 2, start_time: d.start_time, end_time: d.end_time, title: 'الأحد', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 3)
								day = { value: 1, value2: 3, start_time: d.start_time, end_time: d.end_time, title: 'الإثنين', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 4)
								day = { value: 2, value2: 4, start_time: d.start_time, end_time: d.end_time, title: 'الثلاثاء', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 5)
								day = { value: 3, value2: 5, start_time: d.start_time, end_time: d.end_time, title: 'الأربعاء', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 6)
								day = { value: 4, value2: 6, start_time: d.start_time, end_time: d.end_time, title: 'الخميس', hours: this.makeHoursList(d) }
							else if (d.day_of_week == 7)
								day = { value: 5, value2: 7, start_time: d.start_time, end_time: d.end_time, title: 'الجمعة', hours: this.makeHoursList(d) }

							return day
						}).sort((a, b) => a.value2 > b.value2 ? 1 : -1)

						// console.log(this.doctorDays);

						this.daysDisabled = [0, 1, 2, 3, 4, 5, 6].filter(d => this.doctorDays.findIndex(_d => _d.value == d) < 0)

						// جدول المواعيد المتاحة 
						let dates = res.doctorDates.map(item => {
							return { ...item._id }
						}).map(i => {
							// const startDat = moment(i.startDate + i.time.toLowerCase(), 'YYYY-MM-DDLT').toISOString()
							const full_date = i.year + '-' + i.month + '-' + i.day
							const date = moment(full_date);
							let dow = date.day();
							if (dow == 6) {
								dow = 1
							} else {
								dow += 2
							}

							return {
								start: new Date(moment(full_date + ' ' + i.time, 'YYYY-MM-DDLT').toISOString()),
								end: new Date(moment(i.endDate).subtract(2, 'h')),
								date: full_date,
								dow: dow,
								time: i.time,
								end_time: moment(i.endDate).format('hh:mm A')

							}

						})
						// console.log('datesdatesdates',dates);

						let doc_events = []
						let schedule = res.schedule.map(i => ({ ...i }))
						// moment.locale('ar')
						console.log('datesdatesdates', dates);
						// start: moment(item.start).subtract(2,'h').toISOString(),
						// end: moment(item.end).subtract(2,'h').toISOString() ,
						dates.forEach(item => {
							doc_events.push({
								start: item.start,
								end: item.end,
								title: `
								<span class="schedule_item">
									<span>مواعيد محجوزة </span>
									<span>   من  <span> ${moment(item.start).format('hh:mm A')} </span> </span>
									<span>  الي <span>  ${moment(item.end).format('hh:mm A')} </span> </span>
								</span>
								
								`,
								color: {
									primary: '#ad2121',
									secondary: '#FAE3E3'
								}
							})

							schedule.forEach(it => {
								if (item.dow === it.day_of_week) {
									doc_events.push({
										start: new Date(moment(item.date + ' ' + it.start_time, 'YYYY-MM-DDLT').toISOString()),
										end: new Date(moment(item.date + ' ' + it.end_time, 'YYYY-MM-DDLT').toISOString()),
										title: 'مواعيد متاحة',
										color: {
											primary: '#1e90ff',
											secondary: '#D1E8FF'
										}
									})
								}

							})
							// current

						})
						console.log('doc_events', doc_events);

						// console.log('dates', dates);
						//  let by_month = this.globals.groupBy(dates, 'month')

						this.globals.doctor_events.next(doc_events)


						// console.log('xxxxxxxxx', x);


						this.doctor_days_of_week = res.schedule.map(item => item.day_of_week)

						loading.hide()
					}, () => {
						loading.hide()
					})
				})
			}
			else {
				console.log('is offline');

				this.timeInputs_flag = false
				console.log(this.timeInputs_flag);

				if (_callback)
					_callback()
			}
		}
	}

	filterReservations = (e, filterName, filterValue) => {
		if (e.which == 13) {
			this.globals.loading(loading => {
				let filters = {}
				filters[filterName] = filterValue

				this.api.request(`${this.api.endPoints.reservationsFilter}${this.globals.currentUser.branch}`, filters, RequestTypes.POST).then(res => {
					this.data = res.data.map(r => <Object>{ ...r.reservation, servicesCount: r.servicesCount })

					this.data.forEach(reservation => {
						reservation.date = moment(`${reservation.date.split('T')[0]} ${reservation.time}`).toISOString()
					})

					this.dataFiltered = Object.assign([], this.data)
					this.dataFiltered = this.dataFiltered.map(res => {
						return { ...res, startTime: moment.utc(res.startDate), endTime: moment.utc(res.endDate) }
					})

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

	getReservations = (type, page) => {
		this.globals.loading(loading => {
			if (type == 3) {
				if (!this.firstTime) {
					this.firstTime = false

					this.data = []
					this.dataFiltered = []
					this.reservationType = type

					let filters = { filterName: this.filterName, filterNumber: this.filterNumber, filterMobile: this.filterMobile } //this.filter
					if (this.filterDoctor && this.filterDoctor != 'all')
						filters['doctor'] = this.filterDoctor
					if (this.filterPatient && this.filterPatient != 'all')
						filters['patient'] = this.filterPatient
					if (this.filterRange && this.filterRange != [])
						filters['dates'] = this.filterRange

					filters['all'] = true

					this.api.request(`${this.api.endPoints.reservationsFilter}${this.globals.currentUser.branch}?page=${page}`, filters, RequestTypes.POST).then(res => {
						this.data = res.data.filter(r => r.reservation.patient && r.reservation.doctor)
							.map(r => <Object>{ ...r.reservation, servicesCount: r.servicesCount })

						this.data.forEach(reservation => {
							reservation.date = moment(`${reservation.date.split('T')[0]} ${reservation.time}`).toISOString()
						})

						this.dataFiltered = Object.assign([], this.data)
						this.dataFiltered = this.dataFiltered.map(res => {
							return { ...res, startTime: moment.utc(res.startDate).format('hh:mm A'), endTime: moment.utc(res.endDate).format('hh:mm A') }
						})
						// console.log(this.dataFiltered);


						this.pageFilter = {
							currentPage: res.meta.currentPage,
							numberOfPages: res.meta.pages,
							pageSize: res.meta.perPage,
							totalItems: res.meta.total
						}

						loading.hide()
					}, () => {
						loading.hide()
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
					})
				}
				else loading.hide()
			}
			else {
				this.data = []
				this.dataFiltered = []
				this.reservationType = type

				this.api.request(`${this.api.endPoints.reservations}${this.globals.currentUser.branch}?page=${page}`, this.reservationType == 1 ? { type: 'today', all: true } : { all: true }, RequestTypes.PATCH).then(res => {
					let meta
					if (res.data) {
						meta = res.meta
						res = res.data
					}
					else res = res.rows.map(r => r.doc)

					if (!this.globals.isOnline && res.length > 0)
						this.globals.DBS.RESERVATIONS.hasOffflineData = true

					if (this.globals.isOnline)
						this.data = res.map(r => <Object>{ ...r.reservation, servicesCount: r.servicesCount })
					else
						this.data = res.map(r => <Object>{ ...r, servicesCount: r.services.length })

					this.data.forEach(reservation => {
						reservation.date = moment(`${reservation.date.split('T')[0]} ${reservation.time}`).toISOString()
					})

					this.dataFiltered = Object.assign([], this.data)
					this.dataFiltered = this.dataFiltered.map(res => {
						return { ...res, startTime: moment.utc(res.startDate).format('hh:mm A'), endTime: moment.utc(res.endDate).format('hh:mm A') }
					})
					console.log('testData', this.dataFiltered);

					// this.dataFiltered = this.dataFiltered.map(item => {
					// 	if(item.startDate) {
					// 		console.log('item',item);
					// 		item.startDate = item.time
					// 		item.endDate = item.startDate + 1
					// 		return item
					// 	}
					// 	// return item
					// })
					this.page = {
						currentPage: this.globals.isOnline ? meta.currentPage : 1,
						numberOfPages: this.globals.isOnline ? meta.pages : 1,
						pageSize: this.globals.isOnline ? meta.perPage : 100,
						totalItems: this.globals.isOnline ? meta.total : res.length
					}

					try {
						this.changeDetection.detectChanges()
					} catch (e) { }

					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			}
		})
	}

	edit = (id) => {
		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (res.data)
					res = res.data

				if (!res.reservation)
					res['reservation'] = res

				this.editLoading = loading
				this.editTime = res.reservation.time

				if (res.reservation.doctor && res.reservation.patient) {
					this.doctorChanged(res.reservation.doctor._id, () => {
						this.addModel.date = new Date(res.reservation.date)
						this.addModel.doctor = res.reservation.doctor ? res.reservation.doctor._id : null
						this.addModel.notes = res.reservation.notes
						this.addModel.patient = res.reservation.patient ? res.reservation.patient._id : null

						this.addModel.services = res.services.map(service => {
							return {
								_id: service.service._id,
								name: service.service.name,
								price: service.price,
								discount: service.discount
							}
						})

						setTimeout(() => {
							window.scrollTo(0, 0)
						}, 100)
					})
				}
				else {
					this.addModel.date = new Date(res.reservation.date)
					this.addModel.doctor = res.reservation.doctor ? res.reservation.doctor._id : null
					this.addModel.notes = res.reservation.notes
					this.addModel.patient = res.reservation.patient ? res.reservation.patient._id : null
					this.addModel.services = res.services.map(service => {
						return {
							_id: service.service._id,
							name: service.service.name,
							price: service.price,
							discount: service.discount
						}
					})

					setTimeout(() => {
						window.scrollTo(0, 0)
					}, 100)

					loading.hide()
				}

			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	delete = () => {
		this.globals.loading(loading => {
			this.api.delete(this.deleteId).then(() => {
				if (!this.globals.isOnline) {
					this.globals.showToast('تم الحذف بنجاح!', '', NotificationTypes.Success)
					this.deleteModal.hide()
					loading.hide()
					return
				}


				this.deleteId = null
				this.deleteModal.hide()

				this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)

				this.globals.showToast('تم الحذف بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	filterData = (field = null) => {
		this.dataFiltered = JSON.parse(JSON.stringify(this.data))
		console.log(this.dataFiltered);


		if (!field) {
			if (this.filterNumber != "" || this.filterMobile != "" || this.filterName != "") {
				this.dataFiltered = this.dataFiltered.filter(d => {
					return (this.filterNumber != "" ? d.patient.number == this.filterNumber.trim() : true) &&
						(this.filterMobile != "" ? d.patient.mobile == this.filterMobile.trim() : true) &&
						(this.filterName != "" ? d.patient.name_ar.toLowerCase().indexOf(this.filterName.toLowerCase()) > -1 : true)
				})
			}
		}
		else {
			if (this.filterNumber != "" || this.filterMobile != "" || this.filterName != "") {
				this.dataFiltered = this.dataFiltered.filter(d => {
					if (field == 'name')
						return d.patient.name_ar != "" ? d.patient.name_ar.toLowerCase().indexOf(this.filterName.toLowerCase()) > -1 : true
					else if (field == 'mobile')
						return d.patient.mobile != "" ? d.patient.mobile == this.filterMobile.trim() : true
					else
						return d.patient.number != "" ? d.patient.number == this.filterNumber.trim() : true
				})
			}
		}

		this.dataFiltered = this.dataFiltered.sort((a, b) => {
			let _a = new Date(a.createdAt).getTime(), _b = new Date(b.createdAt).getTime()
			return this.sort == 1 ? (_b - _a) : (_a - _b)
		})

		this.dataFiltered = JSON.parse(JSON.stringify(this.dataFiltered))
	}

	dateChanged = (date) => {
		if (date) {
			let dayOfWeek = moment(date).day()
			let day_of_week = dayOfWeek
			if (day_of_week == 6) {
				day_of_week = 1
			} else {
				day_of_week += 2
			}
			// console.log(this.doctor_schedule);
			this.selected_date_times = this.doctor_schedule.filter(res => res.day_of_week === day_of_week)[0]
			console.log(this.selected_date_times);
			let selectedDate = moment(new Date(date)).format('DD/MM/YYYY')
			let currentDate = moment().format('DD/MM/YYYY')
			let currentTime = moment(moment().format('hh:mm A'), 'hh:mma')
			let DocMinTime
			if (this.selected_date_times) {
				DocMinTime = moment(this.selected_date_times.start_time, 'hh:mm A');


				console.log('currentTime', currentTime);
				console.log('DocMinTime', DocMinTime);
				console.log(DocMinTime.isBefore(currentTime));


				if (selectedDate === currentDate) {

					if (DocMinTime.isBefore(currentTime)) {
						console.log('is before');
						this.selected_date_times.start_time = moment().format('hh:mm A')

					} else {
						this.selected_date_times.start_time = this.selected_date_times.start_time
					}
				} else {
					this.selected_date_times.start_time = this.selected_date_times.start_time

				}
				console.log(this.selected_date_times);

			}
			if(!this.globals.isOnline && selectedDate == currentDate){
				console.log('inside');
				
				this.offlineMinTime = moment().format('hh:mm A')
				console.log(this.offlineMinTime);
				
			} else {
				this.offlineMinTime = undefined
			}

			console.log(this.offlineMinTime);

			if (this.doctor_days_of_week.includes(day_of_week) == true || !this.globals.isOnline) {
				this.timeInputs_flag = false
			} else {
				this.timeInputs_flag = true
			}
			let day = this.doctorDays.find(d => d.value == dayOfWeek)
			this.hours = day !== undefined ? day.hours : []
		}
		else this.hours = []

		if (this.editTime) {
			this.addModel.time = this.editTime
			this.editLoading.hide()
			this.editTime = null
			this.editLoading = null
		}
	}
	endTimeChanged = (time) => {
		console.log(time);

		let DocEndTime
		if (this.selected_date_times)
			DocEndTime = moment(this.selected_date_times.end_time, 'hh:mm A');


		let selectedTime = moment(time, 'hh:mma')
		// if (selectedTime.isAfter(DocEndTime)) {
		// 	this.endTimeFlag = true
		// 	Swal.fire({
		// 		position: 'center',
		// 		icon: 'error',
		// 		title: 'خطأ ...',
		// 		html: `برجاء العلم ان وقت انتهاء العمل للطبيب <strong style="color:red" > ${this.selected_date_times.end_time}</strong> يجب تغير وقت انتهاء الحجز`
		// 	})
		// } else {
		// 	this.endTimeFlag = false
		// }

	}

	makeHoursList = (data) => {
		let hoursCount = moment(`1/1/1 ${data.end_time}`).diff(moment(`1/1/1 ${data.start_time}`), 'hours')
		let list = [{
			value: data.start_time,
			title: moment(`1/1/1 ${data.start_time}`).format('hh:m A')
		}]

		for (let i = 1; i < hoursCount + 1; i++) {
			let timeAr = moment(`1/1/1 ${data.start_time}`, '', 'ar').add(i, 'hours')
			let timeEn = moment(`1/1/1 ${data.start_time}`, '', 'en').add(i, 'hours')
			list.push({
				value: timeEn.format('HH:mm'),
				title: timeAr.format('hh:m A')
			})
		}

		return list
	}

	printInvoice = (id) => {
		this.globals.loading(async loading => {
			if (this.globals.isOnline) {
				this.api.request(`${this.api.endPoints.reservationBill}${id}`, { branch: this.globals.currentUser.branch }, RequestTypes.POST).then(res => {
					res.data.services.forEach(service => {
						service.price = service.price - ((service.discount * service.price) / 100)
					})
					this.currentInvoice = res.data
					this.currentInvoice['vat'] = 0
					if (this.currentInvoice.reservation.patient && this.currentInvoice.reservation.patient.nationality != 'سعودى')
						this.currentInvoice['vat'] = (this.getInvoiceServicesTotal() * 15) / 100

					this.invoiceModal.show()
					loading.hide()
				}, () => {
					loading.hide()
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				})
			}
			else {
				let reservation = await this.api.read(id)

				if (reservation.bill !== undefined)
					this.getOfflineBill(reservation.bill, loading)
				else {
					let data = {
						branch: this.globals.currentUser.branch,
						reservation: reservation,
						date: new Date(),
						user: this.globals.currentUser,
						paidAmount: (reservation.paymentTypeValues[0] || 0) + (reservation.paymentTypeValues[1] || 0)
					}

					this.globals.DBS.BILLS.DB.post(data).then(async res => {
						if (!this.globals.isOnline)
							this.globals.DBS.BILLS.hasOffflineData = true

						await this.globals.DBS.RESERVATIONS.DB.put({
							_id: reservation._id,
							_rev: reservation._rev,
							...reservation,
							bill: res.id,
							isDeleted: true
						})
						this.getOfflineBill(res.id, loading)
					}, () => {
						loading.hide()
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
					})
				}
			}
		})
	}

	getOfflineBill = (id, loading = null) => {
		this.globals.DBS.BILLS.DB.get(id).then(bill => {
			bill.reservation.services.forEach(service => {
				service.price = service.price - ((service.discount * service.price) / 100)
			})

			this.currentInvoice = {
				bill,
				reservation: bill.reservation,
				services: bill.reservation.services,
				vat: 0
			}

			if (this.currentInvoice.reservation.patient && this.currentInvoice.reservation.patient.nationality != 'سعودى')
				this.currentInvoice.vat = (this.getInvoiceServicesTotal() * 15) / 100

			this.invoiceModal.show()

			if (loading)
				loading.hide()
		}, () => {
			if (loading)
				loading.hide()
			this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
		})
	}

	cancelInvoice = () => {
		this.invoiceModal.hide()
		this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)
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

	getInvoiceServicesTotal = () => {
		let total = 0;
		(this.currentInvoice ? this.currentInvoice.services : []).forEach(service => {
			total += service.price
		})

		return total
	}

	getServicesTotal = () => {
		let total = 0
		this.addCompleteModel.services.forEach(service => {
			total += service.price
		})
		this.mainTotal = total

		return total
	}

	getServicesTotal1 = () => {
		let total = 0
		this.addModel.services.forEach(service => {
			total += service.price
		})

		return total
	}

	checktotal = () => {
		if (this.payment.cash == true && this.payment.network == false) {
			this.total = this.payment.cashAmount
		} else if (this.payment.cash == false && this.payment.network == true) {
			this.total = this.payment.networkAmount
		} else if (this.payment.cash == true && this.payment.network == true) {
			this.total = this.payment.networkAmount + this.payment.cashAmount
		}

		if (this.disFlag == false) {
			if (this.total > this.getServicesTotal()) {
				this.show = true
			} else {
				this.show = false
			}
		} else {
			this.show = false
		}
		if (this.total < this.totalAfterVat) {
			this.paymentLess = true
		} else {
			this.paymentLess = false
		}
	}

	complete = (res) => {
		console.log(res);

		this.total = 0

		this.globals.loading(loading => {
			this.services = []
			this.currentReservation = res

			this.currentReservation.patient.age = Math.abs(moment(this.currentReservation.patient.age).diff(moment(), 'years'))

			this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
				if (res.data)
					res = res.data
				else res = res.rows.map(r => r.doc)

				this.services = res.map(s => <Object>{ value: s._id, title: s.name, price: s.price, data: s })
			})

			this.api.request(`${this.api.endPoints.reservations}${this.currentReservation._id}`, this.globals.isOnline ? {} : { REQUEST_ID: this.currentReservation._id }, RequestTypes.GET).then(res => {
				if (res.data)
					res = res.data

				if (!res.reservation)
					res['reservation'] = res

				this.form.reset()
				this.addCompleteModel = {
					complain: res.reservation.complain ? res.reservation.complain : '',
					diagnosis: res.reservation.diagnosis ? res.reservation.diagnosis : '',
					notes: res.reservation.notes ? res.reservation.notes : '',
					services: res.services
				}

				let sumServicesPrices = 0
				this.addCompleteModel.services.map(item => {
					return item.price
				}).forEach(price => {
					sumServicesPrices += price
				})

				this.servicesMainTotal = sumServicesPrices
				if (this.currentReservation.patient.nationality == "سعودى") {
					this.totalAfterVat = this.servicesMainTotal
					this.isVat = false
				} else {
					this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 15) / 100)
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
				if (res.reservation.paymentType) {
					let cashIndex = res.reservation.paymentType.indexOf('cash')
					let networkIndex = res.reservation.paymentType.indexOf('network')

					if (cashIndex > -1) {
						this.payment.cash = true
						this.payment.cashAmount = res.reservation.paymentTypeValues[cashIndex]
					}
					if (networkIndex > -1) {
						this.payment.network = true
						this.payment.networkAmount = res.reservation.paymentTypeValues[networkIndex]
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

	addService = () => {
		let service = this.services.find(s => s.value == this.currentService)

		this.addCompleteModel.services.push({
			...(this.globals.isOnline ? { reservation: this.currentReservation._id } : {}),
			service: service.value,
			name: service.title,
			price: service.price,
			discount: 0,
			...(this.globals.isOnline ? {} : { _id: service.value })
		})

		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))

			serviceTotal.forEach(servicePrice => {
				sum += Number(servicePrice.innerHTML)
			})

			this.servicesMainTotal = sum
			if (this.currentReservation.patient.nationality == "سعودى") {
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 15) / 100)
				this.isVat = true
			}
		}, 200)
	}

	whenDelete = (i = null) => {
		if (i != null) {
			this.addCompleteModel.services.splice(i, 1)
			let servicesCopy = JSON.parse(JSON.stringify(this.addCompleteModel.services))
			this.addCompleteModel.services = []
			this.addCompleteModel.services = servicesCopy
		}

		setTimeout(() => {
			let sum = 0
			let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))

			serviceTotal.forEach(servicePrice => {
				sum += Number(servicePrice.innerHTML)
			})

			this.servicesMainTotal = sum
			if (this.currentReservation.patient.nationality == "سعودى") {
				this.totalAfterVat = this.servicesMainTotal
				this.isVat = false
			} else {
				this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 15) / 100)
				this.isVat = true
			}
		}, 200)
	}

	addService1 = () => {
		let service = this.services.find(s => s.value == this.currentService)

		this.addModel.services.push({
			_id: service.value,
			name: service.title,
			price: service.price,
			discount: 0,
		})
	}

	calcTotalAfterDiscount = () => {
		this.servicesMainTotal = 0
		let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal'))

		serviceTotal.forEach(servicePrice => {
			this.servicesMainTotal += Number(servicePrice.innerHTML)

		})

		if (this.currentReservation.patient.nationality == "سعودى") {
			this.totalAfterVat = this.servicesMainTotal
			this.isVat = false
		} else {
			this.totalAfterVat = this.servicesMainTotal + ((this.servicesMainTotal * 15) / 100)
			this.isVat = true
		}
		this.disFlag = true
		this.show = false
	}

	calcTotalAfterDiscount1 = () => {
		this.servicesMainTotal1 = 0
		let serviceTotal = Array.from(document.querySelectorAll('.serviceTotal1'))
		serviceTotal.forEach(servicePrice => {
			this.servicesMainTotal1 += Number(servicePrice.innerHTML)

		})
	}

	submitCompleteForm = async (print = false) => {
		this.globals.loading(loading => {
			let data = { ...this.addCompleteModel, paymentType: [], paymentTypeValues: [] }

			if (this.payment.cash) {
				data.paymentType.push('cash')
				data.paymentTypeValues.push(this.payment.cashAmount)
			}
			if (this.payment.network) {
				data.paymentType.push('network')
				data.paymentTypeValues.push(this.payment.networkAmount)
			}

			if (this.globals.isOnline) {
				this.api.request(`${this.api.endPoints.reservations}complete/${this.currentReservation._id}`, data, RequestTypes.PUT).then(() => {
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
			}
			else {
				this.globals.loading(loading => {
					this.api.read(this.currentReservation._id).then(res => {
						let data = { ...res, ...this.addCompleteModel, paymentType: [], paymentTypeValues: [] }

						if (this.payment.cash) {
							data.paymentType.push('cash')
							data.paymentTypeValues.push(this.payment.cashAmount)
						}
						if (this.payment.network) {
							data.paymentType.push('network')
							data.paymentTypeValues.push(this.payment.networkAmount)
						}

						data.services = data.services.map(s => <Object>{ ...s, service: this.services.find(d => d.value == s._id).data })

						this.api.update(this.currentReservation._id, data).then(() => {
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
					}, () => {
						loading.hide()
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
					})
				})
			}
		})
	}

	incTime = () => {
		this.addModel.time = moment(`1/1/1 ${this.addModel.time}`).add(this.minutesInterval, 'minute').locale('en').format('hh:mmA')
	}
	decTime = () => {
		this.addModel.time = moment(`1/1/1 ${this.addModel.time}`).subtract(this.minutesInterval, 'minute').locale('en').format('hh:mmA')
	}
	incendTime = () => {
		this.addModel.end_time = moment(`1/1/1 ${this.addModel.end_time}`).add(this.minutesInterval, 'minute').locale('en').format('hh:mmA')
	}
	decendTime = () => {
		this.addModel.end_time = moment(`1/1/1 ${this.addModel.end_time}`).subtract(this.minutesInterval, 'minute').locale('en').format('hh:mmA')
	}

	timeKeyUp = (e) => {
		if (e.keyCode == 38)
			this.incTime()
		else if (e.keyCode == 40)
			this.decTime()
		else e.preventDefault()
	}
	endtimeKeyUp = (e) => {
		if (e.keyCode == 38)
			this.incendTime()
		else if (e.keyCode == 40)
			this.decendTime()
		else e.preventDefault()
	}
	changeStatus = (res_id, status, index) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}${res_id}`, { status }, RequestTypes.POST).then(res => {
				this.data[index].status = res.data
				this.globals.showToast('تم تغيير الحالة بنجاح!', '', NotificationTypes.Success)
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	gotoDoctor = (res, force = false) => {
		if (!force)
			this.gotoId = res._id

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reservations}goto/${res ? res._id : this.gotoId}`, { force }, RequestTypes.POST).then(res => {
				if (res.type == 'exists' && !force)
					this.gotoModal.show()

				if (res.type == 'warning') {
					this.globals.showToast('يوجد عميل الان عند نفس الطبيب !', '', NotificationTypes.Info)
				}
				else {
					this.doctorRoom = true
					this.globals.showToast('تم تغيير الحالة بنجاح!', '', NotificationTypes.Success)
					this.getReservations(this.reservationType, this.globals.isOnline ? this.page.currentPage : 1)

					if (this.globals.isOnline)
						this.globals.socket.emit('sendToDoctor', { userId: res.data.doctor._id, data: res })
				}

				if (force)
					this.gotoId = null

				loading.hide()
			}, (error) => {
				if (error.error.type == 'warning') {
					this.globals.showToast('يوجد عميل الان عند نفس الطبيب !', '', NotificationTypes.Info)
				} else {
					this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				}
				this.gotoId = null
				loading.hide()

			})
		})
	}


}
