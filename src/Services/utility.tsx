import React from 'react'
import * as chatService from './util/chat'

// export function getUserToken(userData): string {
//     return getUserObj() == null ? "" : getUserObj().token;
//   }

//   export function getUserToken(): string {
//     let data: any = localStorage.getItem("userData");
//     if (typeof data === "undefined" || data == null){
//         return ""
//     }
//       else { return JSON.parse(data) }
//   }

import _ from 'lodash'
import moment from 'moment'
import { ME } from './Api'
declare global {
  interface Window {
    google: any
    runConfig: any
    _x: any
  }
}

export const HourOptions = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24
]
export const HOURS = [
  '00:00 - 02:00',
  '02:00 - 04:00',
  '04:00 - 06:00',
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '22:00 - 00:00'
]
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]
export const MONTHS: any[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
export const IsStaging: boolean = window.location.href.includes(
  'apex-admin.netlify'
)
export const BASE_URL = IsStaging
  ? window.runConfig.StagingBaseURL
  : window.runConfig.LiveBaseURL
export const RunConfig = window.runConfig
export const SAMPLEPATIENTCSV: string =
  'https://api.logicly.ai/Upload/9a7deb54-d042-48f5-8a02-611f4c1c6417samplePatientUpload.xlsx'

window.google = window.google || {}

export var GOOGLE = window.google

function isJson (str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

export function readFromLocalStorage (key: any) {
  let data: any = localStorage.getItem(key)
  if (typeof data === 'undefined' || data == null) return null
  return isJson(data) ? JSON.parse(data) : data
}

export function getUserToken (): string {
  return getUserObj() == null ? '' : getUserObj().token
}

export function getUserObj () {
  return readFromLocalStorage('userData_Apex')
}

export const ValueFromUserData = (key: string) => {
  let UserData: any = getUserObj()

  if (UserData != undefined && UserData != null) {
    return UserData[key]
  } else {
    return ''
  }
}

export function setLocalStorage (key: any, value: any) {
  localStorage.setItem(key, value)
  return true
}

export function ChatLogin (CallBack: any = undefined) {
  let rcUserName = ValueFromUserData('rcUserName')
  let rcPassword = ValueFromUserData('rcPassword')
  if (!rcPassword || !rcUserName) {
    console.log("rocket chat credentials don't exist!")
    return
  }
  let obj = {
    user: rcUserName,
    password: rcPassword
    // user: ValueFromUserData("fullName"),
    // password: ValueFromUserData("id")
  }
  console.log('chat login', obj)
  chatService.login(obj, CallBack)
}

export function IsAdmin () {
  let temp: any = ValueFromUserData('roleName')
  return temp == 'ADMIN'
}

export function IsClinician () {
  let temp: any = ValueFromUserData('roleName')
  return temp == 'USER'
}

export function IsSuperAdmin () {
  let temp: any = ValueFromUserData('roleName')
  return temp == 'SUPERADMIN'
}

export function getRole (roleId: any) {
  let obj: any = {}

  if (roleId == 1) {
    obj.role = 'Admin'
    obj.color = 'purple_pill'
    return obj
  } else if (roleId == 2) {
    obj.role = 'User'
    obj.color = 'yellow_pill'
    return obj
  }
  // else if (roleId == 0) {
  //   obj.role = "Patient";
  //   obj.color = "green_pill";
  //   return obj;
  // }
  else {
    obj.role = 'N/A'
    obj.color = 'gray_pill'
    return obj
  }
}

export function getDate (
  val: any,
  _format: string = 'll',
  ReturnNull: boolean = false
) {
  if (val && new Date(val).getTime() > 0) {
    return moment(val)
      .utc()
      .format(_format)
  }
  if (ReturnNull) return null
  return 'N/A'
}

export function FormatDate (date: any, _format: string = 'YYYY-MM-DD') {
  if (date) {
    return moment(date)
      .utc()
      .format(_format)
  }
  return null
}

export function GetParamsFromSearch (query: string) {
  let temp = new URLSearchParams(query)
  return temp
}

export function getColor (type: any) {
  if (type == undefined) return 'green'
  if (type == 'Recert') return '#d40000'
  if (type == 'Discharge') return '#edd300'
  if (type == 'Evaluation') return '#ba96d7'
  if (type == '30DRE') return '#759ae0'
  if (type == 'RoutineVisit') return 'rgb(125, 184, 133)'
}

export async function navigateToGoogleMaps (
  lat: any,
  long: any,
  sourceLat: any = ValueFromUserData('lat'),
  sourceLong: any = ValueFromUserData('long')
) {
  // navigator.geolocation.getCurrentPosition(
  //   async pos => {
  //     console.log(pos, 'pos')

  // let startLat = pos['coords']['latitude']
  // let startLong = pos['coords']['longitude']

  window.open(
    'https://maps.google.com/maps?saddr=' +
      sourceLat +
      ',' +
      sourceLong +
      '&daddr=' +
      lat +
      ',' +
      long +
      '&amp;ll='
  )
  //   },
  //   () => {}
  // )
}

export async function GetCurrentCoordinates (CallBack: any) {
  navigator.geolocation.getCurrentPosition(
    async pos => {
      console.log(pos, 'coords position')
      CallBack(pos.coords)
    },
    (err: any) => {
      console.log(err, 'coords error')
      CallBack(err)
    }
  )
}

export async function SetCookie (
  cookie_key: string,
  data: string,
  expiresIn: number // in ms
) {
  console.log('cookie', cookie_key, data, expiresIn)
  // SET COOKIE //
  document.cookie =
    `${cookie_key} = ` +
    data +
    '; expires=' +
    new Date(new Date().getTime() + expiresIn).toUTCString() +
    ';'
}

export const GetCookieValue = (Key: string) => {
  var val = document.cookie.match('(^|[^;]+)\\s*' + Key + '\\s*=\\s*([^;]+)')
  return val ? val.pop() : ''
}

let _alert: any = undefined
export const SetAlertMethod = (alertMethod: any) => {
  if (!_alert) {
    _alert = alertMethod
  }
}

export const ShowAlert = (message: any, type: string = 'success') => {
  if (_alert) {
    if (type == 'error') {
      _alert.error(message)
    } else {
      _alert.show(message)
    }
  }
}

export const SORT = (
  column: any,
  idx: number,
  OriginalOrder: any[],
  CB: any = () => {}
) => {
  console.log('sorting...', `column-`, column)

  // _.sortBy default sort is asc
  let newSortState: string = ''
  let SORTED: any[] = _.sortBy(OriginalOrder, o => {
    if (column.sortType == 'date') {
      console.log('sorting... date')
      return new Date(o[column.accessor])
    } else {
      console.log('sorting... alpha')
      return o[column.accessor]
    }
  })

  console.log('sorting...', `after-sort-`, SORTED)

  if (column.sortState == 'asc') {
    newSortState = 'desc'
    SORTED.reverse()
  } else if (column.sortState == 'desc') {
    newSortState = ''
    console.log('sorting', OriginalOrder)
    SORTED = [...OriginalOrder]
  } else {
    newSortState = 'asc'
    // do nothing
  }

  if (CB) {
    CB(SORTED, newSortState, idx)
  }
}

export const GetAccessRoleWise = (level: any) => {
  if (level == 0) {
    return 'SUPERADMIN'
  } else if (level == 1) {
    return 'ADMIN'
  } else if (level == 2) {
    return 'ADMIN|USER|SN|OT|PT|SLP'
  } else if (level == 3) {
    return 'USER|SN|OT|PT|SLP'
  } else if (level == 4) {
    return 'ADMIN|USER|SN|OT|PT|SLP|MSW|OTA|PTA|AID'
  }
}

export const UTCNow = () => {
  return moment(new Date()).format('YYYY-MM-DD') + 'T00:00:00.000Z'
}

export const ManagePatientAllowed = () => {
  let role: any = ValueFromUserData('roleName')

  if (role) {
    role = role.toUpperCase()
    return (
      role == 'ADMIN' ||
      role == 'PT' ||
      role == 'OT' ||
      role == 'SN' ||
      role == 'SLP' ||
      role == 'USER'
    )
  }
  return false
}

export const UpdateUserDataInLocal = async () => {
  let _me: any = await ME()
  if (_me.data && _me.status == 200) {
    setLocalStorage('userData_Apex', JSON.stringify(_me.data))
  }
}

export const ReduceString = (text: any) => {
  if (typeof text != 'string') return ''
  return text.toLowerCase().replace(/ /g, '')
}
