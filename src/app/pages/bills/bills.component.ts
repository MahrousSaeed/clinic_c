import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ModalDirective } from 'ngx-bootstrap';
declare var html2canvasOld: any
declare var printJS: any
@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss']
})
export class BillsComponent implements OnInit {
  @ViewChild('BillHistoryModal', { static: true }) BillHistoryModal: ModalDirective
	@ViewChild('payBillsModal', { static: true }) payBillsModal: ModalDirective
  all_installments = []
  filter: string = ''
  bill_id=""
  sort: number = 1
  payment = {
    cash:0,
    network:0
  }
  
	data: Array<any> = []
	dataFiltered: Array<any> = []

	constructor(private api: ApiService, public globals: Globals) {
		api.init(api.endPoints.unpaid_bills)
	}

  ngOnInit() {
    
		this.globals.loading(loading => {
			this.api.request(this.api.endPoints.unpaid_bills,null,RequestTypes.GET).then(res => {
				this.data = res.data
        this.dataFiltered = res.data
        console.log('this.dataFiltered',this.dataFiltered);
        
				this.filterData()
				loading.hide()
			}, () => {
				loading.hide()
				this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
			})
		})
  }
  payBill = () => {
    console.log(this.payment);
    let data = {
      paymentType:['cash','network'],
      paymentTypeValues:[this.payment.cash,this.payment.network]
    }
    
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.payBill}${this.bill_id}`,data,RequestTypes.POST).then(res => {
        this.payBillsModal.hide()
        this.ngOnInit()
        this.globals.showToast('تم الدفع بنجاح', '', NotificationTypes.Success)
				loading.hide()

      },()=>{
        loading.hide()
        this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
      })
    })
    
  }
  printReport = (id) => {
    console.log(id);
    
		this.globals.loading(async loading => {
			let reportMain = <HTMLElement>document.getElementById(id)

			html2canvasOld(reportMain, {
				onrendered: (canvas: HTMLCanvasElement) => {
					printJS(canvas.toDataURL('image/jpeg', 1), 'image')
					loading.hide()
				},
			})
			
		})
	}
  getInstallments = () => {
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.all_installments}${this.bill_id}`,null,RequestTypes.GET).then(res => {
        console.log(res);
        this.all_installments = res.data
        this.BillHistoryModal.show()
        loading.hide()
      },()=> {
        loading.hide()
        this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
      })
    })
  }
  filterData = () => {
		this.dataFiltered = JSON.parse(JSON.stringify(this.data))

		this.dataFiltered = this.dataFiltered.filter(d => {
			let dataString = JSON.stringify(d).toLowerCase()
			return dataString.indexOf(this.filter.toLowerCase()) > -1
		})

		this.dataFiltered = this.dataFiltered.sort((a, b) => {
			let _a = new Date(a.createdAt).getTime(), _b = new Date(b.createdAt).getTime()
			return this.sort == 1 ? (_b - _a) : (_a - _b)
		})

		this.dataFiltered = JSON.parse(JSON.stringify(this.dataFiltered))
	}


}
