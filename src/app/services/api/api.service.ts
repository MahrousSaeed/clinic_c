import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Globals } from '../globals';
import { throwError, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ApiService {
	private apiURL: string = environment.apiURL
	private endPoint: string
	private authHeader: HttpHeaders

	public readonly endPoints = {
		branches: 'admin/branch/',
		users: 'admin/user/',
		rating_add_branches:'admin/rate/rate_branch/',
		openRate:'admin/settings/rate',
		delete_bill:'reception/reservation/accountant/delete_bill/',
		adminBranch:'admin/rate/all_branch_system_users',
		BranchRatingUsers:'admin/rate/',
		get_doctor_dates:'reception/reservation/get_doctor_dates/',
		generate_excel:'admin/reports/generate_create/',
		create_excel:'admin/reports/create/',
		add_branch_outside:'admin/rate/add_branch_outside',
		deleted_branches:'admin/branch/deleted_branches',
		force_delete:'admin/branch/force_delete_branch/',
		restore_branch:'admin/branch/restore_branch/',
		rateStatus:'admin/settings/rate/status',
		getAdmin:"admin/rate/branch/admin/",
		rating_dashboard:'admin/reports/rating_dashboard',
		rating_dashboard_details:'admin/reports/rating_dashboard_details',
		ratedRoles:'admin/rate/roles',
		sendToMangar:'admin/rate/send_to_manger/',
		rated_branches:'admin/rate/branches/rated',
		outsideBranches:'admin/rate/outside_branches',
		refund:'reception/refund/',
		rateAdmin:'admin/rate/rate_admin/',
		adminCreateRate:'admin/rate/rate_system_user/create',
		doctors: 'admin/user/doctors/',
		updateProfile:'admin/auth/update_profile',
		roles: 'admin/role/',
		contracts: 'admin/contract/',
		contractsServices: 'admin/contract/services/',
		patients: 'admin/patient/',
		patientsFilter: 'admin/patient/filter/',
		services: 'admin/service/',
		contractServices: 'admin/contract_service/',
		expenseTypes: 'admin/expense/',
		expenses: 'admin/expense_data/',
		schedule: 'admin/schedule/',
		reservations: 'reception/reservation/',
		reservationBill: 'reception/reservation/bill/',
		reservationsFilter: 'reception/reservation/filter/',
		reservationsStatuses: 'reception/reservation/statuses/all/',
		reports: 'admin/reports/',
		vacationRequest:'reception/vacation_request',
		allVacationRequest:'admin/vacation_request/',
		attendance:'admin/attendances/',
		notifications:'admin/reports/get-notifications/',
		forgetPassword:'admin/auth/forget-password',
		verifyToken:'admin/auth/verify-token',
		allDoctorReservations:'doctor/reservations',
		currentReservation:'doctor/reservations/current-patient',
		currentReservationHistory:'doctor/reservations/history',
		completePatient:'doctor/reservations/complete',
		allUsers:'admin/user/users/',
		attendanceReport:'admin/reports/filteredAttendance',
		offlineData:'reception/offline',
		unpaid_bills:'admin/reports/unpaid_bills',
		payBill:"reception/reservation/payinstallment/",
		all_installments:"reception/reservation/get-all-installments/"
	}

	constructor(private http: HttpClient, private globals: Globals) {}

	public init = (endPoint: string = '') => {
		this.endPoint = endPoint
		this.authHeader = new HttpHeaders({'Authorization': `Bearer ${this.globals.currentUser ? this.globals.currentUser.token : null}`, 'Accept': 'application/json', 'Content-Type': 'application/json'})
	}

	public all = (data: any = null, endPoint: string = null, appendApiUrl = true): Promise<any> => {
		let _endpoint = endPoint || this.endPoint

		if (!this.checkEndpoint(_endpoint, this.endPoints.patients) && 
			!this.checkEndpoint(_endpoint, this.endPoints.reservations) &&
			!this.checkEndpoint(_endpoint, this.endPoints.services))
			return this.http.patch(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}`, data, { headers: this.authHeader }).toPromise()
		else {
			if (this.globals.isOnline)
				return this.http.patch(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}`, data, { headers: this.authHeader }).toPromise()
			else {
				if (this.checkEndpoint(_endpoint, this.endPoints.patients))
					return this.globals.DBS[_endpoint.includes('offline_only=true') ? 'PATIENTS' : 'PATIENTS_ONLINE'].DB.allDocs({ include_docs: true })
				else if (this.checkEndpoint(_endpoint, this.endPoints.reservations))
					return this.globals.DBS.RESERVATIONS.DB.allDocs({ include_docs: true })
				else if (this.checkEndpoint(_endpoint, this.endPoints.services))
					return this.globals.DBS.SERVICES_ONLINE.DB.allDocs({ include_docs: true })
			}
		}
	}

	public create = (data: any, endPoint: string = null, appendApiUrl = true): Promise<any> => {
		let _endpoint = endPoint || this.endPoint
		
		if (!this.checkEndpoint(_endpoint, this.endPoints.patients) && 
			!this.checkEndpoint(_endpoint, this.endPoints.reservations) &&
			!this.checkEndpoint(_endpoint, this.endPoints.reservationBill))
			return this.http.post(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}`, data, { headers: this.authHeader }).toPromise()
		else {
			if (this.globals.isOnline)
				return this.http.post(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}`, data, { headers: this.authHeader }).toPromise()
			else {
				if (this.checkEndpoint(_endpoint, this.endPoints.patients)) {
					this.globals.DBS.PATIENTS_ONLINE.DB.post(data)
					return this.globals.DBS.PATIENTS.DB.post(data)
				}
				else if (this.checkEndpoint(_endpoint, this.endPoints.reservations))
					return this.globals.DBS.RESERVATIONS.DB.post(data)
			}
		}
	}

	public read = (id: any, additional: any = {}, endPoint: string = null, appendApiUrl = true): Promise<any> => {
		let _endpoint = endPoint || this.endPoint

		if (!this.checkEndpoint(_endpoint, this.endPoints.patients, id) && 
			!this.checkEndpoint(_endpoint, this.endPoints.reservations, id) &&
			!this.checkEndpoint(_endpoint, this.endPoints.doctors, id))
			return this.http.get(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, { params: additional, headers: this.authHeader }).toPromise()
		else {
			if (this.globals.isOnline)
				return this.http.get(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, { params: additional, headers: this.authHeader }).toPromise()
			else {
				if (this.checkEndpoint(_endpoint, this.endPoints.patients, id))
					return this.globals.DBS.PATIENTS.DB.get(id)
				else if (this.checkEndpoint(_endpoint, this.endPoints.reservations, id))
					return this.globals.DBS.RESERVATIONS.DB.get(id)
				else if (this.checkEndpoint(_endpoint, this.endPoints.doctors, id))
					return this.globals.DBS.DOCTORS_ONLINE.DB.allDocs({ include_docs: true })
			}
		}
	}

	public update = async (id: any, data: any, endPoint: string = null, appendApiUrl = true): Promise<any> => {
		let _endpoint = endPoint || this.endPoint

		if (!this.checkEndpoint(_endpoint, this.endPoints.patients, id) && 
			!this.checkEndpoint(_endpoint, this.endPoints.reservations, id))
			return this.http.put(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, data, { headers: this.authHeader }).toPromise()
		else {
			if (this.globals.isOnline)
				return this.http.put(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, data, { headers: this.authHeader }).toPromise()
			else {
				if (this.checkEndpoint(_endpoint, this.endPoints.patients, id)) {
					try {
						let doc = await this.globals.DBS.PATIENTS.DB.get(id)
						return this.globals.DBS.PATIENTS.DB.put({ _id: id, _rev: doc._rev, ...data })
					}
					catch (e) { throw throwError(e) }
				}
				else if (this.checkEndpoint(_endpoint, this.endPoints.reservations, id)) {
					try {
						let doc = await this.globals.DBS.RESERVATIONS.DB.get(id)
						return this.globals.DBS.RESERVATIONS.DB.put({ _id: id, _rev: doc._rev, ...data })
					}
					catch (e) { throw throwError(e) }
				}
			}
		}
	}

	public delete = async (id: any, additional: any = {}, endPoint: string = null, appendApiUrl = true): Promise<any> => {
		let _endpoint = endPoint || this.endPoint

		if (!this.checkEndpoint(_endpoint, this.endPoints.patients, id) && 
			!this.checkEndpoint(_endpoint, this.endPoints.reservations, id))
			return this.http.delete(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, { params: additional, headers: this.authHeader }).toPromise()
		else {
			if (this.globals.isOnline)
				return this.http.delete(`${appendApiUrl ? this.apiURL : ''}${endPoint || this.endPoint}${id ? id : ''}`, { params: additional, headers: this.authHeader }).toPromise()
			else {
				if (this.checkEndpoint(_endpoint, this.endPoints.patients, id)) {
					try {
						let doc = await this.globals.DBS.PATIENTS.DB.get(id)
						return this.globals.DBS.PATIENTS.DB.remove(doc)
					}
					catch (e) { throw throwError(e) }
				}
				else if (this.checkEndpoint(_endpoint, this.endPoints.reservations, id)) {
					try {
						let doc = await this.globals.DBS.RESERVATIONS.DB.get(id)
						return this.globals.DBS.RESERVATIONS.DB.remove(doc)
					}
					catch (e) { throw throwError(e) }
				}
			}
		}
	}

	public request = (endPoint: string, data: any, type: RequestTypes, appendApiUrl = true): Promise<any> => {
		if (type == RequestTypes.DELETE)
			return this.delete(null, data, endPoint, appendApiUrl)
		else if (type == RequestTypes.GET)
			return this.read(data && data.REQUEST_ID ? data.REQUEST_ID : null, data, endPoint, appendApiUrl)
		else if (type == RequestTypes.PATCH)
			return this.all(data, endPoint, appendApiUrl)
		else if (type == RequestTypes.POST)
			return this.create(data, endPoint, appendApiUrl)
		else if (type == RequestTypes.PUT)
			return this.update(null, data, endPoint, appendApiUrl)
	}

	private checkEndpoint = (endPoint, checkEndPoint, id = null) => 
		(endPoint == checkEndPoint) || (endPoint == `${checkEndPoint}${id ? id : ''}`) || endPoint.startsWith(`${checkEndPoint}${this.globals.currentUser ? this.globals.currentUser.branch : ''}`)
}

export enum RequestTypes {
	POST, GET, PUT, DELETE, PATCH
}