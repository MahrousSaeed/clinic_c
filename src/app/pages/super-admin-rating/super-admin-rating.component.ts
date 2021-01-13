import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
import * as moment from 'moment';
import { type } from 'os';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'
import {PageState} from 'ngx-paginate'
@Component({
	selector: 'app-super-admin-rating',
	templateUrl: './super-admin-rating.component.html',
	styleUrls: ['./super-admin-rating.component.scss']
})
export class SuperAdminRatingComponent implements OnInit {
	@ViewChild('doctorsModal', { static: true }) doctorsModal: ModalDirective
	reportDate
	dataFiltered
	currentBranch 
	doctors
	allData
	rateType = 3
	byYear:Boolean = false
	byMonthYear:Boolean = true
	order = 1
	month  = (new Date()).getMonth() + 1
	branchAdmin
	page: PageState = {
		currentPage: 1,
		numberOfPages: 1,
		pageSize: 1,
		totalItems: 1
	}

	pageChange(pageState: PageState) {
		this.page = pageState
		this.doctorModel.page = this.page.currentPage
		this.getDoctorDetails()
	}
	months = [
		{ title: "يناير", value: 1 },
		{ title: "فبراير", value: 2 },
		{ title: "مارس", value: 3 },
		{ title: "ابريل", value: 4 },
		{ title: "مايو", value: 5 },
		{ title: "يونيو", value: 6 },
		{ title: "يوليو", value: 7 },
		{ title: "أغسطس", value: 8 },
		{ title: "سبتمبر", value: 9 },
		{ title: "أكتوبر", value: 10 },
		{ title: "نوفمبر", value: 11 },
		{ title: "ديسمبر", value: 12 }
	]
	types = [
		{ title: "الجميع", value: 1 },
		{ title: "طبيب", value: 2 },
		{ title: "موظف استقبال ", value: 3 },
		{ title: "ممرضة ", value: 4 },
		{ title: " محاسب ", value: 5 },

	]
	type = 1
	year = (new Date).getFullYear()
	years = []
	adminRateModel = {
		followManagement: 3,
		fastResponse: 3,
		reportsMake: 3,
	}
	doctorModel = {
		branch: null,
		role: 'all',
		month: this.month,
		page:1,
		year: this.year
	}
	rating_dashboardModel = {
		orderBy: 'desc',
		month: this.month,
		year: this.year
	}

	// years = [{ value: (new Date).getFullYear(), title: (new Date).getFullYear().toString() }]
	constructor(public api: ApiService, public globals: Globals, config: NgbRatingConfig) {
		// this.month =  (new Date()).getMonth() + 1
		config.max = 5;
		for (let index = 2017; index <= this.year; index++) {
			this.years.push({ value: index, title: index.toString() })

		}
	}

	ngOnInit() {
		this.dateChanged()
	}
	radeAdmin = () => {


	}
	typeChanged = () => {
		this.doctorModel.page = 1
		if (this.type === 1)
			this.doctorModel.role = 'all'
		else if (this.type === 2)
			this.doctorModel.role = 'doctors'
		else if (this.type === 3)
			this.doctorModel.role = 'receptions'
		else if (this.type === 4)
			this.doctorModel.role = 'nurses'
		else 
			this.doctorModel.role = 'accountants'
		this.getDoctorDetails()

	}
	onOrderChanged = () => {
		if (this.order === 1)
			this.rating_dashboardModel.orderBy = 'desc'
		else
			this.rating_dashboardModel.orderBy = 'asc'

		this.dateChanged()

	}
	employeesSearch = (word) => {
		// this.doctorModel = {
		// 	branch: this.doctorModel,
		// 	role: this.doctorModel.role,
		// 	month: this.doctorModel.month,
		// 	page:this.doctorModel.page,
		// 	year: this.doctorModel.year,
			
		// }
		this.doctorModel['name'] = word
		this.getDoctorDetails()

		
	}
	onTypeChanged = () => {
		if(this.rateType === 2){
			this.byMonthYear = false
			this.byYear = true
			this.dateChanged()
		} else if (this.rateType === 3){
			this.byMonthYear = true
			this.byYear = false
			this.dateChanged()
		} else {
			this.byMonthYear = false
			this.byYear = false
			this.dateChanged()
			// all ratings 
		}
		
	}
	dateChanged = () => {
		let data = {}

		if(this.rateType === 1){
			data = {
				all:true,
				orderBy:this.rating_dashboardModel.orderBy
			}
		} else if(this.rateType === 2){
			data = {
				orderBy: this.rating_dashboardModel.orderBy,
				year: this.rating_dashboardModel.year
			}
		} else {
			data = {
				orderBy: this.rating_dashboardModel.orderBy,
				month: this.rating_dashboardModel.month,
				year: this.rating_dashboardModel.year
			}
		}
		this.globals.loading(loading => {
			this.api.request(this.api.endPoints.rating_dashboard, data, RequestTypes.POST).then(res => {
				this.dataFiltered = res.data
				loading.hide()
			}).catch(() => {
				loading.hide()
			})
		})


	}
	createArray = (num) => {
		let array = []
		for (let i = 0; i < num; i++) {
			array.push(i)
		}
		return array
	}
	getDoctorDetails = () => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.rating_dashboard_details}`, this.doctorModel, RequestTypes.POST).then(res => {
				this.allData = res.meta.total
				
				// this.currentBranch = branch
				this.doctors = res.data

				this.page = {
					currentPage: res.meta.currentPage,
					numberOfPages:res.meta. pages,
					pageSize: res.meta.perPage,
					totalItems: res.meta.total
				}

				let doctorss = res.data.filter(d => d.userId.role.name === 'doctor')
				let other = res.data.filter(d => d.userId.role.name !== 'doctor')
				this.doctors = [...doctorss, ...other]

				this.doctorsModal.show()

				loading.hide()
			}, () => {
				this.doctors = []
				loading.hide()
			})
		})
	}
	createRate() {
		let data = {
			followManagement: this.adminRateModel.followManagement.toString(),
			fastResponse: this.adminRateModel.fastResponse.toString(),
			reportsMake: this.adminRateModel.reportsMake.toString(),
			adminUserId: this.branchAdmin._id,
		}
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.rateAdmin}`, data, RequestTypes.POST).then(res => {
				this.dateChanged()
				this.adminRateModel.fastResponse = 3
				this.adminRateModel.reportsMake = 3
				this.adminRateModel.followManagement = 3
				Swal.fire({
					position: 'center',
					icon: 'success',
					title: 'تم التقييم بنجاح',
					showConfirmButton: false,
					timer: 1500
				})
				loading.hide()
			}).catch(err => {
				loading.hide()
			})
		})
		// setTimeout(() => {
		// 	this.onSelectBranch()
		// }, 200);
	}
	
	onselect = (branch) => {
		this.currentBranch = branch
		this.doctorModel.branch = branch.branch._id
		// if(branch.adminRatings != null) {
		// 	this.adminRateModel.followManagement = branch.adminRatings.followManagement
		// 	this.adminRateModel.fastResponse = branch.adminRatings.fastResponse
		// 	this.adminRateModel.reportsMake = branch.adminRatings.reportsMake
		// }

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.getAdmin}${branch.branch._id}`, null, RequestTypes.GET).then(res => {
				this.branchAdmin = res.data
				loading.hide()
			}).catch(err => {
				this.branchAdmin = null
				loading.hide()
			})
		})
	}
}
