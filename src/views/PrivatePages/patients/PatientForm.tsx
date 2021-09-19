import React, { Component, useState, useEffect } from 'react'

import { useHistory, useParams, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import InputCtrl from '../../../Controls/Input'
import InplaceConfirm from '../../../Controls/InplaceConfirm'
import AddressAutoComplete from '../../../Controls/AddressAutoComplete'
import AutoComplete from './AutoComplete'
import { Save, GetData, DeletePatient } from '../../../Services/Api'
import {
  GetParamsFromSearch,
  FormatDate,
  ShowAlert
} from '../../../Services/utility'
import moment from 'moment'
import MobileCtrl from '../../../Controls/MobileCtrl'
let initialValues = {
  firstName: '',
  lastName: '',
  preferredName: '',
  address: '',
  primaryNumber: '',
  secondaryNumber: '',
  admission: '',
  // NoOfWeeks: 0,
  // VisitsPerWeek: 0,
  notes: '',
  // UserId: 0,
  mdNumber: '',
  mdName: '',
  // CareTeamId: 0,
  teamLeader: null,
  ot: null,
  ota: null,
  pt: null,
  pta: null,
  slp: null,
  sn: null,
  aid: null,
  msw: null
  // CityName: 'string',
  // CityId: 0,
  // ZipCode: 'string',
  // Lat: 0,
  // Long: 0,
  // UnavailableTimeSlot: [
  //   {
  //     startdate: 'string',
  //     enddate: 'string'
  //   }
  // ]
}
let cb: any
const PatientForm: React.FC<any> = (props: any) => {
  const history = useHistory()
  const location: any = useLocation()
  const params = GetParamsFromSearch(location.search)
  //
  let [SyncAutoComplete, SetSyncAutoComplete] = useState<any>(null)
  const [ErrorObject, SetErrorObject] = useState({
    address: 0
  })
  let [PatientLocation, SetPatientLocation] = useState({
    address: '',
    cityName: '',
    lat: 0,
    long: 0
  })
  //

  //
  let [Data, SetData] = useState<any>({
    notes: '',
    sn: 0,
    aid: 0,
    pt: 0,
    pta: 0,
    ot: 0,
    ota: 0,
    msw: 0,
    slp: 0,
    teamLeader: 0
  })
  const [ErrorCollection, SetErrorCollection] = useState<any>({
    sn: false,
    aid: false,
    pt: false,
    pta: false,
    ot: false,
    ota: false,
    msw: false,
    slp: false,
    teamLeader: false
  })
  //
  const [EditMode, SetEditMode] = useState(false)
  const [PatientStatus, SetPatientStatus] = useState({
    Status: '',
    Flag: 0
  })

  const [ApiStaus, SetApiStatus] = useState<any>({
    InProgress: false,
    Failed: false,
    FailMessage: ''
  })

  //

  const { control, handleSubmit, errors, reset, getValues } = useForm<any>({
    defaultValues: initialValues,
    mode: 'onBlur' // when the you blur... check for errors
  })

  useEffect(() => {
    console.log(params, 'params')
    if (params.get('patient_id')) {
      let idx: any = params.get('patient_id')
      if (isNaN(idx)) {
        GoBack()
        return
      }
      SetEditMode(true)
      FetchPatientData()
    }
  }, [reset])

  const FetchPatientData = async () => {
    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      let result: any = await GetData(
        '/PatientProfile/Get?id=' + params.get('patient_id')
      )
      console.log('result', result)

      if (result.data) {
        //
        result = result.data

        reset({
          // ...result,
          firstName: result.firstName,
          lastName: result.lastName,
          preferredName: result.preferredName,
          primaryNumber: result.primaryNumber,
          secondaryNumber: result.secondaryNumber,
          mdName: result.mdName,
          mdNumber: result.mdNumber,
          admission: FormatDate(result.admission)
        })
        // Patient Status
        let temp: any = 'ACTIVE'
        if (result.status) {
          temp = result.status.toUpperCase()
        }
        SetPatientStatus({
          Status: temp,
          Flag: 0
        })
        //
        Data = { ...result }
        SetData({
          ...Data
        })
        SetSyncAutoComplete(true)
        setTimeout(() => {
          SetSyncAutoComplete(null)
        }, 0)
        //

        //
        PatientLocation = {
          address: result.address,
          cityName: result.cityName,
          lat: result.lat,
          long: result.long
        }
        SetPatientLocation({
          ...PatientLocation
        })
        if (cb) {
          cb(result.address)
        }
        //
      } else {
        throw result
      }

      SetApiStatus({
        ...ApiStaus,
        InProgress: false
      })
    } catch (err) {
      console.log('err', err)
      SetApiStatus({
        ...ApiStaus,
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

  const GoBack = () => {
    history.goBack()
  }

  const DischargePatient = async () => {
    // let status = 'Discharged'
    // if (PatientStatus.Status == 'DISCHARGED') status = 'Active'
    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true
      })
      let result = await GetData(
        `/PatientProfile/UpdatePatientStatus?patientId=${params.get(
          'patient_id'
        )}&status=${PatientStatus.Status}`
      )
      console.log(result, 'STATUS')
      if (result.data) {
        ShowAlert(result.message, 'success')
        SetPatientStatus({ ...PatientStatus, Flag: 0 })
      } else {
        throw result
      }
    } catch (err) {
      ShowAlert(err.message, 'error')
    } finally {
      SetApiStatus({
        ...ApiStaus,
        InProgress: false
      })
    }
  }

  const HandleAutoComplete = (selection: any, name: any) => {
    console.log('check', selection)
    ErrorCollection[name] = false
    if (!selection) {
      selection = {
        value: null,
        label: null
      }
      ErrorCollection[name] = true
      // return;
    }
    SetData({
      ...Data,
      [name]: selection.value
    })
    SetErrorCollection({
      ...ErrorCollection
    })
  }

  const OnSubmit = async (data: any) => {
    // Autocomplete fields validity
    let FormIsValid = true
    let keys = Object.keys(ErrorCollection)

    keys.forEach((key: string, index: any) => {
      // FormIsValid = !ErrorCollection[key] && FormIsValid
      // let predicate = Data[key]==0?true:
      FormIsValid = (Data[key] == 0 ? true : Data[key]) && FormIsValid
      //
      ErrorCollection[key] = Data[key] == 0 ? false : !Data[key]
      console.log()
      if (keys.length == index + 1) {
        console.log('form validity', keys, Data, FormIsValid)
        if (!FormIsValid) {
          console.log('invalid submission')
          SetErrorCollection({
            ...ErrorCollection
          })
          return
        } else {
          // return
          SavePatient(data)
        }
      }
    })

    //
  }

  const SavePatient = async (data: any) => {
    // Address validity
    if (PatientLocation.address === '') {
      SetErrorObject({
        ...ErrorObject,
        address: 1
      })
      return
    }
    //

    // SAVE PATIENT
    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })

      console.log(data, Data, 'SV')
      // return
      let Patient = {
        // for Autocomplete fields
        ...Data,
        // for fields FirstName, LastName, Address, so on...
        ...data,
        Address: PatientLocation.address,
        CityName: PatientLocation.cityName,
        Lat: PatientLocation.lat || 0,
        Long: PatientLocation.long || 0
      }

      if (EditMode) {
        Patient.Id = params.get('patient_id')
      }
      console.log('SV-patient', Patient)

      // debugger

      Patient.admission = Patient.admission + 'T00:00:00.000Z'

      // status on save
      if (PatientStatus.Flag == 1) {
        DischargePatient()
      }

      let svPatient: any = await Save(Patient)
      svPatient = { data: svPatient.data.data, message: svPatient.data.message }
      if (svPatient.data != null) {
        console.log(svPatient, 'redirect')
        GoBack()
        if (!EditMode) {
          setTimeout(() => {
            history.push('/patients/' + svPatient.data.id)
          }, 400)
        }
      } else {
        throw svPatient
      }

      SetApiStatus({
        ...ApiStaus,
        InProgress: false
      })
    } catch (err) {
      console.log('err', err)
      SetApiStatus({
        ...ApiStaus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
    //
  }

  const handleDelete = async () => {
    console.log('del patient record')

    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      let result: any = await DeletePatient(params.get('patient_id'))
      result = { data: result.data.data, message: result.data.message }
      if (result.message == 'Successful') {
        history.push('/patients')
      } else {
        throw result
      }
    } catch (err) {
      console.log(err.message, 'error')
      ShowAlert(err.message, 'error')
      SetApiStatus({
        ...ApiStaus,
        Failed: true,
        InProgress: false,
        FailMessage: ''
      })
    }
  }

  return (
    <div className='white-container'>
      <h2>
        Patient Details{' '}
        {EditMode ? (
          <span className='float-right'>#{params.get('patient_id')}</span>
        ) : null}
      </h2>

      <div className='user-form'>
        <form onSubmit={handleSubmit(OnSubmit)}>
          <div className='row'>
            <div className='col-md-12'>
              <p>
                <label>FIRST NAME</label>
                <InputCtrl
                  ID='user-firstname'
                  control={control}
                  showError={showError}
                  type='text'
                  placeholder='First Name'
                  name='firstName'
                  required={true}
                  className='form-control'
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>LAST NAME</label>
                <InputCtrl
                  ID='user-lastname'
                  control={control}
                  showError={showError}
                  type='text'
                  placeholder='Last Name'
                  name='lastName'
                  required={true}
                  className='form-control'
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>PREFERRED NAME</label>
                <InputCtrl
                  ID='user-preferredName'
                  control={control}
                  showError={showError}
                  type='text'
                  placeholder='Preferred Name'
                  name='preferredName'
                  required={false}
                  className='form-control'
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>ADDRESS</label>
                <AddressAutoComplete
                  id={'patientAddress'}
                  Data={(data: any) => {
                    console.log(data, 'popup')
                    SetErrorObject({
                      ...ErrorObject,
                      address: 0
                    })
                    SetPatientLocation({
                      address: data.address,
                      cityName: data.vicinity || data.address,
                      lat: data.lat,
                      long: data.long
                    })
                  }}
                  address={PatientLocation.address}
                  UnsetAddress={() => {
                    SetPatientLocation({
                      address: '',
                      cityName: '',
                      lat: 0,
                      long: 0
                    })
                  }}
                  SetAddress={(fn: any) => {
                    cb = fn
                  }}
                />
                <small>
                  The address is required to calculate route to patients in the
                  caseload process
                </small>
                {ErrorObject.address == 1 ? (
                  <div className='controller-outer'>
                    <div className='err-block'>
                      {'Please select an address from drop-down'}
                    </div>
                  </div>
                ) : null}
              </p>
              <p>
                <label>Primary Number</label>
                <MobileCtrl
                  control={control}
                  showError={showError}
                  placeholder='Primary Number'
                  type='tel'
                  className='form-control'
                  name='primaryNumber'
                  required={true}
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>Secondary Number</label>
                <MobileCtrl
                  control={control}
                  showError={showError}
                  placeholder='Secondary Number'
                  type='tel'
                  className='form-control'
                  name='secondaryNumber'
                  required={true}
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>MD Name</label>
                <InputCtrl
                  ID='user-mdName'
                  control={control}
                  showError={showError}
                  type='text'
                  placeholder='MD Name'
                  name='mdName'
                  required={true}
                  className='form-control'
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>MD Number</label>
                <MobileCtrl
                  control={control}
                  showError={showError}
                  placeholder='MD Number'
                  type='tel'
                  className='form-control'
                  name='mdNumber'
                  required={true}
                  disabled={ApiStaus.InProgress}
                />
              </p>
              <p>
                <label>Admission</label>
                <InputCtrl
                  ID='user-admission'
                  control={control}
                  showError={showError}
                  type='date'
                  placeholder='Admission'
                  name='admission'
                  required={true}
                  className='form-control'
                  disabled={ApiStaus.InProgress}
                />
              </p>
            </div>
            <div className='col-md-12 patient-form'>
              <p>
                <label>Team Leader</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({
                        value: Data.teamLeader,
                        label: Data.teamLeaderName
                      })
                    }}
                    Placeholder={'Select Team Leader'}
                    name={'teamLeader'}
                    endpoint={'/User/GetAll'}
                  />
                )}
                {ErrorCollection.teamLeader ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>OT</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.ot, label: Data.otname })
                    }}
                    Placeholder={'Select OT'}
                    name={'ot'}
                    endpoint={'/User/GetAll'}
                    roleName={'ot'}
                  />
                )}
                {ErrorCollection.ot ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>OTA</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.ota, label: Data.otaName })
                    }}
                    Placeholder={'Select OTA'}
                    name={'ota'}
                    endpoint={'/User/GetAll'}
                    roleName={'ota'}
                  />
                )}
                {ErrorCollection.ota ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>PT</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.pt, label: Data.ptName })
                    }}
                    Placeholder={'Select PT'}
                    name={'pt'}
                    endpoint={'/User/GetAll'}
                    roleName={'pt'}
                  />
                )}
                {ErrorCollection.pt ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>PTA</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.pta, label: Data.ptaName })
                    }}
                    Placeholder={'Select PTA'}
                    name={'pta'}
                    endpoint={'/User/GetAll'}
                    roleName={'pta'}
                  />
                )}
                {ErrorCollection.pta ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>SN</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.sn, label: Data.snName })
                    }}
                    Placeholder={'Select SN'}
                    name={'sn'}
                    endpoint={'/User/GetAll'}
                    roleName={'sn'}
                  />
                )}
                {ErrorCollection.sn ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>AID</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.aid, label: Data.aidName })
                    }}
                    Placeholder={'Select AID'}
                    name={'aid'}
                    endpoint={'/User/GetAll'}
                    roleName={'aid'}
                  />
                )}
                {ErrorCollection.aid ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>SLP</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.slp, label: Data.slpName })
                    }}
                    Placeholder={'Select SLP'}
                    name={'slp'}
                    endpoint={'/User/GetAll'}
                    roleName={'slp'}
                  />
                )}
                {ErrorCollection.slp ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
              <p>
                <label>MSW</label>
                {SyncAutoComplete || (
                  <AutoComplete
                    CallBack={HandleAutoComplete}
                    InitVal={(fn: any) => {
                      fn({ value: Data.msw, label: Data.mswName })
                    }}
                    Placeholder={'Select MSW'}
                    name={'msw'}
                    endpoint={'/User/GetAll'}
                    roleName={'msw'}
                  />
                )}
                {ErrorCollection.msw ? (
                  <span className='text-danger'>Required Field</span>
                ) : null}
              </p>
            </div>
            <div className='col-md-8'>
              {/* <p> */}
              <label>Notes</label>
              <textarea
                id='user-notes'
                // control={control}
                // showError={showError}
                // type='text'
                placeholder='Notes'
                name='notes'
                rows={8}
                required={false}
                className='form-control'
                onChange={(e: any) => {
                  SetData({
                    ...Data,
                    notes: e.target.value
                  })
                }}
                value={Data.notes}
                disabled={ApiStaus.InProgress}
              />
              {/* </p> */}
            </div>
          </div>
          <div className='row buttons'>
            <div className='col-md-6 text-left'>
              <button
                id='user-submit'
                type='submit'
                className='save'
                disabled={ApiStaus.InProgress}
              >
                {ApiStaus.InProgress ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                id='user-cancel'
                type='button'
                className='cancel'
                onClick={GoBack}
                disabled={ApiStaus.InProgress}
              >
                CANCEL
              </button>
              {EditMode ? (
                <button
                  type='button'
                  className={`discharge ${
                    PatientStatus.Status == 'DISCHARGED' ? 'to-activate' : ''
                  }`}
                  onClick={() => {
                    let status = 'Discharged'
                    if (PatientStatus.Status == 'DISCHARGED') status = 'Active'
                    SetPatientStatus({
                      Status: status.toUpperCase(),
                      Flag: PatientStatus.Flag == 0 ? 1 : 0
                    })
                  }}
                  disabled={ApiStaus.InProgress}
                >
                  {PatientStatus.Status == 'ACTIVE' ? 'DISCHARGE' : 'Activate'}
                </button>
              ) : null}
              {ApiStaus.Failed ? (
                <div>
                  <label className='text-danger'>{ApiStaus.FailMessage}</label>
                </div>
              ) : null}
            </div>

            <div className='col-md-6 text-right'>
              {EditMode ? (
                <InplaceConfirm
                  Action={handleDelete}
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

export default PatientForm
