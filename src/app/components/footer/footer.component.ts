import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Globals } from 'src/app/services/globals';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

	appVer = "1.0"

	constructor(public globals: Globals) {
		this.appVer = environment.appVersion
	}

	ngOnInit() {}

}
