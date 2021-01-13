import { Component, OnInit } from '@angular/core';
import { routes } from '../../app-routing.module';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
	public samplePagesCollapsed = true;

	menuItems = []

	constructor() {
		this.menuItems = routes.filter(r => r.path != '')
	}

	ngOnInit() {
	}

}
