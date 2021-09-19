import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import InputCtrl from '../../../Controls/Input'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import { useHistory, useParams } from 'react-router'
import InplaceConfirm from '../../../Controls/InplaceConfirm'
import AddressAutoComplete from '../../../Controls/AddressAutoComplete'
import SelectCtrl from '../../../Controls/SelectCtrl'
import {
  HourOptions,
  IsAdmin,
  ValueFromUserData,
  ShowAlert
} from '../../../Services/utility'
import { PostData, GetData, DeleteData } from '../../../Services/Api'
let cb: any = undefined
export const AgencyForm: React.FC<any> = (props: any) => {
  const history = useHistory()
  const params: any = useParams()
  const [EditMode, SetEditMode] = useState(false)
  let [FormDefaultValues, SetFormDefaultValues] = useState<any>({
    Hours: [],
    Plans: [
      { id: 'Clinician', name: 'Clinician' },
      { id: 'Clinician Pro', name: 'Clinician Pro' },
      { id: 'Agency', name: 'Agency' }
    ]
  })
  const [ApiStatus, SetApiStatus] = useState<IApiCallStatus>({
    InProgress: false,
    Failed: false,
    FailMessage: ''
  })
  const [ErrorObject, SetErrorObject] = useState({
    Address: 0
  })
  let [UserLocation, SetUserLocation] = useState({
    address: '',
    lat: 0,
    long: 0
  })
  const { control, handleSubmit, errors, reset, getValues } = useForm<any>({
    defaultValues: {},
    mode: 'onBlur' // when the you blur... check for errors
  })

  useEffect(() => {
    //
    FetchPlans()
    //
    let Hours: any[] = []
    HourOptions.forEach((option: any, index: any) => {
      if (index + 1 == HourOptions.length) {
        Hours.push({
          id: option,
          name: 'No Limit'
        })
        FormDefaultValues.Hours = [...Hours]
        SetFormDefaultValues({
          ...FormDefaultValues
        })
      } else {
        Hours.push({
          id: option,
          name: option
        })
      }
    })

    //
    if (params.agency_id || IsAdmin()) {
      let idx: any
      if (IsAdmin()) {
        idx = ValueFromUserData('agencyId')
      } else {
        idx = params.agency_id
      }

      if (isNaN(idx)) {
        GoBack()
        return
      }
      SetEditMode(true)
      FetchAgencyData(idx)
    }
  }, [])

  const FetchPlans = async () => {
    try {
      let result: any = await GetData('/Plan/GetAll')
      console.log('result', result)
      if (result.data) {
        let arr: any[] = []
        result.data.items.forEach((value: any) => {
          arr.push({
            id: value.id,
            name: value.name
          })
        })
        SetFormDefaultValues({
          ...FormDefaultValues,
          Plans: arr
        })
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
    }
  }

  const FetchAgencyData = async (idx: any) => {
    try {
      SetApiStatus({
        ...ApiStatus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })

      let _api = `/Agency/Get?id=` + idx

      if (IsAdmin()) {
        _api = `/Agency/GetAgencySetting`
      }

      let result: any = await GetData(_api)
      console.log('result', result)

      if (result.data) {
        //
        result = result.data
        reset({
          //   ...result
          Name: result.name,
          MaxSessionHours: result.maxSessionHours,
          IsActive: result.isActive ? 1 : 2,
          Email: result.email,
          PlanId: result.planId
        })

        //
        if (cb) cb(result.address)

        SetUserLocation({
          address: result.address,
          lat: result.latitude,
          long: result.longitude
        })
        //
      } else {
        throw result
      }

      SetApiStatus({
        ...ApiStatus,
        InProgress: false
      })
    } catch (err) {
      console.log('err', err)
      SetApiStatus({
        ...ApiStatus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
  }

  const showError = (_fieldName: string) => {
    let error = (errors as any)[_fieldName]
    return error ? (
      <div className='error-block'>{error.message || 'Field Is Required'}</div>
    ) : null
  }
  const OnSubmit = async (data: any) => {
    if (UserLocation.address === '') {
      SetErrorObject({
        ...ErrorObject,
        Address: 1
      })
      return
    }

    try {
      SetApiStatus({
        ...ApiStatus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      console.log('sv data', data)

      let SvAgency: any = {
        ...data,
        IsActive: data.IsActive == 1 ? true : false,
        Address: UserLocation.address,
        Latitude: UserLocation.lat,
        Longitude: UserLocation.long
      }

      if (EditMode && !IsAdmin()) {
        SvAgency.Id = params.agency_id
      }

      let result: any = await PostData('/Agency/Save', SvAgency)
      console.log('result', result)
      if (result.message == 'Successful' && !IsAdmin()) {
        GoBack()
      } else {
        throw result
      }
    } catch (err) {
      console.log(err.message, 'error')
      SetApiStatus({
        ...ApiStatus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
  }

  const HandleDelete = async () => {
    console.log('del action')

    try {
      SetApiStatus({
        ...ApiStatus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      let result: any = await DeleteData(
        `/Agency/Delete?id=${params.agency_id}`
      )
      //   result = { data: result.data.data, message: result.data.message }
      console.log(result)
      if (result.message == 'Successful') {
        GoBack()
      } else {
        throw result
      }
    } catch (err) {
      console.log(err.message, 'error')
      SetApiStatus({
        ...ApiStatus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
  }

  const GoBack = () => {
    history.goBack()
  }

  const CancelSubscription = async () => {
    if (ApiStatus.InProgress) return
    console.log('cancel sub')
    try {
      SetApiStatus({
        ...ApiStatus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      let idx: any
      if (IsAdmin()) {
        idx = ValueFromUserData('agencyId')
      } else {
        idx = params.agency_id
      }
      let result: any = await DeleteData('/User/CancelSubscription', {
        agencyId: idx
      })
      console.log('result', result)
      if (result.data) {
        ShowAlert(result.message, 'success')
      } else {
        throw result
      }
    } catch (err) {
      console.log(err.message, 'error')
      ShowAlert(err.message, 'error')
      SetApiStatus({
        ...ApiStatus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
  }

  return (
    <div className='white-container'>
      <h2>
        {IsAdmin() ? 'Settings' : 'Agency Details'}
        {EditMode && !IsAdmin() ? (
          <span className='float-right'>#{params.agency_id}</span>
        ) : null}
      </h2>

      <div className='user-form'>
        <form onSubmit={handleSubmit(OnSubmit)}>
          <div className='row'>
            <div className='col-md-12'>
              <p>
                <label>NAME OF AGENCY</label>
                <InputCtrl
                  control={control}
                  showError={showError}
                  type='text'
                  placeholder='Name'
                  name='Name'
                  required={true}
                  className='form-control'
                  disabled={ApiStatus.InProgress}
                />
              </p>
              <p>
                <label>AGENCY ADMIN EMAIL</label>
                <InputCtrl
                  control={control}
                  showError={showError}
                  type='email'
                  placeholder='Email'
                  name='Email'
                  required={true}
                  className='form-control'
                  disabled={ApiStatus.InProgress}
                />
              </p>
              <p>
                <label>
                  Max Session Hours{' '}
                  <i
                    className='far fa-question-circle hand'
                    title={
                      'The agency users will need to login again after these many hours.'
                    }
                  />
                </label>
                <SelectCtrl
                  control={control}
                  showError={showError}
                  placeholder='Select Max Session Hours'
                  name='MaxSessionHours'
                  required={true}
                  className='form-control'
                  options={FormDefaultValues.Hours}
                  disabled={ApiStatus.InProgress}
                />
              </p>
              <p>
                <label>Plan</label>
                <SelectCtrl
                  control={control}
                  showError={showError}
                  placeholder='Select Plan'
                  name='PlanId'
                  required={true}
                  className='form-control'
                  options={FormDefaultValues.Plans}
                  disabled={ApiStatus.InProgress || IsAdmin()}
                />
                {IsAdmin() || EditMode ? (
                  <InplaceConfirm
                    ClassName={'cancel-sub-confirm'}
                    Action={CancelSubscription}
                    HTMLComponent={
                      <small className='cancel-sub hand text-danger'>
                        CANCEL SUBSCRIPTION
                      </small>
                    }
                  />
                ) : null}
              </p>
              <p>
                <label>AGENCY ADDRESS</label>
                <AddressAutoComplete
                  id={'editAddress'}
                  Data={(data: any) => {
                    console.log(data, 'popup')
                    SetErrorObject({
                      ...ErrorObject,
                      Address: 0
                    })
                    SetUserLocation({
                      address: data.address,
                      lat: data.lat,
                      long: data.long
                    })
                  }}
                  address={UserLocation.address}
                  UnsetAddress={() => {
                    SetUserLocation({
                      address: '',
                      lat: 0,
                      long: 0
                    })
                  }}
                  SetAddress={(fn: any) => {
                    cb = fn
                  }}
                />
                <small>
                  Latitude: {UserLocation.lat} Longitude: {UserLocation.long}
                </small>
                {ErrorObject.Address == 1 ? (
                  <div className='controller-outer'>
                    <div className='err-block'>
                      {'Please select an address from drop-down'}
                    </div>
                  </div>
                ) : null}
              </p>
              {!IsAdmin() ? (
                <p>
                  <label>STATUS</label>
                  <SelectCtrl
                    control={control}
                    showError={showError}
                    placeholder='Select Status'
                    name='IsActive'
                    required={true}
                    className='form-control'
                    options={[
                      {
                        id: 1,
                        name: 'Active'
                      },
                      {
                        id: 2,
                        name: 'Inactive'
                      }
                    ]}
                    disabled={ApiStatus.InProgress}
                  />
                </p>
              ) : null}
            </div>
          </div>
          <div className='row buttons'>
            <div className='col-md-6 text-left'>
              <button
                id='user-submit'
                type='submit'
                className='save'
                disabled={ApiStatus.InProgress}
              >
                {ApiStatus.InProgress ? 'SAVING...' : 'SAVE'}
              </button>
              {!IsAdmin() ? (
                <button
                  id='user-cancel'
                  type='button'
                  className='cancel'
                  onClick={GoBack}
                  disabled={ApiStatus.InProgress}
                >
                  CANCEL
                </button>
              ) : null}
              {ApiStatus.Failed ? (
                <div>
                  <label className='text-danger'>{ApiStatus.FailMessage}</label>
                </div>
              ) : null}
            </div>

            <div className='col-md-6 text-right'>
              {EditMode && !IsAdmin() ? (
                <InplaceConfirm
                  Action={HandleDelete}
                  HTMLComponent={
                    <i className='fas fa-trash' id='delete-action'></i>
                  }
                />
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
export default AgencyForm
