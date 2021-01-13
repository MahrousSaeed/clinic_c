import { Component, Input, AfterViewInit, Renderer2, ViewChild } from '@angular/core';

@Component({
	selector: 'inline-spinner',
	templateUrl: './inline-spinner.component.html',
	styleUrls: ['./inline-spinner.component.scss']
})
export class InlineSpinnerComponent implements AfterViewInit {
	@ViewChild('main', { static: true }) main
	
	@Input() size: number = 25
	@Input() color: string = 'white'

	constructor(private renderer: Renderer2) { }

	ngAfterViewInit() {
		this.renderer.setAttribute(this.main.nativeElement, "style", `--size: ${this.size}; --color: ${this.color}`)
	}

}
