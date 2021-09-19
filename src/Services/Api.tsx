import React from 'react'
import Axios from 'axios'
import * as utility from './utility'
import {
  IPatientDetailResponse,
  IPatients,
  PatientList
} from './Models/IPatients'
import { IUser } from './Models/IUser'
import { promises } from 'fs'

import { BASE_URL as base_url } from './utility'
// const base_url = 'https://apex-api.npit.info/api'
let temp: any = undefined

// Request
Axios.interceptors.request.use(
  function (config: any) {
    if (!config.url.toLowerCase().includes(utility.RunConfig.rcBaseURL)) {
      const token = utility.getUserToken()

      config.headers['X-Referer'] = 'WEB'
      console.log('refer', config)
      if (token !== null && token !== '') {
        config.headers.Authorization = `bearer ${token}`
      }

      if (temp != undefined) {
        config.data = temp
        temp = undefined
      }
    } else {
      let authToken = utility.readFromLocalStorage('authToken')
      let userId = utility.ValueFromUserData('rcUserId')
      if (authToken) {
        config.headers['X-Auth-Token'] = authToken
        config.headers.common['X-User-Id'] = userId
      }
    }
    return config
  },
  function (err) {
    return Promise.reject(err)
  }
)

//Response
Axios.interceptors.response.use(
  response => {
    return response
  },
  async function (error) {
    const originalRequest = error.config
    console.log(error, 'error')
    console.log(error.response, 'error')

    if (error.response != undefined) {
      if (error.response.status === 400) {
        console.log('error- 400')
        return Promise.reject(error)
      }

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        Axios.defaults.headers.common[
          'Authorization'
        ] = await `bearer ${utility.getUserToken()}`
        return Axios(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

// Login API
export function Login (user: Object) {
  return Axios.post(base_url + '/Auth/Login', user)
}

// GetData
export const GetData = async (END_POINT: string) => {
  var response = await Axios.get<any>(base_url + END_POINT)
  return {
    data: response.data.events || response.data.data,
    message: response.data.message,
    status: response.data.status
  }
}

//Patient API
export async function Patientlist (pageNumber: number, pageSize: number) {
  let res = await Axios.get<IPatients>(
    `${base_url}/PatientProfile/GetAll?pagenumber=${pageNumber}&pagesize=${pageSize}`
  )
  return res.data
}

export async function GetPatient (id: any) {
  let res = await Axios.get<IPatientDetailResponse>(
    base_url + '/PatientProfile/Get?id=' + id
  )
  return res.data
}

export function Save (obj: Object) {
  return Axios.post(base_url + '/patientProfile/Save', obj)
}

// USER API

export async function UserList (
  pageNumber: number | undefined = undefined,
  pageSize: number | undefined = undefined
) {
  if (pageNumber == undefined) {
    pageNumber = 1
    pageSize = 100
  }
  let res = await Axios.get<IUser>(
    base_url + `/User/GetAll?pagenumber=${pageNumber}&pagesize=${pageSize}`
  )
  return res.data
}

export async function DeletePatient (id: any) {
  let res = await Axios.delete(base_url + '/PatientProfile/Delete', {
    params: { id }
  })
  return res
}

// General //
export const GetAllRolesAPI = async () => {
  var response = await Axios.get<any>(`${base_url}/Role/GetAll`)
  return { data: response.data.data.items, message: response.data.message }
}

export const GetCountries = async () => {
  var response = await Axios.get<any>(base_url + '/Country/GetCountries')
  console.log(response)
  return { data: response.data.data.items, message: response.data.message }
}

export const GetStates = async (countryId: number) => {
  var response = await Axios.get<any>(
    base_url + '/Country/GetStates?countryid=' + countryId
  )
  console.log(response)
  return { data: response.data.data.items, message: response.data.message }
}

export const GetCities = async (stateId: number) => {
  var response = await Axios.get<any>(
    base_url + '/Country/GetCities?stateid=' + stateId
  )
  console.log(response)
  return { data: response.data.data.items, message: response.data.message }
}

// User

export const GetUserById = async (id: number) => {
  const response = await Axios.get(`${base_url}/User/Get`, {
    params: { id }
  })

  return response.data.data
}

export async function DeleteUser (id: any) {
  let res = await Axios.delete(base_url + '/User/Delete', {
    params: { id }
  })
  return res
}

export async function SaveUser (obj: Object) {
  let res = await Axios.post(base_url + '/User/Save', obj)
  return { data: res.data.data, message: res.data.message }
}

// POST DATA
export const PostData = async (END_POINT: string, body: any) => {
  var response = await Axios.post<any>(base_url + END_POINT, body)
  return {
    data: response.data.data,
    message: response.data.message,
    status: response.data.status
  }
}

// DELETE DATA
export const DeleteData = async (END_POINT: string, body: any = undefined) => {
  temp = body
  var response = await Axios.delete<any>(base_url + END_POINT)
  return { data: response.data.data, message: response.data.message }
}

// GET ME

export const ME = async () => {
  let result: any = await PostData('/User/Me', {})
  // console.log('me', result)
  return result
}
