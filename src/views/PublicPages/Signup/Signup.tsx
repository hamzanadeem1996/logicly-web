import * as React from 'react'
import * as API from '../../../Services/Api'
import { useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'
import InputCtrl from '../../../Controls/Input'
import { useEffect } from 'react'
import {
  readFromLocalStorage,
  IsSuperAdmin,
  HourOptions
} from '../../../Services/utility'
import SelectCtrl from '../../../Controls/SelectCtrl'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import AddressAutoComplete from '../../../Controls/AddressAutoComplete'

let cb: any = undefined
const Signup: React.FC<any> = () => {
  const [ApiStatus, SetApiStatus] = React.useState<IApiCallStatus>({
    InProgress: false,
    Failed: false,
    FailMessage: ''
  })

  const [ErrorObject, SetErrorObject] = React.useState({
    Address: 0
  })

  const [IsThankYou, SetThankYou] = React.useState<boolean>(false)

  let [UserLocation, SetUserLocation] = React.useState({
    address: '',
    lat: 0,
    long: 0
  })

  let [FormDefaultValues, SetFormDefaultValues] = React.useState<any>({
    Hours: [],
    Plans: []
  })

  const history = useHistory()

  useEffect(() => {
    if (readFromLocalStorage('userData_Apex')) {
      console.log('all good')
      if (IsSuperAdmin()) {
        history.push('/agencies')
      } else {
        history.push('/patients')
      }
      return
    }

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
  }, [])

  const FetchPlans = async () => {
    try {
      let result: any = await API.GetData('/Plan/GetAll')
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

  const submit = async (data: any) => {
    console.log('submit data', data)
    // if (UserLocation.address === '') {
    //   SetErrorObject({
    //     ...ErrorObject,
    //     Address: 1
    //   })
    //   return
    // }

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
        Address: UserLocation.address,
        Latitude: UserLocation.lat,
        Longitude: UserLocation.long,
        IsActive: true,
        MaxSessionHours: '8'
      }

      let result: any = await API.PostData('/User/QuickSignup', SvAgency)
      console.log('result', result)
      if (result.status == 200) {
        console.log('done !!!')
        SetThankYou(true)
        setTimeout(() => {
          history.push('/login')
        }, 5800)
      }
      throw result
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

  const showError = (_fieldName: string) => {
    let error = (errors as any)[_fieldName]
    return error ? (
      <div className='text-danger err'>
        {error.message || 'Field Is Required'}
      </div>
    ) : null
  }

  const { control, handleSubmit, errors, reset } = useForm<any>({
    defaultValues: {},
    mode: 'onBlur' // when the you blur... check for errors
  })

  return (
    <div className='white-container signup'>
      {!IsThankYou ? (
        <div className='row cust-container'>
          <div className='col-md-7 img-holder'>
            <img src='images/signup-left-img.jpg' alt='' />
            <div className='over-img-text'>
              <h1>The only home health solution to:</h1>
              <p>
                Auto-Schedule. Optimize Routes. <br />
                Manage Caseloads
              </p>
            </div>
          </div>
          <div className='col-md-5 field-holder'>
            <div className='field-wrapper'>
              <div className='welcome-box'>
                <h3>Hello!</h3>
                <p>Create your account here and start journey with us.</p>
              </div>
              <form onSubmit={handleSubmit(submit)}>
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

                {/* <div className='input-controller'>
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

                  {ErrorObject.Address == 1 ? (
                    <div className='controller-outer'>
                      <div className='err-block'>
                        {'Please select an address from drop-down'}
                      </div>
                    </div>
                  ) : null}
                </div> */}

                <SelectCtrl
                  control={control}
                  showError={showError}
                  placeholder='Select Plan'
                  name='PlanId'
                  required={true}
                  className='form-control'
                  options={FormDefaultValues.Plans}
                  disabled={ApiStatus.InProgress}
                />

                <div className='row' style={{ height: '25px' }}>
                  <div className='col-md-12' style={{ position: 'relative' }}>
                    {ApiStatus.Failed ? (
                      <span className='text-danger'>
                        {ApiStatus.FailMessage}
                      </span>
                    ) : (
                      ''
                    )}
                    {ApiStatus.InProgress ? (
                      <span className='text-danger'>{'Please wait...'}</span>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
                <div className='row submit_row'>
                  <div className='col-md-12' style={{ position: 'relative' }}>
                    <button
                      className='green-btn'
                      disabled={ApiStatus.InProgress}
                    >
                      Submit
                    </button>
                    <div className='alternative-opt'>
                      <a
                        className='hand'
                        onClick={() => {
                          history.push('/login')
                        }}
                      >
                        Login?
                      </a>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        ThankYou()
      )}
    </div>
  )
}

export default Signup

const ThankYou = () => {
  return (
    <div className='thank-you'>
      <div className='thank-you-content'>
        <i className='far fa-check-circle'></i>
        <h1>Thank You!</h1>
        <p className='cust-bold'>
          Please check your email for login credentials
        </p>
        <p>Feel free to get in touch with our team for help</p>
        <span>You will be redirected to login page in 5 seconds</span>
      </div>
    </div>
  )
}
