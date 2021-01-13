import { Component, Input, Output, ElementRef, EventEmitter, forwardRef } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'input-debounce',
	templateUrl: './input-debounce.component.html',
	styleUrls: ['./input-debounce.component.scss'],
	providers: [{
		provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputDebounceComponent), multi: true
	}]
})
export class InputDebounceComponent implements ControlValueAccessor {
	@Input() placeholder: string
	@Input() name: string = ''
	@Input() Class: string = ''
	@Input() controlId: string = ''
	@Input() pattern: string = ''
	@Input() controlType: string = 'text'
    @Input() delay: number = 500
    @Output() valueChanged: EventEmitter<any> = new EventEmitter<any>()
    @Output() keyup: EventEmitter<any> = new EventEmitter<any>()

	public inputValue: string
	
	private onTouchedCallback: (_: any) => void = () => {}
    private onChangeCallback: (_: any) => void = () => {}

	get value(): any {
        return this.inputValue
	}
	set value(v: any) {
        if (v !== this.inputValue) {
            this.inputValue = v
            this.onChangeCallback(v)
        }
    }

    constructor(elementRef: ElementRef) {
        const eventStream = fromEvent(elementRef.nativeElement, 'keyup').pipe(
			map(() => this.inputValue),
            debounceTime(this.delay),
            distinctUntilChanged()
		)

        eventStream.subscribe(input => this.valueChanged.emit(input))
	}

	onKeyUp = (e) => {
		let charTyped = String.fromCharCode(e.which)
		if (/[a-z\d\u0600-\u06FF]/i.test(charTyped))
			this.keyup.emit(e)
	}
	
	writeValue(value: any): void {
		if (value !== this.inputValue)
			this.inputValue = value
	}

	registerOnChange(fn: any): void {
		this.onChangeCallback = fn
	}

	registerOnTouched(fn: any): void {
		this.onTouchedCallback = fn
	}
}
