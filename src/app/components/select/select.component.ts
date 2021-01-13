import { Component, OnInit, Input, forwardRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
declare var moment: any

@Component({
	selector: 'select-dropdown',
	templateUrl: './select.component.html',
	styleUrls: ['./select.component.scss'],
	providers: [{
		provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true
	}]
})
export class SelectComponent implements OnInit, OnChanges, ControlValueAccessor {
	@Input() items: Array<{ value: any, title: string }> = []
	@Input() controlId: string = ''
	@Input() controlType: string = 'text'
	@Input() name: string = ''
	@Input() width: string = ''
	@Input() placeholder: string = ''
	@Input() isDisabled: boolean = false
	@Input() isSearchable: boolean = true
	@Input() showAll: boolean = false
	@Output() changed: EventEmitter<any> = new EventEmitter<any>()

	filter: string = ''
	itemsFiltered: Array<{ value: any, title: string }> = Object.assign([], this.items)

	currentValue = null
	currentFullValue = null

	private onTouchedCallback: (_: any) => void = () => { }
	private onChangeCallback: (_: any) => void = () => { }

	maxLength = 0

	get value(): any {
		return this.currentValue
	}
	set value(v: any) {
		if (v !== this.currentValue) {
			this.currentValue = v
			this.onChangeCallback(v)
		}
	}

	constructor() {
		this.maxLength = Math.max(Math.round(this.items.length / 2), 100)
	}

	ngOnInit() { }

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['items'] !== undefined) {
			this.items = changes['items'].currentValue
			this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		}
		else {
			this.items = []
			this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		}

		if (this.showAll) {
			let oldAllIndex = this.items.findIndex(i => i.value == 'all' && i.title == 'الكل')
			if (oldAllIndex > -1)
				this.items.splice(oldAllIndex, 1)
			this.items.unshift({ value: 'all', title: 'الكل' })
			this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		}
		else {
			let oldAllIndex = this.items.findIndex(i => i.value == 'all' && i.title == 'الكل')
			if (oldAllIndex > -1)
				this.items.splice(oldAllIndex, 1)
			this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		}
	}

	filterChanged = () => {
		if (this.isSearchable) {
			if (this.controlType == 'text') {
				if (this.filter != '')
					this.itemsFiltered = this.itemsFiltered.filter(i => i.title.toLowerCase().indexOf(this.filter.toLowerCase()) > -1).slice(0, this.maxLength)
				else
					this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
			}
			else {
				this.value = this.filter
				this.currentFullValue = {
					value: this.filter,
					title: this.controlType == 'time' ? moment(`1/1/1 ${this.filter}`).format('hh:mm A') : this.filter
				}
			}
		}
	}

	_hasFocus = false
	onFocus = () => {
		if (!this._hasFocus) {
			this._hasFocus = true
			setTimeout(() => {
				(<HTMLInputElement>document.querySelector(`#${this.controlId}.select-container input`)).focus()
			}, 100)
		}
	}
	onBlur = () => {
		this._hasFocus = false
		if (this.controlType == 'text' && this.filter == '') {
			this.filter = ''
			this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		}
	}

	itemSelected = (item, update = true) => {
		if (item && item !== undefined) {
			this.value = item.value
			this.currentFullValue = item
		}
		else {
			this.value = null
			this.currentFullValue = null
		}

		this.itemsFiltered = Object.assign([], this.items.slice(0, this.maxLength))
		this._hasFocus = false;
		(<HTMLInputElement>document.querySelector(`#${this.controlId}.select-container`)).blur()
		this.filter = ''

		if (update)
			this.changed.emit(this.value)
	}

	writeValue(value: any): void {
		if (value !== this.currentValue) {
			this.currentValue = value

			let item = this.items.find(i => i.value == value)
			this.itemSelected(item, false)
		}
	}

	registerOnChange(fn: any): void {
		this.onChangeCallback = fn
	}

	registerOnTouched(fn: any): void {
		this.onTouchedCallback = fn
	}

}
