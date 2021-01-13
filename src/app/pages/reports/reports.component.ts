import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { ModalDirective } from 'ngx-bootstrap';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FileSaverService } from 'ngx-filesaver';
import { PageState } from 'ngx-paginate';
import 'rxjs/add/operator/map';
declare var moment: any
declare var html2canvasOld: any
declare var printJS: any
import { downloadFile, saveAs } from 'file-saver';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-reports',
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
	@ViewChild(NgForm, { static: true }) form: NgForm
	@ViewChild(NgForm, { static: true }) form_excel: NgForm
	@ViewChild('delete_modal', { static: true }) delete_modal: ModalDirective
	@ViewChild('review_modal', { static: true }) review_modal: ModalDirective
	@ViewChild('excel_mail_modal', { static: true }) excel_mail_modal: ModalDirective
	private authHeader: HttpHeaders
	users: any = []
	excel_email
	main_branch
	deleted_bill
	report_response: any = []
	report_table: boolean = false
	currentDate = new Date()
	public text = `{ "text": "This is text file!中文" }`;
	total_cash = 0
	total_network = 0
	delete_reason = null
	private headers: HttpHeaders
	attendanceArray: any = []
	deleted_bill_flag: boolean = false
	reportCreated = null
	reportAttendanceCreated = null
	selectedItems = [];
	reportValue = null
	data: { data: any[], sum: number, dates: any } = null
	mainData = []
	columns = []
	branches = []
	vatIncreaseDate = '5-7-2020'
	billId = null
	models = [
		{ value: 'bill', title: 'تقرير الفواتير' },
		{ value: 'deletedBills', title: 'تقرير الفواتير المحزوفة' },
		{ value: 'expense', title: 'تقرير المصروفات' },
		{ value: 'reservation', title: 'تقرير الحجوزات' },
		{ value: 'patient', title: 'تقرير المرضى الجدد' },
		{ value: 'vacation', title: 'تقرير  الاجازات' },
		{ value: 'attendance', title: 'تقرير  الحضور' },
	]
	types = [
		{ value: 'today', title: 'اليوم' },
		{ value: 'week', title: 'آخر 7 أيام' },
		{ value: 'month', title: 'الشهر الجارى' },
		{ value: 'year', title: 'السنة الجارية' },
		{ value: 'lifetime', title: 'منذ البداية' },
		{ value: 'dates', title: 'تحديد نطاق التاريخ' },
	]
	statuss = [
		{ value: 'reject', title: 'مرفوضة' },
		{ value: 'accept', title: ' موافقة ' },
	]
	AttendanceTypes = [
		{ value: 'today', title: 'اليوم' },
		{ value: 'week', title: 'آخر 7 أيام' },
		{ value: 'all', title: 'منذ البداية' },
	]
	saveAsArray = [
		{ value: 'pdf', title: 'حفظ ك PDF' },
		{ value: 'xlsx', title: 'حفظ ك Excel ' },
		{ value: 'docx', title: 'حفظ ك Word ' },

	]

	addModel = {
		model: null,
		type: null,
		dates: null,
		expense: 'all',
		patient: 'all',
		doctor: 'all',
		nationality: 'all',
		city: 'all',
		paymentType: 'all',
		billType: '',
		status: 'all',
		page: '1',



	}
	addAttendanceModel = {
		branch: this.globals.currentUser.branch,
		type: null,
		user: 'all'
	}
	patients = []
	doctors = []
	_cities = []
	expenses = []
	dropdownSettings = {
		singleSelection: false,
		idField: 'value',
		textField: 'title',
		selectAllText: 'Select All',
		unSelectAllText: 'UnSelect All',
		itemsShowLimit: 3,
		allowSearchFilter: false,
		enableCheckAll: false,
		closeDropDownOnSelection: false
	}
	exportAsConfig: ExportAsConfig = {
		type: 'pdf',
		elementId: 'reportMain',
		options: {
			orientation: 'landscape',
			margins: {
				top: '20'
			}
		}
	}

	exportExcelLink = ""

	constructor(private http: HttpClient, private _FileSaverService: FileSaverService, public api: ApiService, public globals: Globals, private exportAsService: ExportAsService) {
		api.init()
		this.authHeader = new HttpHeaders({ 'Authorization': `Bearer ${this.globals.currentUser ? this.globals.currentUser.token : null}`, 'Accept': 'application/json', 'Content-Type': 'application/json' })
	}

	ngOnInit() {
		let dateee = new Date()
		console.log(dateee);
		
		// console.log('login user',this.globals.currentUser);

		this.api.request(`${this.api.endPoints.patients}${this.globals.currentUser.branch}`, null, RequestTypes.PATCH).then(res => {
			this.patients = res.data.map(r => <Object>{ value: r._id, title: r.name_ar })
		})
		this.api.request(`${this.api.endPoints.doctors}${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.doctors = res.data.map(r => <Object>{ value: r._id, title: r.name })
			// console.log(this.doctors);

		})
		this.api.request(`${this.api.endPoints.expenseTypes}${this.globals.currentUser.branch}`, null, RequestTypes.PATCH).then(res => {
			this.expenses = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})

		this._cities = this.globals.cities.map(c => <Object>{ value: c, title: c })

		this.api.request(this.api.endPoints.allUsers + `${this.globals.currentUser.branch}`, null, RequestTypes.GET).then(res => {
			this.users = res.data.map(r => <Object>{ value: r._id, title: r.name })
		})
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.branches}`, null, RequestTypes.PATCH).then(res => {
				this.branches = res.data.map(i => i.branch).map(m => {
					return { value: m._id, title: m.name }
				})
				console.log('branches', this.branches);
				loading.hide()
			}, () => loading.hide())
		})
	}
	page: PageState = {
		currentPage: 1,
		numberOfPages: 1,
		pageSize: 1,
		totalItems: 1
	}

	pageChange(pageState: PageState) {
		this.page = pageState
		this.addModel.page = pageState.currentPage.toString()
		this.submitForm()
	}
	// onChange = () => {
	// 	console.log(this.addModel.model);
	// 	this.globals.loading(loading => {
	// 		this.api.request(null,null, RequestTypes.GET).then(res => {
	// 			this.deleted_bill_flag = true
	// 			loading.hide()
	// 		}, () => {
	// 			loading.hide()
	// 			this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
	// 		})
	// 	})

	// }
	deleteModal = () => {
		// console.log(this.billId);
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.delete_bill + this.billId}`, { deleteReason: this.delete_reason }, RequestTypes.DELETE).then(res => {
				loading.hide()
				this.submitForm()
				this.delete_modal.hide()
				this.globals.showToast('تم حذف الفاتورة بنجاح', '', NotificationTypes.Success)
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})


	}
	show_deletedResone = (id) => {
		this.deleted_bill = this.report_response.data.filter(item => item._id === id)[0]
		// console.log(this.deleted_bill[0]);

		this.review_modal.show()
	}
	download(): Observable<Blob> {
		this.addModel['isExcel'] = 'true'
		return this.http.post<Blob>(`${environment.apiURL}${this.api.endPoints.create_excel + this.globals.currentUser.branch}`, this.addModel,
			{ responseType: 'blob' as 'json', headers: this.authHeader });
	}
	create_excel_from_superAdmin() {
		let fileName = this.models.filter(res => res.value === this.addModel.model)
		this.globals.loading(loading => {
			this.download().subscribe(blob => {
				var type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
				var blob = new Blob([blob], { type: type });
				if (this.addModel.model == 'patient') {
					this.globals.showToast('جاري ارسال التقرير علي البريد الإلكتروني ', '', NotificationTypes.Success)
					
				} else {
					saveAs(blob, `${fileName[0].title}.xlsx`);
				}
				
				loading.hide()
			}, (error) => {
				// console.log("Something went wrong");
				loading.hide()
			})
		})

	}
	create_excel() {
		if (this.addModel.model == 'patient') {
			this.excel_mail_modal.show()
		} else {
			console.log('not patient');

			let fileName = this.models.filter(res => res.value === this.addModel.model)
			this.globals.loading(loading => {
				this.download().subscribe(blob => {
					var type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
					var blob = new Blob([blob], { type: type });
					saveAs(blob, `${fileName[0].title}.xlsx`);
					loading.hide()
				}, (error) => {
					// console.log("Something went wrong");
					loading.hide()
				})
			})
		}

	}
	download1(): Observable<Blob> {
		this.addModel['isExcel'] = 'true'
		this.addModel['email'] = this.excel_email
		return this.http.post<Blob>(`${environment.apiURL}${this.api.endPoints.create_excel + this.globals.currentUser.branch}`, this.addModel,
			{ responseType: 'blob' as 'json', headers: this.authHeader });
	}
	create_send_excel = () => {
		console.log('patient');

		let fileName = this.models.filter(res => res.value === this.addModel.model)
		this.globals.loading(loading => {
			this.download1().subscribe(blob => {
				var type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8";
				var blob = new Blob([blob], { type: type });
				// saveAs(blob, `${fileName[0].title}.xlsx`);
				this.globals.showToast('جاري ارسال التقرير علي البريد الإلكتروني ', '', NotificationTypes.Success)
				this.excel_mail_modal.hide()
				loading.hide()
			}, (error) => {
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
				// console.log("Something went wrong");
				loading.hide()
			})
		})
	}
	submitAttendanceForm = () => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.attendanceReport}`, this.addAttendanceModel, RequestTypes.POST).then(res => {
				if (!this.globals.isOnline)
					return

				res.filteredAttendenceBranch.forEach(element => {
					element['userId'] = element.user._id
					element['created_At'] = element.createdAt
					element.createdAt = element.createdAt.split('T')[0]
				})

				this.attendanceArray = []
				let _attendanceArray = this.globals.groupBy(res.filteredAttendenceBranch, 'userId')
				Object.keys(_attendanceArray).forEach(element => {
					let item = _attendanceArray[element]

					let dateGroup = this.globals.groupBy(item, 'createdAt')

					Object.keys(dateGroup).forEach(key => {
						let _item = dateGroup[key]

						let attendanceItem = {
							'name': item[0]['user']['name'],
							'mobile': item[0]['user']['mobile'],
							'date': key,
							'start': _item[0]['created_At'],
							'end': ''
						}

						if (_item.length > 1)
							attendanceItem['end'] = _item[_item.length - 1]['created_At']

						this.attendanceArray.push(attendanceItem)
					})
				})

				this.reportAttendanceCreated = 'تقرير  الحضور'
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}
	download_excel(ele) {
		// console.log(ele);

	}
	submitForm = () => {
		if (this.addModel.model != 'patient') {
			this.addModel['isExcel'] = 'false'

		}
		this.exportExcelLink = `${environment.apiURL}${this.api.endPoints.generate_excel + this.globals.currentUser.branch}?model=patient&type=lifetime&nationality=سعودى&isExcel=true`

		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.reports}create/${this.main_branch || this.globals.currentUser.branch}`, this.addModel, RequestTypes.POST).then(res => {
				this.report_response = res
				console.log(res);

				this.page = {
					currentPage: res.meta.currentPage,
					numberOfPages: res.meta.pages,
					pageSize: res.meta.perPage,
					totalItems: res.meta.total
				}

				if (!this.globals.isOnline)
					return

				this.mainData = res.data
				let keys = res.data.length > 0 ? Object.keys(res.data[0]) : []
				console.log(res.data);

				res.data.forEach(_data => {

					if (_data.doctor)
						_data.doctor = _data.doctor.name
					if (_data.patient)
						_data.patient = _data.patient
					// _data.patient_num = _data.patient.number

					if (_data.reservation) {
						_data.doctor = _data.reservation.doctor.name
						_data.patient = _data.reservation.patient.name_ar
						_data.patient_num = _data.reservation.patient.number
						delete _data.reservation
					}
					if (_data.bill && this.addModel.billType != 'all') {
						_data.bill.doctor = _data.bill.reservation.doctor.name
						_data.bill.patient = _data.bill.reservation.patient ? _data.bill.reservation.patient.name_ar : 'تم حذف المريض'
						_data.bill.user = _data.bill.user.name
						// delete _data.bill.reservation
					}
					if (_data.expense)
						_data.expense = _data.expense.name
					if (_data.time) {
						let _time = ''
						moment.locale('en')
						_time = moment(`1/1/1 ${_data.time}`).format('hh:mm')
						moment.locale('ar')
						_time += ` ${moment(`1/1/1 ${_data.time}`).format('A')}`

						_data.time = _time
					}
					if (_data.date) {
						let _date = _data.date
						// moment.locale('en')
						// _date = moment(_data.date).format('DD')
						// moment.locale('ar')
						// _date += ` ${moment(_data.date).format('MMMM')}`
						// moment.locale('en')
						// _date += ` ${moment(_data.date).format('YYYY')}`

						_data.date = _date
					}
					if (_data.bill && _data.bill.date) {
						let _date = _data.bill.date
						// moment.locale('en')
						// _date = moment(_data.bill.date).format('DD')
						// moment.locale('ar')
						// _date += ` ${moment(_data.bill.date).format('MMMM')}`
						// moment.locale('en')
						// _date += ` ${moment(_data.bill.date).format('YYYY')}`

						_data.bill.date = _date

					}

					moment.locale('en')

					if (this.addModel.model == 'bill' && this.addModel.billType == 'all') {
						_data.bill['vat'] = 0
						if (_data.bill.reservation.patient && _data.bill.reservation.patient.nationality != 'سعودى') {
							console.log(_data);

							_data.bill['vat'] = moment(_data.bill.date).isAfter('2020-07-05T00:00:00Z') ? (this.getInvoiceServicesTotal(_data) * 15) / 100 : (this.getInvoiceServicesTotal(_data) * 5) / 100
						}
					}

					keys.forEach(key => {
						if (key.includes('_')) {
							_data[key.replace(/_/g, '')] = typeof _data[key] == "object" ? JSON.parse(JSON.stringify(_data[key])) : _data[key]
							delete _data[key]
						}
					})
				})

				// if (this.addModel.model == 'bill' && this.addModel.billType == 'all')
				// 	res.data = res.data.map(d => <Object>{
				// 		...d.bill, 
				// 		services: d.services 
				// 	})
				if (this.addModel.model == 'bill' || this.addModel.model == 'deletedBills') {
					// && this.addModel.billType != 'all'

					res.data = res.data.map(d => {
						let amounts = {}
						if (d.paymentType)
							d.paymentType.forEach((paymentType, index) => {
								amounts[paymentType] = d.paymentTypeValues[index]
							})

						let paidAmount = d.bill.paidAmount
						let refundAmount = d.refundAmount

						delete d.bill.paidAmount

						return {
							...d.bill,
							...amounts,
							paidAmount,
							refundAmount,
							total: this.getInvoiceServicesTotal(d),
							remaining: this.getInvoiceServicesTotal(d) - paidAmount
						}
					})

				}
				console.log(res.data);
				let data_vat_percent = res.data.map(i => {
					console.log(i);
					if (moment(i.date).isAfter('2020-07-05T00:00:00Z')) {
						return { ...i, vat_percent: '15' }
					} else {
						return { ...i, vat_percent: '5' }
					}
				})
				console.log('xx', data_vat_percent);

				this.data = {
					data: data_vat_percent,
					sum: res.sum,
					dates: res.dates
				}
				console.log('this.data', this.data);


				this.total_cash = 0
				this.total_network = 0

				setTimeout(() => {
					if (this.addModel.model == 'bill') {
						this.data.data.forEach(element => {
							if (element.cash != null) {
								this.total_cash += element.cash
							}
							if (element.network != null) {
								this.total_network += element.network
							}
						});
					}
				}, 1);

				if (res.data.length > 0) {
					this.columns = Object.keys(res.data[0]).map(c => <Object>{ name: c })
				}
				else { this.columns = [] }

				this.reportCreated = this.models.find(m => m.value == this.addModel.model).title

				loading.hide()
			}, () => {
				this.reportCreated = null
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
	}

	oreventOutLine(e) {
		e.style.border = 'none'
	}

	resetForm = () => {
		this.form.reset()
		this.addModel.patient = 'all'
		this.addModel.doctor = 'all'
		this.addModel.nationality = 'all'
		this.addModel.city = 'all'
		this.addModel.expense = 'all'
		this.addModel.paymentType = 'all'
		this.reportCreated = null
	}

	printReport = (id) => {
		this.globals.loading(async loading => {
			let reportMain = <HTMLElement>document.getElementById(`invoice-${id}`)

			html2canvasOld(reportMain, {
				onrendered: (canvas: HTMLCanvasElement) => {
					printJS(canvas.toDataURL('image/jpeg', 1), 'image')
					loading.hide()
				},
			})

		})
	}
	printAttendanceReport = () => {
		this.globals.loading(async loading => {
			let reportMain = <HTMLElement>document.getElementById('reportMain')

			html2canvasOld(reportMain, {
				onrendered: (canvas: HTMLCanvasElement) => {
					printJS(canvas.toDataURL('image/jpeg', 1), 'image')
					loading.hide()
				},
			})

		})
	}
	selectSaveType(e) {
		this.saveAs(e);
	}

	saveAs = (type) => {
		this.exportAsConfig.type = type
		if (type === 'pdf') {
			this.exportAsConfig.elementId = 'reportMain'
		} else {
			this.exportAsConfig.elementId = 'xlsTable'
		}
		this.exportAsService.save(this.exportAsConfig, 'Report')
	}

	onItemSelect(item: any) {
		this.addModel.status = item.value
	}

	getInvoiceServicesTotal = (invoice) => {
		console.log('invoiceinvoice',invoice);

		let total = 0;
		if (invoice.services)
			invoice.services.forEach(service => {
				total += service.price
			})

		return total
	}

	formatNumber = (number) => new Intl.NumberFormat().format(number)

}
