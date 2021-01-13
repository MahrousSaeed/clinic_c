import { Component, OnInit, ViewChild } from '@angular/core';
import { Globals } from 'src/app/services/globals';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { ModalDirective } from 'ngx-bootstrap';

@Component({
	selector: 'app-admin',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
	@ViewChild('branchesModal', { static: true }) branchesModal: ModalDirective
	deleted_branches = []
	latestAppVersion
	deleteId

	constructor(public globals: Globals, private api: ApiService) {
		if (this.globals.isOnline)
			this.api.request('/assets/config.json', null, RequestTypes.GET, false).then(data => {
				this.latestAppVersion = data.appVersion
			})
	}

	ngOnInit() {
		this.branchesModal.config = { backdrop: 'static', keyboard: false,  }
		this.globals.editBranch.subscribe(res =>{
			let modal = document.getElementById('branches_modal')
			modal.scrollTo(0,0)
			
		})
	}

	sendUpdate = () => {
		if (this.globals.isOnline)
			this.globals.socket.emit('custom', { type: 'admin', action: 'new-ver', to: [] })
	}
	deletedBranches = () => {
		this.globals.loading(loading => {
			this.api.request(this.api.endPoints.deleted_branches,null,RequestTypes.GET).then(res=> {
				this.deleted_branches = res.data
				loading.hide()
			}).catch(err=>{
				loading.hide()
			})
		})
	}
	restoreBranch = (id) => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.restore_branch}${id}`,null,RequestTypes.POST).then(res=> {
				loading.hide()
			}).catch(err=>{
				loading.hide()
			})
		})
	}
	forceDelete = () => {
		this.globals.loading(loading => {
			this.api.request(`${this.api.endPoints.force_delete}${this.deleteId}`,null,RequestTypes.POST).then(res=> {
				// this.deleted_branches = res.data
				loading.hide()
			}).catch(err=>{
				loading.hide()
			})
		})
	}

}
