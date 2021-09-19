import * as React from 'react'
import * as API from '../../../Services/Api'
import { useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'
import InputCtrl from '../../../Controls/Input'
import { useEffect } from 'react'
import {
  readFromLocalStorage,
  IsSuperAdmin,
  SetCookie,
  ValueFromUserData,
  IsAdmin
} from '../../../Services/utility'
interface ILoginForm {
  Email: string
  Password: string
}

let initialValues = {
  Email: '',
  Password: ''
}

const Login: React.FC<ILoginForm> = () => {
  const [state, setState] = React.useState({
    disable: false,
    loginErr: '',
    waitMsg: ''
  })
  const history = useHistory()

  useEffect(() => {
    if (readFromLocalStorage('userData_Apex')) {
      console.log('all good')
      if (IsSuperAdmin()) {
        history.push('/agencies')
      } else {
        let temp: any = ValueFromUserData('roleName')
        if (temp == 'OTA' || temp == 'PTA' || temp == 'AID' || temp == 'MSW') {
          history.push('/caseload-view')
          return
        }
        if (IsAdmin() && !ValueFromUserData('hasPaymentMethod')) {
          history.push('/payment-method')
          return
        }
        history.push('/patients')
      }
      return
    }
  }, [])

  const submit = async (data: ILoginForm) => {
    setState({ disable: true, loginErr: '', waitMsg: 'Please Wait...' })
    console.log(data, 'LOGIN OBJECT')

    try {
      let res = await API.Login(data)

      console.log(res, 'RESP0NSE')
      let userData = res.data.data
      if (
        res.data.status === 401 ||
        res.data.status === 404 ||
        !res.data.data
      ) {
        throw { message: res.data.message }
      } else {
        localStorage.setItem('userData_Apex', JSON.stringify(userData))
        SetCookie(
          'login-session',
          'allowed',
          (userData.maxSessionHours ? parseInt(userData.maxSessionHours) : 1) *
            3600000
        )
        setState({ disable: false, loginErr: '', waitMsg: 'PLEASE WAIT...' })
        if (IsSuperAdmin()) {
          history.push('/agencies')
        } else {
          let temp: any = ValueFromUserData('roleName')
          if (
            temp == 'OTA' ||
            temp == 'PTA' ||
            temp == 'AID' ||
            temp == 'MSW'
          ) {
            history.push('/caseload-view')
            return
          }
          if (IsAdmin() && !ValueFromUserData('hasPaymentMethod')) {
            history.push('/payment-method')
            return
          }
          history.push('/patients')
        }
      }
    } catch (err) {
      console.log(err, 'ERR')
      setState({
        disable: false,
        loginErr: err.message,
        waitMsg: ''
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

  const { control, handleSubmit, errors, reset } = useForm<ILoginForm>({
    defaultValues: initialValues,
    mode: 'onBlur' // when the you blur... check for errors
  })

  return (
    <div className='login'>
      <div className='container'>
        <div className='row'>
          <div className='col-md-7'>
            <img src='images/left-img.png' alt='' />
          </div>
          <div className='col-md-5'>
            <div className='logo text-center'>
              <img src='images/logo-inner.png' alt='' />

              <h2>Sign in</h2>
              <h4>Please sign in to your account</h4>
            </div>

            <form onSubmit={handleSubmit(submit)}>
              <fieldset disabled={state.disable}>
                <InputCtrl
                  ID='login-email'
                  name={'Email'}
                  control={control}
                  className={'form-control'}
                  showError={showError}
                  type={'email'}
                  placeholder='Enter Email'
                  disabled={state.disable}
                  required={true}
                />

                <InputCtrl
                  ID='login-password'
                  name={'Password'}
                  control={control}
                  className={'form-control'}
                  showError={showError}
                  type={'password'}
                  placeholder='Enter Password'
                  disabled={state.disable}
                  required={true}
                />

                <div className='row'>
                  <div className='col-md-12'>
                    <div className='col-md-6 form-check'>
                      <input id='login-remember-me' type='checkbox' />
                      <label className='form-check-label'>Remember Me</label>
                    </div>
                    <div className='col-md-6 form-check text-right'>
                      <label className='hand forgot_pw'>
                        <a
                          onClick={() => {
                            history.push('/forgot-password')
                          }}
                        >
                          Forgot Your Password?
                        </a>
                      </label>
                    </div>
                  </div>
                </div>
                {state.loginErr ? (
                  <span className='text-danger'>{state.loginErr}</span>
                ) : (
                  ''
                )}
                {state.waitMsg ? (
                  <span className='text-danger'>{state.waitMsg}</span>
                ) : (
                  ''
                )}
                <div className='row submit_row'>
                  <div className='col-md-12 col-12'>
                    <button
                      id='login-btn'
                      className='green-btn'
                      disabled={state.disable}
                    >
                      <i className='fas fa-user-check'></i> Login
                    </button>
                    <div className='alternative-opt'>
                      <a
                        className='hand'
                        onClick={() => {
                          history.push('/signup')
                        }}
                      >
                        Sign up?
                      </a>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
