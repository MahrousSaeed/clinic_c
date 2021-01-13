import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ElementRef } from '@angular/core';

@Component({
	selector: 'app-services',
	templateUrl: './services.component.html',
	styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
	@ViewChild('deleteModal', { static: true }) deleteModal: ModalDirective
	@ViewChild('form', { static: true }) form: NgForm
	@ViewChild('one', { static: true }) d1: ElementRef;

	data: Array<any> = []
	dataFiltered: Array<any> = []
	serviceVideo: any
	_videoURL:any
	addModel = {
		name: null,
		price: null,
		// related: [],
		// videoFile: null,
		// delete:false
	}
	serviceArray = [];
	selectedItems = [];
	dropdownSettings = {
		singleSelection: false,
		idField: '_id',
		textField: 'name',
		selectAllText: 'Select All',
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: true
	};

	filter: string = ''
	sort: number = 1

	editId = null
	deleteId = null

	constructor(private api: ApiService, private globals: Globals) {
		api.init(api.endPoints.services)
	}

	onItemSelect(item: any) {
		// this.addModel.related = this.selectedItems
	}

	ngOnInit() {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.services}${this.globals.currentUser.branch}`, {}, RequestTypes.PATCH).then(res => {
				this.data = res.data
				this.dataFiltered = Object.assign([], this.data)
				this.filterData()
				this.serviceArray = res.data

				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	processFile = (video: any) => {
		var tgt: any = video.target || window.event.srcElement,
			files = tgt.files

		const file: File = video.files[0];

		// this.addModel.videoFile = file
		this.serviceVideo = files[0].name

		if (FileReader && files && files.length) {
			var fr = new FileReader()
			fr.onload = () => {
				let videoElement = (<HTMLImageElement>document.querySelector('#service_video'))
				
				document.getElementById('one').innerHTML = 
				`
					<video width="320" height="240" controls>
						<source src=" ${fr.result}" type="video/mp4">
					</video>
			
				`
			}
			
			fr.readAsDataURL(files[0])
		}

	}

	deletevideo = () => {
		// this.addModel.videoFile = null
		
		document.getElementById('updated_video').style.display = 'none'
		document.getElementById('one').innerHTML = '  '

		// this.addModel.delete = true
	}

	edit = (id) => {
		document.getElementById('one').innerHTML = '  '
		this.globals.loading(loading => {
			this.editId = id
			this.api.read(this.editId).then(res => {
				if (!this.globals.isOnline)
					return
					
				this._videoURL = res.data.videoUrl
				this.addModel = {
					name: res.data.name,
					price: res.data.price,
					// related: [],
					// delete:false,
					// videoFile: res.data.videoUrl
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
		// let data = new FormData()
		// data.append('name', this.addModel.name)
		// data.append('price', this.addModel.price)
		// data.append('related', JSON.stringify(this.addModel.related))
		// data.append('videoFile', this.addModel.videoFile)

		
		if (this.editId) {
			// if(this.addModel.delete == true){
			// 	data.append('delete', JSON.parse(JSON.stringify(this.addModel.delete)))
			// }
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
				this.api.create(this.addModel).then(() => {
					if (!this.globals.isOnline)
						return
					
					this.form.reset()
					this.selectedItems = []
					
					document.getElementById('one').innerHTML = ''
					this.ngOnInit()
					this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
					loading.hide()
				}, (e) => {
					loading.hide()
					if(e.error.message == 'Service already exists!'){
						this.globals.showToast('هذة الخدمة موجودة بالفعل !', '', NotificationTypes.Error)
					} else {
						this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
					}
				})
			})
		}
	}

	cancel = () => {
		this.form.reset()
		this.addModel = {
			name: null,
			price: null,
			// related: [],
			// videoFile: null,
			// delete:false
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
