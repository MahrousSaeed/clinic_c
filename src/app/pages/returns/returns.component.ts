import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { ModalDirective } from 'ngx-bootstrap';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import { ThrowStmt } from '@angular/compiler';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-returns',
  templateUrl: './returns.component.html',
  styleUrls: ['./returns.component.scss']
})
export class ReturnsComponent implements OnInit {
  @ViewChild('showBillModal', { static: true }) showBillModal: ModalDirective

  number
  data = []
  filterRange: Date[] = null
  mainBill

  amount: number
  dataFiltered = []
  constructor(private api: ApiService, private globals: Globals) {


  }

  ngOnInit() {
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.refund + 'filter/'}`, null, RequestTypes.POST).then(res => {
        console.log(res);
        this.dataFiltered = res.data
        console.log(' this.dataFiltered ', this.dataFiltered);
        loading.hide()
      })
    })
  }
  showBill = () => {
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.refund + this.number}`, null, RequestTypes.GET).then(res => {
        console.log('show bill', res);
        this.mainBill = res
        this.showBillModal.show()
       
        loading.hide()
      }, (e) => {
        console.log(e);
        if(e.error.message =="Could not find bill."){
          Swal.fire({
            icon: 'error',
            title: 'خطأ ...',
            text: 'عفوا رقم الفاتورة غير موجود ',
          })
        } else {
          this.globals.showToast('حدث خطأ برجاء المحاوبة مرة اخري  ', '', NotificationTypes.Error)
        }
        loading.hide()

      })
    })

  }
  // refund = () => {
  //   let data = {
  //     bill: this.mainBill.data._id,
  //     amount: this.amount.toString()
  //   }
  //   console.log('datadata', data);

  //   this.globals.loading(loading => {
  //     this.api.request(`${this.api.endPoints.refund}`, data, RequestTypes.POST).then(res => {
  //       console.log('refund bill', res);
  //       this.showBillModal.hide()
  //       this.globals.showToast('تم الاسترجاع بنجاح ', '', NotificationTypes.Success)
  //       this.amount = null
  //       this.ngOnInit()
  //       loading.hide()
  //     }, () => {
  //       this.globals.showToast('حدث خطأ برجاء المحاوبة مرة اخري  ', '', NotificationTypes.Error)
  //       loading.hide()

  //     })
  //   })

  // }
  onDateChange = (dates:Date[]) => {
    console.log(dates);
    // let value = dates.map(i => {
    //   return {i}
    // })
    
    console.log('filterRange',this.filterRange);
    
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.refund + 'filter/'}`,{dates:dates}, RequestTypes.POST).then(res => {
        console.log(res);
        this.dataFiltered = res.data
        console.log(' this.dataFiltered ', this.dataFiltered);
        loading.hide()
      })
    })
    
  }
  refundService=((id,price)=> {
    let data
    if(id && price){
       data = {
        bill: this.mainBill.data._id,
        amount:price.toString(),
        services:[id]
      }
    } else {
      data = {
        bill: this.mainBill.data._id,
        amount: this.amount.toString()
      }
    }


    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.refund}`, data, RequestTypes.POST).then(res => {
        console.log('refund bill', res);
        this.showBillModal.hide()
        this.globals.showToast('تم الاسترجاع بنجاح ', '', NotificationTypes.Success)
        this.amount = null
        // this.number = null
        this.ngOnInit()
        loading.hide()
      }, (e) => {
        console.log(e);
        
        if(e.error.message == "Refund amount greater than bill amount"||e.error.message == "maximum refund amount"){
          Swal.fire({
            icon: 'error',
            title: 'خطأ ...',
            text: 'عفوا لا يمكن استرجاع قيمة اكبر من اجمالي الفاتورة! ',
          })
        } else {
          this.globals.showToast('حدث خطأ برجاء المحاوبة مرة اخري  ', '', NotificationTypes.Error)
        }
        loading.hide()

      })
    })
  })

}
