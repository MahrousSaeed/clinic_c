import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { AppRoutingModule, routes } from './app-routing.module'

import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { ExportAsModule } from 'ngx-export-as';

import { AppComponent } from './app.component'
import { NgxSpinnerModule } from 'ngx-spinner'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { Interceptor } from './services/interceptor'
import { NavbarComponent } from './components/navbar/navbar.component'
import { SidebarComponent } from './components/sidebar/sidebar.component'
import { FooterComponent } from './components/footer/footer.component'
import { ToastrModule } from 'ngx-toastr'
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ModalModule, BsDatepickerModule, TooltipModule, BsLocaleService, defineLocale, arLocale, BsDropdownModule, TabsModule, AccordionModule } from 'ngx-bootstrap';

import { PatientProfilesComponent } from './pages/patient-profiles/patient-profiles.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { DoctorScreenComponent } from './pages/doctor-screen/doctor-screen.component';
import { SelectComponent } from './components/select/select.component';
import { BranchesComponent } from './pages/branches/branches.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { BlankLayoutComponent } from './layouts/blank-layout/blank-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NotUserGuard } from './services/guards/not-user/not-user-guard.service';
import { UserGuard } from './services/guards/user/user-guard.service';
import { UsersComponent } from './pages/users/users.component';
import { ContractsComponent } from './pages/contracts/contracts.component';
import { InputDebounceComponent } from './components/input-debounce/input-debounce.component';
import { InlineSpinnerComponent } from './components/inline-spinner/inline-spinner.component';
import { ServicesComponent } from './pages/services/services.component';
import { ContractServicesComponent } from './pages/contract-services/contract-services.component';
import { NgxPaginateModule } from 'ngx-paginate';
import { MomentModule } from 'ngx-moment';
import { ExpenseTypesComponent } from './pages/expense-types/expense-types.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { DoctorsComponent } from './pages/doctors/doctors.component';
import { DoctorsScheduleComponent } from './pages/doctors-schedule/doctors-schedule.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { VacationRequestsComponent } from './pages/vacation-requests/vacation-requests.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { NotificationPageComponent } from './pages/notification-page/notification-page.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { RatingComponent } from './pages/rating/rating.component';
import { AdminSettingsComponent } from './pages/admin-settings/admin-settings.component';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
// import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SuperAdminRatingComponent } from './pages/super-admin-rating/super-admin-rating.component';
const config: SocketIoConfig = { url: environment.socketURL, options: {} }
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { FileSaverModule } from 'ngx-filesaver';
import { CalendarModule, DateAdapter, CalendarDateFormatter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalenderComponent } from './components/calender/calender.component';

import { FlatpickrModule } from 'angularx-flatpickr';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common'
import {CustomDateFormatter} from '../app/components/calender/custom_calendar'
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { BillsComponent } from './pages/bills/bills.component';
import { ReturnsComponent } from './pages/returns/returns.component';

defineLocale('ar', arLocale)

@NgModule({
	declarations: [
		AppComponent,
		NavbarComponent,
		SidebarComponent,
		FooterComponent,
		PatientProfilesComponent,
		ReservationsComponent,
		DoctorScreenComponent,
		SelectComponent,
		BranchesComponent,
		LoginComponent,
		MainLayoutComponent,
		BlankLayoutComponent,
		DashboardComponent,
		UsersComponent,
		ContractsComponent,
		InputDebounceComponent,
		InlineSpinnerComponent,
		ServicesComponent,
		ContractServicesComponent,
		ExpenseTypesComponent,
		ExpensesComponent,
		DoctorsComponent,
		DoctorsScheduleComponent,
		ReportsComponent,
		VacationRequestsComponent,
		AttendanceComponent,
		NotificationPageComponent,
		NewPasswordComponent,
		AdminComponent,
		AdminDashboardComponent,
		RatingComponent,
		AdminSettingsComponent,
		SuperAdminRatingComponent,
		CalenderComponent,
		BillsComponent,
		ReturnsComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		RouterModule.forRoot(routes, { useHash: true }),
		AppRoutingModule,
		FormsModule,
		ExportAsModule,
		HttpClientModule,
		NgbModule,
		NgxSpinnerModule,
		ToastrModule.forRoot(),
		NgxDatatableModule,
		AngularMultiSelectModule,
		FileSaverModule,
		ReactiveFormsModule,
		ModalModule.forRoot(),
		TooltipModule.forRoot(),
		BsDatepickerModule.forRoot(),
		BsDropdownModule.forRoot(),
		MomentModule,
		CommonModule,
		CalendarModule.forRoot({
			provide: DateAdapter,
			useFactory: adapterFactory
		}),
		NgxPaginateModule,
		TabsModule.forRoot(),
		FlatpickrModule.forRoot(),
		MatSelectModule,
		NgxMaterialTimepickerModule,
		TimepickerModule.forRoot(),
		SocketIoModule.forRoot(config),
		ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
		AccordionModule.forRoot()
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true },
		// {
		// 	provide: CalendarDateFormatter,
		// 	useClass: CustomDateFormatter
		// },
		UserGuard,
		NotUserGuard,
		BsLocaleService
	],
	bootstrap: [AppComponent]
})
export class AppModule { }