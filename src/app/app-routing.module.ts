import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientProfilesComponent } from './pages/patient-profiles/patient-profiles.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { DoctorScreenComponent } from './pages/doctor-screen/doctor-screen.component';
import { BranchesComponent } from './pages/branches/branches.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { BlankLayoutComponent } from './layouts/blank-layout/blank-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NotUserGuard } from './services/guards/not-user/not-user-guard.service';
import { UserGuard } from './services/guards/user/user-guard.service';
import { UsersComponent } from './pages/users/users.component';
import { ContractsComponent } from './pages/contracts/contracts.component';
import { ServicesComponent } from './pages/services/services.component';
import { ContractServicesComponent } from './pages/contract-services/contract-services.component';
import { ExpenseTypesComponent } from './pages/expense-types/expense-types.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { DoctorsComponent } from './pages/doctors/doctors.component';
import { DoctorsScheduleComponent } from './pages/doctors-schedule/doctors-schedule.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { VacationRequestsComponent } from './pages/vacation-requests/vacation-requests.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { NotificationPageComponent } from './pages/notification-page/notification-page.component';
import { IsAdminGuard } from './services/guards/is-admin/is-admin.guard';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { IsSystemAdminGuard } from './services/guards/is-system-admin/is-system-admin.guard';
import { RatingComponent } from './pages/rating/rating.component';
import { AdminSettingsComponent } from './pages/admin-settings/admin-settings.component';
import { SuperAdminRatingComponent } from './pages/super-admin-rating/super-admin-rating.component';
// import { CalenderComponent } from './components/calender/calender.component';
import { BillsComponent } from './pages/bills/bills.component';
import { ReturnsComponent } from './pages/returns/returns.component';


export const routes: Routes = [
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{
		path: '',
		component: BlankLayoutComponent,
		children: [
			{
				path: 'login',
				component: LoginComponent,
				canActivate: [NotUserGuard]
			},
			{
				path: 'newpassword',
				component: NewPasswordComponent,
				canActivate: [NotUserGuard]
			}
		]
	},
	{
		path: 'dash',
		component: MainLayoutComponent,
		children: [
			{
				path: 'dashboard',
				data: { inMenu: false, roles: [] },
				component: DashboardComponent,
				canActivate: [UserGuard]
			},
			{
				path: 'notification',
				data: { inMenu: false, roles: [] },
				component: NotificationPageComponent,
				canActivate: [IsAdminGuard]
			},
			{
				path: 'profiles',
				data: { title: 'العملاء', icon: 'icon ion-md-people', roles: ['reception'] },
				component: PatientProfilesComponent,
				canActivate: [UserGuard]
			},
			{
				path: 'reservations',
				data: { title: 'الحجوزات', icon: 'icon ion-md-calendar', roles: ['reception'] },
				component: ReservationsComponent,
				canActivate: [UserGuard]
			},
			{
				path: 'vacation-requests',
				data: { inMenu: false, roles: [] },
				component: VacationRequestsComponent,
				canActivate: [IsAdminGuard]
			},

			{
				path: '',
				data: { title: 'قائمة التحكم', icon: 'icon ion-md-settings', roles: [] },
				children: [
					{
						path: 'branches',
						data: { title: 'الفروع', roles: [], hide: true },
						component: BranchesComponent,
						canActivate: [IsAdminGuard]
					},
					{
						path: 'users',
						data: { title: 'المستخدمين', roles: [] },
						component: UsersComponent,
						canActivate: [IsAdminGuard]
					},
					{
						path: 'doctors',
						data: { title: 'الأطباء', roles: [] },
						component: DoctorsComponent,
						canActivate: [IsAdminGuard]
					},
					{
						path: 'doctors-schedule',
						data: { title: 'جدول مواعيد الأطباء', roles: [] },
						component: DoctorsScheduleComponent,
						// canActivate: [IsAdminGuard]
					},
					// {
					// 	path: 'contracts',
					// 	data: { title: 'الشركات', roles: [] },
					// 	component: ContractsComponent,
					// 	canActivate: [UserGuard]
					// },
					{
						path: 'services',
						data: { title: 'الخدمات', roles: [] },
						component: ServicesComponent,
						canActivate: [IsAdminGuard]
					},
					// {
					// 	path: 'contract-services',
					// 	data: { title: 'خدمات الشركات', roles: [] },
					// 	component: ContractServicesComponent,
					// 	canActivate: [UserGuard]
					// },
					{
						path: 'expenses-types',
						data: { title: 'أنواع المصروفات', roles: [] },
						component: ExpenseTypesComponent,
						canActivate: [IsAdminGuard]
					},
					{
						path: 'rating',
						data: { title: 'التقييمات', roles: [] },
						component: RatingComponent,
					},
					{
						path: 'bills',
						data: { title: 'الفواتير الغير كاملة', roles: [] },
						component: BillsComponent,
					},
					{
						path: 'refunds',
						data: { title: 'المرتجعات', roles: [] },
						component: ReturnsComponent,
					},

				]
			},
			{
				path: 'expenses',
				data: { title: 'المصروفات', icon: 'icon ion-md-cash', roles: [] },
				component: ExpensesComponent,
				canActivate: [IsAdminGuard]
			},
			{
				path: 'reports',
				data: { title: 'التقارير', icon: 'far fa-chart-bar', roles: ['reception'] },
				component: ReportsComponent,
				canActivate: []
			},
			// {
			// 	path: 'calender',
			// 	data: { title: 'جدول', icon: 'far fa-chart-bar', roles: ['reception'] },
			// 	component: CalenderComponent,
			// 	canActivate: [UserGuard]
			// },
			{
				path: 'attendance',
				data: { title: 'الحضور ', icon: 'fas fa-users-cog', roles: ['reception'] },
				component: AttendanceComponent,
				canActivate: [ ]
			},

			{
				path: 'doctor-screen',
				data: { title: 'الطبيب | العميل الحالى', roles: ['doctor'], hide: true },
				component: DoctorScreenComponent,
				canActivate: [UserGuard]
			},

			{
				path: 'admincp',
				data: { title: 'شاشة التحكم', roles: [], hide: true },
				component: AdminComponent,
				canActivate: [IsSystemAdminGuard]
			},
			{
				path: 'admindb',
				data: { title: 'شاشة التحكم', roles: [], hide: true },
				component: AdminDashboardComponent,
				canActivate: [IsSystemAdminGuard]
			},
			{
				path: 'settings',
				data: { title: 'اعدادات', icon: 'fas fa-users-cog', roles: [], hide: true },
				component: AdminSettingsComponent,
				canActivate: [IsSystemAdminGuard]
			},
			{
				path: 'admins_rating',
				data: { title: 'اعدادات', icon: 'fas fa-users-cog', roles: [], hide: true },
				component: SuperAdminRatingComponent,
				canActivate: [IsSystemAdminGuard]
			},
		]
	},
]

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
