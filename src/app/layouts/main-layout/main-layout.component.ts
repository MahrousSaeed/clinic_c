import { Component, OnInit, ViewChild } from '@angular/core';
import { Globals, Events, NotificationTypes } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { Router, NavigationStart } from '@angular/router';
declare var moment: any

@Component({
	selector: 'app-main-layout',
	templateUrl: './main-layout.component.html',
	styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {

	@ViewChild('updateModal', { static: true }) updateModal: ModalDirective
	currentDate = new Date()
	user = {
		name: null,
		email: null,
		mobile: null,
		birthdate: null,
		gender: null,
		address: null,
		password: null,
		password2: null
	}

	profileImageFile: File = null
	profileImageInput: HTMLInputElement = null

	userImage: string = null

	showUpdate = true
	currentAppVersion
	latestAppVersion

	uploadingOfflineFailed = false

	constructor(public globals: Globals, private api: ApiService, private auth: AuthService, private router: Router) {
		this.currentAppVersion = environment.appVersion
		this.latestAppVersion = environment.appVersion

		Events.subscribe('update:profile', () => {
			this.updateModal.show()
			// this.profileImageInput.value = ''
			// this.profileImageFile = null
		})

		api.init()
		// this.updateModal.config = { backdrop: 'static', keyboard: false }

		this.getAppVersion()

		router.events.subscribe(event => {
			if (event instanceof NavigationStart) {
				this.showUpdate = true
				this.getAppVersion()
			}
		})

		Events.subscribe('new-ver', () => {
			this.showUpdate = true
			this.getAppVersion()
		})
	}

	getAppVersion = () => {
		if (this.globals.isOnline)
			this.api.request('/assets/config.json', null, RequestTypes.GET, false).then(data => {
				this.latestAppVersion = data.appVersion
			})
	}

	hideBackdrop = () => {		
		let backdrop = Array.from( document.querySelectorAll('.modal-backdrop'))
		
		backdrop.forEach(element => {
			element.classList.add('hideModel')
		})
	}

	ngOnInit() {
		if(this.globals.currentUser != null){
			// this.updateModal.config = { backdrop: 'static', keyboard: false }
			this.user = {
				address: this.globals.currentUser.address,
				birthdate: new Date(this.globals.currentUser.birthdate),
				email: this.globals.currentUser.email,
				gender: this.globals.currentUser.gender,
				mobile: this.globals.currentUser.mobile,
				name: this.globals.currentUser.name,
				password: '',
				password2: ''
			}

			this.userImage = this.globals.currentUser.image
		}
		// if(this.globals.currentUser){
		// 	this.profileImageInput = document.querySelector('#image')
		// 	this.profileImageInput.onchange = (evt) => {
		// 		var tgt: any = evt.target || window.event.srcElement,
		// 			files = tgt.files
			
		// 		this.profileImageFile = files[0]
				
		// 		this.userImage = files[0].name
		// 		if (FileReader && files && files.length) {
		// 			var fr = new FileReader()
		// 			fr.onload = () => {
		// 				(<HTMLImageElement>document.querySelector('#profile-image')).src = fr.result.toString()
					
		// 			}
		// 			fr.readAsDataURL(files[0])
		// 		}
		// 	}
		// }

		Events.subscribe('offline-failed', () => this.uploadingOfflineFailed = true)
	}

	updateProfile = () => {
		this.globals.loading(loading => {
			let data = new FormData()
			data.append('address', this.user.address)
			data.append('birthdate', moment(this.user.birthdate).format('YYYY-MM-DD'))
			data.append('gender', this.user.gender)
			// data.append('image', (this.userImage.endsWith('uploads/images/users/default.png') || this.userImage.endsWith('assets/images/default_avatar.png')) && this.profileImageFile == null ? null : (this.profileImageFile != null ? this.profileImageFile : this.userImage))
			data.append('mobile', this.user.mobile)
			data.append('name', this.user.name)
			if (this.user.password != null && this.user.password.trim() != '')
				data.append('password', this.user.password)



			// console.log(this.user);
			
			
			this.api.request(`${this.api.endPoints.updateProfile}`,{address:this.user.address,birthdate:moment(this.user.birthdate).format('YYYY-MM-DD'),gender:this.user.gender,mobile:this.user.mobile,password:this.user.password,name:this.user.name}, RequestTypes.POST).then(res => {				
				setTimeout(() => {
					this.auth.loginUser({
						email: res.data.email,
						id: this.globals.currentUser.id, 
						image: res.data.image,
						name: res.data.name,
						role: this.globals.currentUser.role,
						branch: this.globals.currentUser.branch,
						token: this.globals.currentUser.token,
						isAdmin: this.globals.currentUser.isAdmin,
						isSystemAdmin: this.globals.currentUser.isSystemAdmin,
						address: res.data.address,
						birthdate: res.data.birthdate,
						gender: res.data.gender,
						mobile: res.data.mobile
					})
					this.globals.currentUser.image = res.data.image
				}, 200)
				
				this.globals.showToast('تم تحديث الملف الخاص!', '', NotificationTypes.Success)
				this.updateModal.hide()
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	selectProfileImage = () => {
		this.profileImageInput.click()
	}

	// selectProfileImageDefault = () => {
	// 	this.profileImageFile = null
	// 	this.userImage = 'assets/images/default_avatar.png'
	// 	this.profileImageFile = null
	// }

	updateApp = () => location.reload(true)

	retryOffline = () => {
		this.uploadingOfflineFailed = false
		Events.publish('retry-offline')
	}

	retryLater = () => {
		this.uploadingOfflineFailed = false
		this.globals.uploadingOfflineData = false
	}

}
