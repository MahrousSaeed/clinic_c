import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';
import { Globals, NotificationTypes, Events } from 'src/app/services/globals';
import { ApiService, RequestTypes } from 'src/app/services/api/api.service';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'


@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit {
  @ViewChild('deleteEmployeeModal', { static: true }) deleteEmployeeModal: ModalDirective;
  @ViewChild('rateEmployeeModal', { static: true }) rateEmployeeModal: ModalDirective;
  @ViewChild('editEmployeeModal', { static: true }) editEmployeeModal: ModalDirective;
  managerFlag: boolean = false
  users = []
  allUsers = []
  roles = []
  ratingId
  rateRole
  rateUserId
  term = ''
  performance = 3
  behaviour = 3
  exterior = 3
  record
  outside_branches = []
  deleted_record_id = null
  editId = null
  branches = []
  branche = null
  modalRef: BsModalRef;
  rateDoctor: boolean = false
  rateUser
  adminBranchUsers = []
  ides = []
  doctorRate = {
    exterior: 1,
    impress: 1,
    quality: 1

  }
  addModel = {
    name: null,
    role: null
  }
  rateSystem: boolean = false
  adminRateSystem: boolean = false
  deleteAll = {
    users: []
  }
  currentRate = 3
  constructor(private modalService: BsModalService, public globals: Globals, private api: ApiService, config: NgbRatingConfig) {
    this.api.init(this.api.endPoints.BranchRatingUsers)
    config.max = 5;
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  ngOnInit() {
    Events.subscribe('rateOpend', res => {
      this.rateSystem = true
    })
    if (this.globals.currentUser) {
      // console.log('logged in');
      this.api.request(this.api.endPoints.adminBranch, { token: this.globals.currentUser.token }, RequestTypes.GET).then(res => {
        this.adminBranchUsers = res.results
        this.users = res.results
        this.rateSystem = res.system

        let doctors = res.results.filter(d => d.user.role.name === 'doctor')
        let other = res.results.filter(d => d.user.role.name !== 'doctor')
        this.users = [...doctors, ...other]
      })


    } else {
      console.log('logged out');

    }


    this.api.request(this.api.endPoints.outsideBranches, null, RequestTypes.GET).then(res => {
      this.outside_branches = res.data
      this.branches = res.data.map(i => {
        return { value: i._id, title: i.name }
      })

    })

    this.api.request(this.api.endPoints.ratedRoles, null, RequestTypes.GET).then(res => {
      this.roles = res.map(i => {
        if (i.name == 'doctor') {
          return { value: i._id, title: 'طبيب' }
        } else if (i.name == 'nurse') {
          return { value: i._id, title: 'ممرضة' }
        } else if (i.name == 'reception') {
          return { value: i._id, title: 'موظف استقبال' }
        } else if (i.name == 'accountant') {
          return { value: i._id, title: 'محاسب' }
        }
      })

    })

  }
  createRate() {
    if(this.globals.currentUser){
      let data
      if (this.rateRole !== 'doctor') {
        data = {
          exterior: this.exterior.toString(),
          behaviour: this.behaviour.toString(),
          performance: this.performance.toString(),
          role: this.rateRole,
          ratingId: this.ratingId,
          userId: this.rateUserId
        }
      } else {
        data = {
          exterior: this.doctorRate.exterior.toString(),
          quality: this.doctorRate.quality.toString(),
          impress: this.doctorRate.impress.toString(),
          role: this.rateRole,
          ratingId: this.ratingId,
          userId: this.rateUserId
        }
      }
      this.globals.loading(loading => {
        this.api.request(`${this.api.endPoints.adminCreateRate}`, data, RequestTypes.POST).then(res => {
          this.ngOnInit()
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'تم التقييم بنجاح',
            showConfirmButton: false,
            timer: 1500
          })
          loading.hide()
        }).catch(err => {
          loading.hide()
        })
      })
    } else {
      let data
      if (this.rateRole !== 'doctor') {
        data = {
          exterior: this.exterior.toString(),
          behaviour: this.behaviour.toString(),
          performance: this.performance.toString(),
          role: this.rateRole,
          ratingId: this.ratingId,
          rateUserId: this.rateUserId
        }
      } else {
        data = {
          exterior: this.doctorRate.exterior.toString(),
          quality: this.doctorRate.quality.toString(),
          impress: this.doctorRate.impress.toString(),
          role: this.rateRole,
          ratingId: this.ratingId,
          rateUserId: this.rateUserId
        }
      }
      this.globals.loading(loading => {
        this.api.request(`${this.api.endPoints.BranchRatingUsers+'create'}`, data, RequestTypes.POST).then(res => {
          this.ngOnInit()
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'تم التقييم بنجاح',
            showConfirmButton: false,
            timer: 1500
          })
          loading.hide()
        }).catch(err => {
          loading.hide()
        })
      })
    }
    setTimeout(() => {
      this.onSelectBranch()
    }, 200);
  }
  createArray = (num) => {
    let array = []
    for (let i = 0; i < num; i++) {
      array.push(i)
    }
    return array
  }
  sendToManager = () => {
    let nullRatings = this.users.filter(res => res.ratings === null)

    if (nullRatings.length === 0) {
      // if(created.length > 0){

      // }
      this.managerFlag = false
      this.globals.loading(loading => {
        this.api.request(`${this.api.endPoints.sendToMangar + this.branche}`, { token: this.globals.currentUser.token }, RequestTypes.GET).then(res => {

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'تم الارسال  بنجاح',
            showConfirmButton: false,
            timer: 1500
          })
          this.ngOnInit()
          this.onSelectBranch()
          loading.hide()
        }).catch(err => {
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'خطأ ...',
            text: 'تم ارسال الجميع من قبل ولا يوجد تحيث في البيانات! '
          })
          loading.hide()
        })
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'خطأ ...',
        text: 'برجاء التأكد من تقييم كل الموظفين اولا',
      })

    }

  }
  onSelectBranch = () => {
    this.deleteAll.users = []
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.BranchRatingUsers + 'all/'}${this.branche}`, null, RequestTypes.GET).then(res => {
        this.allUsers = res.results
        this.rateSystem = res.system

        let doctors = res.results.filter(d => d.user.role.name === 'doctor')
        let other = res.results.filter(d => d.user.role.name !== 'doctor')
        this.users = [...doctors, ...other]
        // this.users = res.results.map(res => {
        //   return {
        //     ...res,
        //     customRatings:
        //   }
        // })
        let selectedBranch = this.branches.find(res => {
          return res.value === this.branche
        })
        this.ratingId = selectedBranch.ratingID
        // this.dataFiltered = Object.assign([], this.data)
        // console.log('this.dataFiltered', this.dataFiltered);

        // this.filterData()
        loading.hide()
      }, () => {
        loading.hide()
        this.globals.showToast('حدث خطأ ما, يرجى المحاولة مرة أخرى!', '', NotificationTypes.Error)
      })
    })
  }
  onHidden() {
    this.addModel.name = null
    this.addModel.role = null

  }
  submitForm = () => {

    let data = {
      name: this.addModel.name,
      branch: this.branche,
      role: this.addModel.role,

    }
    this.globals.loading(loading => {
      this.api.create(data).then(res => {
        this.addModel.name = null
        this.addModel.role = null
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'تم الاضافةج  بنجاح',
          showConfirmButton: false,
          timer: 1500
        })
        this.onSelectBranch()
        this.deleted_record_id = null
        loading.hide()
      }).catch(err => {
        if (err.error.message = 'User with this name is exist in this branch') {
          Swal.fire({
            icon: 'error',
            title: 'خطأ ...',
            text: 'عفوا هذا الاسم موجود في هذا الفرع',
          })
        }
        loading.hide()
      })
    })
  }
  checkStatus(id, status) {
    let ratedRecord = this.users.find(res => {
      return res.user._id === id
    })
    this.addModel.name = ratedRecord.user.name
    this.addModel.role = ratedRecord.user.role._id
    if (ratedRecord.ratings) {
      if (ratedRecord.ratings.status === 'completed') {

        Swal.fire({
          icon: 'error',
          title: 'خطأ ...',
          text: 'لقد قمت بارسال التقييمات الي السوبر ادمن ',
        })
      } else {
        if (status === 'delete') {
          this.deleteEmployeeModal.show()
        } else {
          this.editEmployeeModal.show()
        }
      }
    } else {
      if (status === 'delete') {
        this.deleteEmployeeModal.show()
      } else {
        this.editEmployeeModal.show()
      }
    }
  }
  onChangeCheckbox = (index, id) => {
    let clickedElement = (<HTMLFormElement>document.getElementById(`${'check' + index}`))
    if (clickedElement.checked == true) {
      this.deleteAll.users.push(id)
    } else {
      this.deleteAll.users.splice(index, 1)

    }
  }
  filterData() {
    this.users = JSON.parse(JSON.stringify(this.allUsers))

    if (this.term != '') {
      this.users = this.users.filter(res => {
        let dataString = JSON.stringify(res).toLocaleLowerCase()
        return dataString.indexOf(this.term.toLocaleLowerCase()) > -1
      })
    }

    // this.users = data
    this.users = JSON.parse(JSON.stringify(this.users))

  }
  checkDoctor = (id) => {
    let ratedRecord
    if (this.globals.currentUser) {
      ratedRecord = this.adminBranchUsers.find(res => {
        return res.user._id === id
      })
    } else {
      ratedRecord = this.allUsers.find(res => {
        return res.user._id === id
      })
    }
    this.record = ratedRecord
    if (ratedRecord.ratings) {
      if (ratedRecord.ratings.status === 'completed') {

        Swal.fire({
          icon: 'error',
          title: 'خطأ ...',
          text: 'لقد قمت بارسال التقييمات الي السوبر ادمن ',
        })
      } else {
        this.rateEmployeeModal.show()
      }
    } else {
      this.rateEmployeeModal.show()

    }


    this.rateRole = ratedRecord.user.role.name
    this.rateUserId = ratedRecord.user._id
    if (ratedRecord.user.role.name === 'doctor') {
      this.rateDoctor = true

    } else {
      this.rateDoctor = false
    }

  }
  updateUser = () => {
    this.addModel['user'] = this.editId
    let data = {
      name: this.addModel.name,
      user: this.editId,
      role: this.addModel.role
    }
    this.globals.loading(loading => {
      this.api.request(this.api.endPoints.BranchRatingUsers, data, RequestTypes.PUT).then(res => {
        this.globals.showToast('تم الإضافة بنجاح!', '', NotificationTypes.Success)
        this.addModel.name = null
        this.addModel.role = null
        this.onSelectBranch()
        this.editId = null
        loading.hide()
      }).catch(err => {
        loading.hide()
      })
    })
  }
  delete = () => {
    this.globals.loading(loading => {
      this.api.delete(this.deleted_record_id, null, this.api.endPoints.BranchRatingUsers).then(res => {
        this.onSelectBranch()
        loading.hide();
        this.deleted_record_id = null

      })
        .catch(err => {

          loading.hide();
        })
    })

  }

  deleteAllSelected = () => {
    this.globals.loading(loading => {
      this.api.request(`${this.api.endPoints.BranchRatingUsers + 'delete_users'}`, this.deleteAll, RequestTypes.POST).then(res => {

        this.deleteAll.users = []
        this.onSelectBranch()
        loading.hide();
        this.deleted_record_id = null

      })
        .catch(err => {

          loading.hide();
        })
    })


  }
}
