import Dashboard from './views/PrivatePages/Dashboard/Dashboard'
import PatientDetail from './views/PrivatePages/patients/PatientDetail'
import PatientForm from './views/PrivatePages/patients/PatientForm'
import Patients from './views/PrivatePages/patients/Patients'
import Users from './views/PrivatePages/users/Users'
import UserDetail from './views/PrivatePages/users/UserDetail'
import DocumentsDue from './views/PrivatePages/DocumentsDue/DocumentsDue'
import PatientScheduling from './views/PrivatePages/PatientScheduling/PatientScheduling'
import PatientSchedule from './views/PrivatePages/PatientScheduling/PatientSchedule'
import ClinicianScheduling from './views/PrivatePages/Clinicians/ClinicianScheduling'
import ClinicianSchedule from './views/PrivatePages/Clinicians/ClinicianSchedule'
import Messaging from './views/PrivatePages/MessagingComponent/Messaging'
import LiveTracking from './views/PrivatePages/LiveTracking/LiveTracking'
import AgenciesList from './views/PrivatePages/Agencies/AgenciesList'
import AgencyForm from './views/PrivatePages/Agencies/AgencyForm'
import CaseloadView from './views/PrivatePages/Caseload/CaseloadView'
import FeatureInProgress from './Controls/FeatureInProgress'
import CardForm from './views/PrivatePages/CardPayment/CardForm'
import ClinicianDashboard from './views/PrivatePages/Dashboard/ClinicianDashboard'
import { GetAccessRoleWise } from './Services/utility'
import ScheduleView from './views/PrivatePages/_PatientScheduling/ScheduleView'

/*
0- SUPERADMIN
1- ADMIN
2- ADMIN USER SN OT PT SLP
3- USER SN OT PT SLP
4- ADMIN USER SN OT PT SLP MSW OTA PTA AID
*/

const routes = [
  // { path: '/', exact: true, name: '' },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/clinician-dashboard',
    name: 'Dashboard',
    component: ClinicianDashboard,
    accessTo: GetAccessRoleWise(3)
  },
  {
    path: '/patients/add',
    name: 'Patient Details',
    component: PatientForm,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/patients/:id',
    name: 'Patient Details',
    component: PatientDetail,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/patients',
    name: 'Patients',
    component: Patients,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/users/add',
    name: 'User Details',
    component: UserDetail,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/users/:user_id',
    name: 'User Details',
    component: UserDetail,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    accessTo: GetAccessRoleWise(1)
  },

  {
    path: '/documents-due',
    name: 'Documents Due',
    component: DocumentsDue,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/patient-scheduling/schedule',
    name: 'Patient Schedule',
    component: PatientSchedule,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/patient-scheduling',
    name: 'Patient Schedule',
    component: ScheduleView,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/caseload-scheduling/visit-schedule',
    name: 'Caseload Schedule',
    component: ClinicianSchedule,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/caseload-scheduling',
    name: 'Caseload Scheduling',
    component: ClinicianScheduling,
    accessTo: GetAccessRoleWise(2)
  },
  //
  {
    path: '/caseload-view',
    name: 'Caseload View',
    component: CaseloadView,
    accessTo: GetAccessRoleWise(4)
  },
  //
  {
    path: '/messaging',
    name: 'Messaging',
    component: Messaging,
    accessTo: GetAccessRoleWise(2)
  },
  {
    path: '/live-tracking',
    name: 'Live Tracking',
    component: LiveTracking,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/agency-setting',
    name: 'Agency Setting',
    component: AgencyForm,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/payment-method',
    name: 'Payment Method',
    component: CardForm,
    accessTo: GetAccessRoleWise(1)
  },
  {
    path: '/my-profile',
    name: 'Profile',
    component: UserDetail,
    accessTo: GetAccessRoleWise(3)
  },
  // Super Admin
  {
    path: '/agencies/add',
    name: 'Add Agency',
    component: AgencyForm,
    accessTo: GetAccessRoleWise(0)
  },
  {
    path: '/agencies/:agency_id',
    name: 'Edit Agency',
    component: AgencyForm,
    accessTo: GetAccessRoleWise(0)
  },
  {
    path: '/agencies',
    name: 'Agencies',
    component: AgenciesList,
    accessTo: GetAccessRoleWise(0)
  },
  {
    path: '/payment-history',
    name: 'Payment History',
    component: FeatureInProgress,
    accessTo: GetAccessRoleWise(0)
  },
  {
    path: '/payment-methods',
    name: 'Payment Methods',
    component: FeatureInProgress,
    accessTo: GetAccessRoleWise(0)
  }
]

export default routes
