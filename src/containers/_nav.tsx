import { GetAccessRoleWise } from '../Services/utility'

/*
0- SUPERADMIN
1- ADMIN
2- ADMIN USER SN OT PT SLP 
3- USER SN OT PT SLP 
4- ADMIN USER SN OT PT SLP MSW OTA PTA AID
*/

export default [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'fas fa-th-large',
    accessTo: GetAccessRoleWise(1)
  },
  {
    name: 'Dashboard',
    to: '/clinician-dashboard',
    icon: 'fas fa-th-large',
    accessTo: GetAccessRoleWise(3)
  },
  {
    name: 'Patients',
    to: '/patients',
    icon: 'fas fa-user-injured',
    accessTo: GetAccessRoleWise(2)
  },
  {
    name: 'Caseload Scheduling',
    to: '/caseload-view',
    icon: 'fas fa-clipboard-list',
    accessTo: GetAccessRoleWise(4)
  },
  {
    name: 'Patient Schedule',
    to: '/patient-scheduling',
    icon: 'fas fa-user-md',
    accessTo: GetAccessRoleWise(2)
  },
  {
    name: 'Documents Due',
    to: '/documents-due',
    icon: 'fas fa-file-medical-alt',
    accessTo: GetAccessRoleWise(2)
  },
  {
    name: 'Messaging',
    to: '/messaging',
    icon: 'far fa-comment-dots',
    accessTo: GetAccessRoleWise(2)
  },
  {
    name: 'Live Tracking',
    to: '/live-tracking',
    icon: 'fas fa-search-location',
    accessTo: GetAccessRoleWise(1)
  },
  {
    name: 'Users',
    to: '/users',
    icon: 'fas fa-users',
    accessTo: GetAccessRoleWise(1)
  },
  {
    name: 'Payment Method',
    to: '/payment-method',
    icon: 'far fa-credit-card',
    accessTo: GetAccessRoleWise(1)
  },
  {
    name: 'Settings',
    to: '/agency-setting',
    icon: 'fas fa-cogs',
    accessTo: GetAccessRoleWise(1)
  },
  // Teams- For Super Admin
  {
    name: 'Agencies',
    to: '/agencies',
    icon: 'far fa-list-alt',
    accessTo: GetAccessRoleWise(0)
  }
]
