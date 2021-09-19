import React, { Component, useState, useEffect } from 'react'

import { useHistory, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
// import { SaveUser, GetUserById, DeleteUser } from '../../../common/apiServices'
import InputCtrl from '../../../Controls/Input'
import InplaceConfirm from '../../../Controls/InplaceConfirm'
import SelectCtrl from '../../../Controls/SelectCtrl'
import * as API from '../../../Services/Api'
import { LoaderComponent } from '../../../Controls/Loader'
import AddressAutoComplete from '../../../Controls/AddressAutoComplete'
import {
  IsClinician,
  ValueFromUserData,
  ShowAlert,
  UpdateUserDataInLocal
} from '../../../Services/utility'
let initialValues = {
  FirstName: '',
  LastName: '',
  Email: '',
  Address: ''
}

const UserDetail: React.FC<any> = (props: any) => {
  const history = useHistory()
  const params: any = useParams()
  const [haveData, SetHaveData] = useState(false)
  const [EditMode, SetEditMode] = useState(false)

  const [ApiStaus, SetApiStatus] = useState<any>({
    InProgress: false,
    Failed: false,
    FailMessage: ''
  })

  //

  let [InitFormValues, SetInitForm] = useState<any>({
    roles: []
    // countries: [],
    // states: [],
    // cities: []
  })

  // //
  // const [UserLocationDetails, SetUserLocationDetails] = useState({
  //   CountryId: '',
  //   StateId: '',
  //   CityId: ''
  // })

  const [ErrorObject, SetErrorObject] = useState({
    // CountryId: 0,
    // StateId: 0,
    // CityId: 0,
    Address: 0
  })
  // //

  let [UserLocation, SetUserLocation] = useState({
    address: '',
    lat: 0,
    long: 0,
    cityName: ''
  })

  const { control, handleSubmit, errors, reset, getValues } = useForm<any>({
    defaultValues: initialValues,
    mode: 'onBlur' // when the you blur... check for errors
  })

  useEffect(() => {
    const InitFormData = async () => {
      let Roles = await API.GetAllRolesAPI()
      let roles = Roles.data.map((role: any) => ({
        id: role.id,
        name: role.name
      }))

      // let Countries = await API.GetCountries()

      InitFormValues.roles = roles
      // InitFormValues.countries = Countries.data

      SetInitForm({
        ...InitFormValues,
        roles: roles
        // countries: Countries.data
        // states: [],
        // cities: []
      })
      console.log(params.user_id)
    }

    loadUser()
    InitFormData()
  }, [reset])

  const loadUser = async () => {
    let { user_id }: any = params
    if (IsClinician()) user_id = ValueFromUserData('id')
    console.log(user_id, 'ok')
    if (user_id) {
      SetEditMode(true)
      user_id = Number(user_id)

      const user = await API.GetUserById(user_id)
      // const user: IUser = userResult.data;
      console.log(user, 'user')
      //

      // const address = user.primaryAddressDetails
      //
      if (!user) {
        GoBack()
        return
      }
      reset({
        FirstName: user.firstName,
        LastName: user.lastName,
        RoleId: user.roleId,
        Email: user.email,
        Address: user.address
      })
      SetUserLocation({
        address: user.address,
        lat: user.lat,
        long: user.long,
        cityName: user.cityName
      })

      SetHaveData(true)

      // const stateResult: any = await API.GetStates(user.countryId)
      // const cityResult: any = await API.GetCities(user.stateId)

      // SET INIT VALS FOR STATE AND CITY
      // SetInitForm({
      //   ...InitFormValues,
      //   states: stateResult.data,
      //   cities: cityResult.data
      // })

      // SetUserLocationDetails({
      //   CountryId: user.countryId,
      //   StateId: user.stateId,
      //   CityId: user.cityId
      // })
    } else {
      SetHaveData(true)
    }
  }

  const showError = (_fieldName: string) => {
    let error = (errors as any)[_fieldName]
    return error ? (
      <div className='error-block'>{error.message || 'Field Is Required'}</div>
    ) : null
  }

  const handleDelete = async () => {
    console.log('del-action')
    console.log('del')

    let { user_id }: any = params

    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })
      if (user_id) {
        user_id = Number(user_id)
        if (isNaN(user_id) === false) {
          const result = await API.DeleteUser(user_id)
          console.log(result)
          GoBack()
        }
      }
      SetApiStatus({
        ...ApiStaus,
        InProgress: false
      })
    } catch (err) {
      console.log(err.message)
      SetApiStatus({
        ...ApiStaus,
        Failed: true,
        InProgress: false,
        FailMessage: err.message
      })
    }
  }

  const onSubmit = async (data: any) => {
    validateSelectInputs(data)
  }

  const validateSelectInputs = async (data: any) => {
    // if (UserLocationDetails.CountryId === '') {
    //   SetErrorObject({
    //     ...ErrorObject,
    //     CountryId: 1
    //   })
    //   return
    // }
    // if (UserLocationDetails.StateId === '') {
    //   SetErrorObject({
    //     ...ErrorObject,
    //     StateId: 1
    //   })
    //   return
    // }
    // if (UserLocationDetails.CityId === '') {
    //   SetErrorObject({
    //     ...ErrorObject,
    //     CityId: 1
    //   })
    //   return
    // }

    if (UserLocation.address === '') {
      SetErrorObject({
        ...ErrorObject,
        Address: 1
      })
      return
    }
    // UserLocationDetails.CountryId !== '' &&
    // UserLocationDetails.StateId !== '' &&
    // UserLocationDetails.CityId !== '' &&
    if (UserLocation.address !== '') {
      UserSave(data)
    }
  }

  const UserSave = async (data: any) => {
    // return;
    try {
      SetApiStatus({
        ...ApiStaus,
        InProgress: true,
        FailMessage: '',
        Failed: false
      })

      console.log('Sv', data)
      // return
      let User = {
        // for fields FirstName, LastName, Address, RoleId, Email
        ...data,
        // Password: '123456',
        // CityId: UserLocationDetails.CityId,
        CityName: UserLocation.cityName,
        Address: UserLocation.address,
        Lat: UserLocation.lat,
        Long: UserLocation.long
      }

      if (EditMode) {
        if (IsClinician()) {
          User.Id = ValueFromUserData('id')
        } else {
          User.Id = params.user_id
        }
        User.Password = data.Password || ''
      }
      console.log('sv-user', User)

      let svUser: any = await API.SaveUser(User)
      if (svUser.data != null) {
        if (IsClinician()) {
          // Updation
          let temp: any = localStorage.getItem('userData_Apex')
          if (!temp) throw svUser

          let data: any = svUser.data
          temp = JSON.parse(temp)

          temp = {
            ...temp,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: data.fullName,
            email: data.email
          }
          localStorage.setItem('userData_Apex', JSON.stringify(temp))
          ShowAlert(svUser.message)
          SetApiStatus({
            ...ApiStaus,
            Failed: false,
            InProgress: false,
            FailMessage: ''
          })
          return
        }

        //
        if (svUser.data.id === ValueFromUserData('id')) UpdateUserDataInLocal()
        //

        console.log(svUser, 'redirect')
        history.push('/users')
      } else {
        throw svUser
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

  const GoBack = () => {
    history.push('/users')
  }

  // const handlChange = async (e: any) => {
  //   // error resete
  //   if (
  //     ErrorObject.CountryId == 1 ||
  //     ErrorObject.StateId == 1 ||
  //     ErrorObject.CityId == 1
  //   ) {
  //     SetErrorObject({
  //       ...ErrorObject,
  //       CountryId: 0,
  //       StateId: 0,
  //       CityId: 0
  //     })
  //   }
  //   console.log('test', e)
  //   // null check
  //   if (e.target == null) {
  //     return
  //   }
  //   let target = e.target
  //   let name = target.name
  //   let value = target.value
  //   if (name == undefined || value == undefined) {
  //     return
  //   }
  //   console.log('select', name, value, UserLocationDetails, InitFormValues)
  //   // State
  //   if (name === 'CountryId') {
  //     // sv val country
  //     SetUserLocationDetails({
  //       ...UserLocationDetails,
  //       [name]: value,
  //       StateId: '',
  //       CityId: ''
  //     })

  //     // Reset
  //     // SetInitForm({
  //     //   ...InitFormValues,
  //     //   states: [],
  //     //   cities: []
  //     // })
  //     let res = await API.GetStates(value)
  //     console.log(res, 'test')
  //     SetInitForm({
  //       ...InitFormValues,
  //       states: res.data,
  //       cities: []
  //     })
  //   }
  //   // City
  //   if (name == 'StateId') {
  //     // sv val state
  //     SetUserLocationDetails({
  //       ...UserLocationDetails,
  //       [name]: value,
  //       CityId: ''
  //     })
  //     // Reset
  //     // SetInitForm({
  //     //   ...InitFormValues,
  //     //   cities: []
  //     // })
  //     let res = await API.GetCities(value)
  //     console.log(res, 'test')
  //     SetInitForm({
  //       ...InitFormValues,
  //       cities: res.data
  //     })
  //   } else {
  //     // sv val city
  //     SetUserLocationDetails({
  //       ...UserLocationDetails,
  //       [name]: value
  //     })
  //     //
  //   }
  // }

  return (
    <div className='white-container'>
      <h2>
        {IsClinician() ? 'My Profile' : 'User Details'}
        {EditMode && !IsClinician() ? (
          <span className='float-right'>#{params.user_id}</span>
        ) : null}
      </h2>
      {haveData ? (
        <div className='user-form'>
          <form onSubmit={handleSubmit(onSubmit)}>
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
                    name='FirstName'
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
                    name='LastName'
                    required={true}
                    className='form-control'
                    disabled={ApiStaus.InProgress}
                  />
                </p>
                <p>
                  <label>ROLE</label>
                  <SelectCtrl
                    ID='user-role'
                    control={control}
                    showError={showError}
                    placeholder='Select Role'
                    name='RoleId'
                    required={true}
                    className='form-control'
                    options={InitFormValues.roles}
                    disabled={ApiStaus.InProgress || IsClinician()}
                    // className='form-control'
                  />
                </p>
                <p>
                  <label>PASSWORD</label>
                  <InputCtrl
                    ID='user-password'
                    control={control}
                    showError={showError}
                    type='password'
                    placeholder='Password'
                    name='Password'
                    required={false}
                    className='form-control'
                    disabled={ApiStaus.InProgress}
                  />
                  {EditMode ? (
                    <small>
                      Leave empty when you do not want to change password
                    </small>
                  ) : null}
                </p>
                <p>
                  <label>EMAIL</label>
                  <InputCtrl
                    ID='user-email'
                    control={control}
                    showError={showError}
                    type='email'
                    placeholder='Email'
                    name='Email'
                    required={true}
                    className='form-control'
                    disabled={ApiStaus.InProgress}
                  />
                </p>
                {/* <p>
                  <label>COUNTRY</label>
                  <select
                    id='user-country'
                    name='CountryId'
                    onChange={handlChange}
                    className="form-control"
                    value={UserLocationDetails.CountryId}
                    disabled={ApiStaus.InProgress}
                  >
                    <option selected value='' hidden>
                      Select Country
                    </option>
                    {InitFormValues.countries.map((country: any, idx: any) => {
                      return <option value={country.id}>{country.name}</option>
                    })}
                  </select>
                  {ErrorObject.CountryId == 1 ? (
                    <div className='controller-outer'>
                      <div className='err-block'>{'Field Is Required'}</div>
                    </div>
                  ) : null}
                </p>
                <p>
                  <label>STATE</label>
                  <select
                    id='user-state'
                    name='StateId'
                    onChange={handlChange}
                    className="form-control"
                    value={UserLocationDetails.StateId}
                    disabled={ApiStaus.InProgress}
                  >
                    <option selected value='' hidden>
                      Select State
                    </option>
                    {InitFormValues.states.map((state: any, idx: any) => {
                      return <option value={state.id}>{state.name}</option>
                    })}
                    {InitFormValues.states.length == 0 ? (
                      <option disabled value=''>
                        Select country first
                      </option>
                    ) : null}
                  </select>
                  {ErrorObject.StateId == 1 ? (
                    <div className='controller-outer'>
                      <div className='err-block'>{'Field Is Required'}</div>
                    </div>
                  ) : null}
                </p>
                <p>
                  <label>CITY</label>
                  <select
                    id='user-city'
                    name='CityId'
                    onChange={handlChange}
                    className="form-control"
                    value={UserLocationDetails.CityId}
                    disabled={ApiStaus.InProgress}
                  >
                    <option selected value='' hidden>
                      Select City
                    </option>
                    {InitFormValues.cities.map((city: any, idx: any) => {
                      return <option value={city.id}>{city.name}</option>
                    })}
                    {InitFormValues.cities.length == 0 ? (
                      <option disabled value=''>
                        Select state first
                      </option>
                    ) : null}
                  </select>
                  {ErrorObject.CityId == 1 ? (
                    <div className='controller-outer'>
                      <div className='err-block'>{'Field Is Required'}</div>
                    </div>
                  ) : null}
                </p> */}
                <p>
                  <label>ADDRESS</label>
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
                        long: data.long,
                        cityName: data.vicinity || data.address
                      })
                    }}
                    address={UserLocation.address}
                    UnsetAddress={() => {
                      SetUserLocation({
                        address: '',
                        cityName: '',
                        lat: 0,
                        long: 0
                      })
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
                  {/* <InputCtrl
                    ID='user-address'
                    control={control}
                    showError={showError}
                    type='text'
                    placeholder='Address'
                    name='Address'
                    required={true}
                    className='form-control'
                    disabled={ApiStaus.InProgress}
                  /> */}
                </p>
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
                {!IsClinician() ? (
                  <button
                    id='user-cancel'
                    type='button'
                    className='cancel'
                    onClick={GoBack}
                    disabled={ApiStaus.InProgress}
                  >
                    CANCEL
                  </button>
                ) : null}
                {ApiStaus.Failed ? (
                  <div className='form-check'>
                    <label className='text-danger'>
                      {ApiStaus.FailMessage}
                    </label>
                  </div>
                ) : null}
              </div>

              <div className='col-md-6 text-right'>
                {EditMode && !IsClinician() ? (
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
      ) : (
        <LoaderComponent />
      )}
    </div>
  )
}

export default UserDetail
