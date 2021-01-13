import { Component, ViewChild,OnInit } from '@angular/core';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
// import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Globals, NotificationTypes } from 'src/app/services/globals';
import * as moment from 'moment';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  @ViewChild('allSelected',{static:false}) private allSelected: MatOption;
  @ViewChild('addForm',{static:false}) private addForm;
  dataFiltered: Array<any> = []
  ratedBranches: Array<any> = []
  searchUserForm: FormGroup;

  selectedBranches = []
  data
  deleteId
  outBranchName = null
  outBranchAdminName = null
  toppings = new FormControl();
  branches = []
  addModel = {
    branch: null
  }
  selectBranchFlag:boolean = false
  // dropdownSettings = {
  // 	singleSelection: true,
  // 	idField: 'id',
  // 	textField: 'name',
  // 	selectAllText: 'Select All',
  // 	unSelectAllText: 'UnSelect All',
  // 	itemsShowLimit: 3,
  // 	allowSearchFilter: true
  // };
  dropdownSettings = {
    singleSelection: false,
    text: "Select Countries",
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    enableSearchFilter: true,
    classes: "myclass custom-class"
  };
  isOpen: boolean = false
  constructor(private api: ApiService, private globals: Globals,private fb: FormBuilder) {
    api.init(api.endPoints.rated_branches)
    this.isOpen = this.globals.global_rate_status
    const day = moment().format("D")
    if (day == '1') {
      this.isOpen = true

    } else {

    }
  }

  ngOnInit() {
    this.searchUserForm = this.fb.group({
      userType: new FormControl('')
    });
    this.checkStatus()

    this.globals.loading(loading => {
      this.api.request(this.api.endPoints.rated_branches, null, RequestTypes.GET).then(res => {

        this.data = res.data
        this.dataFiltered = Object.assign([], this.data)

        // this.filterData()
        loading.hide()
      }, () => {
        loading.hide()
        this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
      })
    })
    this.api.request(this.api.endPoints.branches, null, RequestTypes.PATCH).then(res => {

      this.branches = res.data.map(i => {
        return { value: i._id, title: i.name }
      })
    })
  }
  tosslePerOne(all){ 
    if (this.allSelected.selected) {  
     this.allSelected.deselect();
     return false;
 }
   if(this.searchUserForm.controls.userType.value.length == this.dataFiltered.length)
     this.allSelected.select();
 
 }
   toggleAllSelection() {
     if(this.allSelected.selected === true){
        let allBranches_ids = this.dataFiltered.map(res => res._id)
        this.selectedBranches  = allBranches_ids
     } else {
      this.selectedBranches = []
      
     }
     if (this.allSelected.selected) {

       this.searchUserForm.controls.userType
         .patchValue([...this.dataFiltered.map(item => item._id), 0]);
     } else {
       this.searchUserForm.controls.userType.patchValue([]);
     }
   }

  onChangeBranches = (event) => {
    this.selectedBranches = event.value
  }
  addOutBranch = () => {
    this.globals.loading(loading => {
      this.api.request(this.api.endPoints.add_branch_outside,{name:this.outBranchName,adminName:this.outBranchAdminName},RequestTypes.POST).then(res => {
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'تم الاضافة بنجاح',
          showConfirmButton: false,
          timer: 1500
        })
        
        loading.hide()

        this.addForm.reset()
        this.ngOnInit();
      })
      .catch((err)=> {
        console.log(err);
        
        if(err.error.message == 'Branch already exists with same name or admin with same name') {

          Swal.fire({
            icon: 'error',
            title: 'خطأ ...',
            text: 'عفوا هذا الفرع موجود من قبل ',
          })
        }
        loading.hide()
      })
    })
    
  }
  checkStatus() {
    this.api.request(this.api.endPoints.rateStatus, null, RequestTypes.GET).then(res => {
      this.ratedBranches = res.branches
      this.isOpen = res.value
      if(res.value == true) {
        this.selectBranchFlag = true

      }
    })
  }
  rating = () => {
    this.globals.secureStorage.setItem('rate_status', this.isOpen)

    // this.globals.loading(loading => {
    //   this.api.request(this.api.endPoints.openRate, { status: this.isOpen }, RequestTypes.PUT).then(res => {
    //     this.globals.showToast('تم فتح التقيم بنجاح', '', NotificationTypes.Success)

    //     loading.hide()
    //   })
    //     .catch(err => {
    //       this.globals.showToast('تم اغلاق التقيم بنجاح', '', NotificationTypes.Error)
    //       loading.hide()
    //     })
    // })


  }
  closeRating = () => {
    this.globals.loading(loading => {
      this.api.request(this.api.endPoints.openRate, { status: false }, RequestTypes.PUT).then(res => {
        loading.hide()
        this.ngOnInit()
        this.selectBranchFlag = false
        this.selectedBranches = []
        // this.ngOnInit()
      })
        .catch(err => {
          loading.hide()
        })
    })
  }
  openRating = () => {
    this.selectBranchFlag = true
  }
  rateBranches = () => {
    this.globals.loading(loading => {
      this.api.request(this.api.endPoints.openRate, { status: true,branches: this.selectedBranches }, RequestTypes.PUT).then(res => {
        this.globals.showToast('تم فتح التقيم بنجاح', '', NotificationTypes.Success)
        this.ngOnInit()

        
        loading.hide()
      })
        .catch(err => {
          loading.hide()
        })
    })
  }
  onItemSelect = (event) => {

  }
  onSelectBranch = () => {

  }
  submitForm = () => {
    // console.log(this.branch);

    this.globals.loading(loading => {
      this.api.create(this.addModel, this.api.endPoints.rating_add_branches).then(res => {
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'تم الاضافة بنجاح',
          showConfirmButton: false,
          timer: 1500
        })
        this.ngOnInit()
        loading.hide()
      }).catch(err => {
        if(err.error.message == 'Branch already exists with same name or admin with same name') {
          Swal.fire({
            icon: 'error',
            title: 'خطأ ...',
            text: 'عفوا هذا الفرع موجود من قبل ',
          })
        }


        loading.hide()
      })
    })
  }

  delete = () => {
    this.globals.loading(loading => {
      this.api.delete(this.deleteId, null, this.api.endPoints.rating_add_branches).then(res => {
        this.ngOnInit()
        loading.hide();

      })
        .catch(err => {

          loading.hide();
        })
    })

  }
}
