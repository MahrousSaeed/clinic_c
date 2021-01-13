import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
import * as moment from 'moment';

@Component({
	selector: 'app-admin-dashboard',
	templateUrl: './admin-dashboard.component.html',
	styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
	@ViewChild('doctorsModal', { static: true }) doctorsModal: ModalDirective
	@ViewChild('billsModal', { static: true }) billsModal: ModalDirective
	@ViewChild('expensesModal', { static: true }) expensesModal: ModalDirective

	dashboard = null
	branches = []
	dash_data
	branchesFiltered = []

	doctors = []
	bills = []
	expenses = []
	currentBranch = null

	branchesFilter = ''
	reportType = 'month'
	addModel = {
		type:null,
		month:null,
		year:null
	}
	reportDate
	month = (new Date()).getMonth()
	months = [
		{ title: "يناير", value: 0 },
		{ title: "فبراير", value: 1 },
		{ title: "مارس", value: 2 },
		{ title: "ابريل", value: 3 },
		{ title: "مايو", value: 4 },
		{ title: "يونيو", value: 5 },
		{ title: "يوليو", value: 6 },
		{ title: "أغسطس", value: 7 },
		{ title: "سبتمبر", value: 8 },
		{ title: "أكتوبر", value: 9 },
		{ title: "نوفمبر", value: 10 },
		{ title: "ديسمبر", value: 11 }
	]
	year = 2020
	years = [
		{ title: "2019", value: 2019 },
		{ title: "2020", value: 2020 },
	]

	// years = [{ value: (new Date).getFullYear(), title: (new Date).getFullYear().toString() }]

	constructor(public api: ApiService, public globals: Globals) { }

	ngOnInit() {
		this.doctorsModal.config = { backdrop: 'static', keyboard: false }
		this.billsModal.config = { backdrop: 'static', keyboard: false }
		this.expensesModal.config = { backdrop: 'static', keyboard: false }

		this.loadData()
	}
	dateChanged = (date) => {
		let month = moment(date).format("MM")
		let year = moment(date).format("YYYY")
		let data = {
			month:month,
			year:year
		}
		this.api.request(this.api.endPoints.rating_dashboard,data,RequestTypes.POST).then(res => {
			
		})
		
		
	}
	loadData = () => {
		console.log(this.year);
		
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reports}executive-dashboard`, { type: this.reportType, month: this.month, year: this.year }, RequestTypes.POST).then(res => {
				this.dash_data = res
				console.log(this.dash_data);
				

				this.branches = res.data 
				
				
				this.branchesFiltered = Object.assign([], this.branches)
				this.branchesFiltered = this.branchesFiltered.sort((a,b)=>{
					return b.bills.current - a.bills.current
				})
				for (let year = (new Date).getFullYear(); year < res.firstYear; year++) {
					this.years.push({ value: year, title: year.toString() })
				}

				this.dashboard = {
					bills: this.branches.reduce((total, v) => (typeof total == "object" ? total.bills.current : total) + v.bills.current),
					reservationsCount: this.branches.reduce((total, v) => (typeof total == "object" ? total.reservations.current : total) + v.reservations.current),
					expenses: this.branches.reduce((total, v) => (typeof total == "object" ? total.expenses.current : total) + v.expenses.current),
				}
				console.log('dashhhhhhhhh',this.dashboard);
				loading.hide()
			}, () => loading.hide())
		})
	}

	filterBranches = () => {
		if (this.branchesFilter != "")
			this.branchesFiltered = this.branches.filter(b => b.branch.name.toLowerCase().indexOf(this.branchesFilter.toLowerCase()) > -1)
		else
			this.branchesFiltered = Object.assign([], this.branches)
	}

	getDetails = (branch, boxType) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reports}executive-details-dashboard/${branch.branch._id}`, { type: this.reportType, boxType, month: this.month, year: this.year }, RequestTypes.POST).then(res => {
				this.currentBranch = branch

				if (boxType == "doctors") {
					this.doctors = res.data
					this.doctorsModal.show()
				}
				else if (boxType == "bills") {
					res.data.forEach(bill => {
						let cashIndex = bill.paymentType.indexOf("cash")
						let networkIndex = bill.paymentType.indexOf("network")

						bill['cash'] = cashIndex > -1 ? bill.paymentTypeValues[cashIndex] : 0
						bill['network'] = networkIndex > -1 ? bill.paymentTypeValues[networkIndex] : 0
					})

					this.bills = res.data
					this.billsModal.show()
				}
				else if (boxType == "expenses") {
					this.expenses = res.data
					this.expensesModal.show()
				}

				loading.hide()
			}, () => {
				this.doctors = []
				this.bills = []
				this.expenses = []

				loading.hide()
			})
		})
	}

	getMonth = (month) => this.months.find(m => m.value == month).title
}
