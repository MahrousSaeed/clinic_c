import { Component } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BsLocaleService } from 'ngx-bootstrap';
import { Globals, Events, NotificationTypes } from './services/globals';
import { ApiService, RequestTypes } from './services/api/api.service';
import { AuthService } from './services/auth/auth.service';
import io from 'socket.io-client';
import { environment } from '../environments/environment';
import { SwUpdate } from '@angular/service-worker';
import Swal from 'sweetalert2'

declare var moment: any
import PouchDB from 'pouchdb';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})

export class AppComponent {
	title = 'مستوصفات المهيدب'
	vacations: any = []
	reservationDoctor: ''
	titles = {
		'login': 'تسجيل الدخول',
		'dashboard': 'الرئيسية',
		'profiles': 'العملاء',
		'reservations': 'الحجوزات',
		'doctor-screen': 'تحكم الطبيب',
		'branches': 'الفروع',
		'users': 'المستخدمين',
		'contracts': 'الشركات',
		'services': 'الخدمات',
		'contract-services': 'خدمات الشركات',
		'expenses-types': 'أنواع المصروفات',
		'expenses': 'المصروفات',
		'doctors': 'الأطباء',
		'doctors-schedule': 'جدول مواعيد الأطباء',
		'reports': 'إنشاء التقارير',
		'vacation-requests': 'طلبات الأجازات',
		'notification': 'الإشعارات',
		'attendance': 'الحضور و الإنصراف',
		'admincp': 'شاشة التحكم',
		'admindb': 'شاشة التحكم',
		'rating':'التقييم',
		'settings':'اعدادات التقييم',
		'admins_rating':'التقييمات',
		'bills':'تسديد الفواتير',
		'refunds':'المرتجعات'
	}

	// private url = environment.socketURL;
	// private socket; 

	constructor(private router: Router,
		title: Title,
		_bsLocaleService: BsLocaleService,
		private globals: Globals,
		private api: ApiService,
		auth: AuthService,
		private swUpdate: SwUpdate) {

		// _bsLocaleService.use('ar')
		// moment.locale('ar')
		// console.log('currentUser',this.globals.currentUser);
		
		api.init()

		router.events.subscribe((val) => {
			if (val instanceof NavigationEnd) {
				window.scrollTo(0, 0)
				let pageTitle = this.titles[router.url.replace('/dash/', '').replace('/', '')]
				title.setTitle(`${this.title} | ${pageTitle}`)
			}
		})

		if (globals.currentUser) {
			if (this.globals.isOnline) {
				api.request(`${api.endPoints.users}${globals.currentUser.id}`, {}, RequestTypes.GET).then(res => {
					auth.loginUser({
						email: res.data.email,
						id: globals.currentUser.id,
						image: res.data.image,
						name: res.data.name,
						role: globals.currentUser.role,
						branch: globals.currentUser.branch,
						token: globals.currentUser.token,
						isAdmin: res.data.isAdmin === undefined ? false : res.data.isAdmin,
						isSystemAdmin: res.data.isSystemAdmin === undefined ? false : res.data.isSystemAdmin,
						address: res.data.address,
						birthdate: res.data.birthdate,
						gender: res.data.gender,
						mobile: res.data.mobile
					})

					Events.publish('user-updated')

					if (this.globals.currentUser.isSystemAdmin)
						if (this.router.url != '/dash/admincp' && this.router.url != '/dash/admindb')
							this.router.navigate(["/dash/admindb"])
				})
			}

			if (this.globals.currentUser.isSystemAdmin)
				if (this.router.url != '/dash/admincp' && this.router.url != '/dash/admindb')
					this.router.navigate(["/dash/admindb"])
		}
	}

	ngOnInit() {
		this.globals.DBS = {
			PATIENTS: { DB: new PouchDB("PATIENTS"), hasOffflineData: false },
			RESERVATIONS: { DB: new PouchDB("RESERVATIONS"), hasOffflineData: false },
			SERVICES_ONLINE: { DB: new PouchDB("SERVICES_ONLINE"), hasOffflineData: false },
			DOCTORS_ONLINE: { DB: new PouchDB("DOCTORS_ONLINE"), hasOffflineData: false },
			PATIENTS_ONLINE: { DB: new PouchDB("PATIENTS_ONLINE"), hasOffflineData: false },
			BILLS: { DB: new PouchDB("BILLS"), hasOffflineData: false },
		}

		if (this.globals.currentUser)
			this.initUserFunctions()

		window.addEventListener('offline', () => {
			if (this.globals.isOnline) {
				this.globals.isOnline = false
				this.globals.socket.disconnect()
				Events.publish('offline')
			} 
		})

		window.addEventListener('online', () => {
			if (!this.globals.isOnline) {
				this.uploadOfflineData()
				this.globals.isOnline = true
				this.globals.socket = io(environment.socketURL, { transports: ['websocket'], query: { userId: this.globals.currentUser.id, token: this.globals.currentUser.token } })
				Events.publish('online')

			}
		})
		if(this.globals.socket){
			this.globals.socket.on('rate opened', data => {
				Events.publish('rateOpend')
				Swal.fire({
					position: 'center',
					icon: 'success',
					title: 'تم  فتح التقييم لهذا الفرع برجاء تقييم الجميع وارسالة',
					showConfirmButton: false,
					timer: 1500
				  })
				
			})
		}

		Events.subscribe('user-login', () => {
			setTimeout(() => {
				this.initUserFunctions()
			}, 1000)
		})
	}

	checkOfflineData = async () => {
		let hasOfflineData = false

		try {
			(await this.globals.DBS.PATIENTS.DB.allDocs({ include_docs: true })).rows.length > 0 ? this.globals.DBS.PATIENTS.hasOffflineData = true : null
			if (this.globals.DBS.PATIENTS.hasOffflineData)
				hasOfflineData = true
		} catch (e) { }
		try {
			(await this.globals.DBS.RESERVATIONS.DB.allDocs({ include_docs: true })).rows.length > 0 ? this.globals.DBS.RESERVATIONS.hasOffflineData = true : null
			if (this.globals.DBS.RESERVATIONS.hasOffflineData)
				hasOfflineData = true
		} catch (e) { }
		try {
			(await this.globals.DBS.BILLS.DB.allDocs({ include_docs: true })).rows.length > 0 ? this.globals.DBS.BILLS.hasOffflineData = true : null
			if (this.globals.DBS.BILLS.hasOffflineData)
				hasOfflineData = true
		} catch (e) { }

		this.globals.uploadingOfflineData = hasOfflineData && this.globals.isOnline

		if (hasOfflineData)
			this.uploadOfflineData()
	}

	initUserFunctions = () => {
		if (!this.globals.socket)
			this.globals.socket = io(environment.socketURL, { transports: ['websocket'], query: { userId: this.globals.currentUser.id, token: this.globals.currentUser.token } })

		if (this.globals.currentUser.role) {
			if (this.globals.currentUser.role.name == 'doctor') {
				this.router.navigate(['/dash/doctor-screen'])
			}
		}

		setTimeout(() => {
			if (this.globals.isOnline){
				this.globals.socket.emit('with-branch', this.globals.currentUser.branch)
				this.globals.socket.emit('branch-rate', this.globals.currentUser.branch)
			}
			

			this.globals.socket.on('vacationRequest', data => {
				if (this.globals.currentUser.isAdmin && data.data.branch === this.globals.currentUser.branch) {
					this.getVacationRequests()
					this.globals.showToast('يوجد طلب أجازه لديك', '', NotificationTypes.Info)
					Events.publish('update-vacation-requests')
				}
			})

			this.globals.socket.on('vacationRequestResponse', vacationRequestResponseData => {
				if (this.globals.currentUser.name === vacationRequestResponseData.data.user.name) {
					if (vacationRequestResponseData.data.status == "accept") {
						this.globals.showToast('تم قبول طلب الاجازة', '', NotificationTypes.Info)
					}
					if (vacationRequestResponseData.data.status == "reject") {
						this.globals.showToast('تم رقض طلب الاجازة', '', NotificationTypes.Info)
					}
					Events.publish('vacation-request-status', vacationRequestResponseData)
				}
			})

			this.globals.socket.on('custom', data => {
				if (data.type && data.type == 'admin') {
					if (data.to || data.to.length == 0 || data.to.includes(this.globals.currentUser.id)) {

						if (data.action && data.action == 'new-ver')
							Events.publish('new-ver')

					}
				}
			})


			this.globals.socket.on('receptions', data => {
				Events.publish('end patient', data.data)
				this.globals.showToast('تم اكمال كشف ', '', NotificationTypes.Info)
			})
		}, 2000)

		if (this.swUpdate.isEnabled)
			this.swUpdate.available.subscribe(() => Events.publish('new-ver'))

		this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
			this.globals.DBS.SERVICES_ONLINE.DB.bulkDocs(res.data.map(s => {
				delete s['__v']
				return s
			}))
		})

		this.api.request(`${this.api.endPoints.doctors}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.globals.DBS.DOCTORS_ONLINE.DB.bulkDocs(res.data.map(d => {
				delete d['__v']
				return d
			}))
		})

		this.api.request(`${this.api.endPoints.patients}${this.globals.currentUser.branch}`, null, RequestTypes.PATCH).then(res => {
			this.globals.DBS.PATIENTS_ONLINE.DB.bulkDocs(res.data.map(d => {
				delete d['__v']
				return d
			}))
		})

		this.api.request(`${this.api.endPoints.branches}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.globals.currentBranch = res.data
		})

		this.getVacationRequests()
		this.checkOfflineData()

		Events.subscribe('retry-offline', () => this.uploadOfflineData())
	}

	getVacationRequests = () => {
		this.api.request(this.api.endPoints.allVacationRequest, '', RequestTypes.GET).then(res => {
			this.vacations = res.data
			Events.publish('vacations length', this.vacations.length)
		})
	}

	uploadOfflineData = async () => {
		let data = {}

		if (this.globals.DBS.PATIENTS.hasOffflineData) {
			data['patients'] = (await this.globals.DBS.PATIENTS.DB.allDocs({ include_docs: true })).rows.map(r => r.doc)
			data['patients'].forEach(patient => {
				patient['offlineID'] = patient._id
				patient['branch'] = this.globals.currentUser.branch

				delete patient._id
				delete patient._rev
				delete patient.offline
			})
		}

		if (this.globals.DBS.RESERVATIONS.hasOffflineData) {
			data['reservations'] = (await this.globals.DBS.RESERVATIONS.DB.allDocs({ include_docs: true })).rows.map(r => r.doc)
			console.log('data app compo',data);
			
			data['reservations'].forEach(reservation => {
				console.log(reservation);
				
				// reservation['offlineID'] = reservation._id
				if (reservation.patient.offline){
					reservation['offlinePatientID'] = reservation.patient._id
					delete reservation.patient
				}

				// reservation.patient = reservation.patient._id
				reservation.doctor = reservation.doctor._id

				reservation.services.forEach(service => {
					service.service = service._id
					delete service._id
				})

				reservation["user"] = this.globals.currentUser.id

				delete reservation._id
				delete reservation._rev
				delete reservation.offline
				console.log('dataaaaaaaaaaaaaaaaaaaaaaaa',data);
				
			})
		}

		if (this.globals.DBS.BILLS.hasOffflineData) {
			data['bills'] = (await this.globals.DBS.BILLS.DB.allDocs({ include_docs: true })).rows.map(r => r.doc)
			data['bills'].forEach(bill => {
				bill['offlineID'] = bill._id
				bill['offlineReservationID'] = bill.reservation._id

				bill.reservation = bill.reservation._id
				bill.user = bill.user.id

				delete bill._id
				delete bill._rev
			})
		}

		if (data["patients"] && data["patients"].length > 0 ||
			data["reservations"] && data["reservations"].length > 0 ||
			data["bills"] && data["bills"].length > 0) {

			this.globals.uploadingOfflineData = true

			this.api.request(this.api.endPoints.offlineData, data, RequestTypes.POST).then(() => {
				this.globals.uploadingOfflineData = false
				this.globals.showToast('تم رفع البيانات بنجاح!', '', NotificationTypes.Success)

				this.globals.DBS.PATIENTS.DB.destroy().then(() => this.globals.DBS.PATIENTS = { DB: new PouchDB("PATIENTS"), hasOffflineData: false })
				this.globals.DBS.RESERVATIONS.DB.destroy().then(() => this.globals.DBS.RESERVATIONS = { DB: new PouchDB("RESERVATIONS"), hasOffflineData: false })
				this.globals.DBS.BILLS.DB.destroy().then(() => this.globals.DBS.BILLS = { DB: new PouchDB("BILLS"), hasOffflineData: false })
			}).catch(() => {
				Events.publish('offline-failed')
			})
		}
	}

}
