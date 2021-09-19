import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'
import InputCtrl from '../../../Controls/Input'
import { GetData } from '../../../Services/Api'

let initialValues = {
  Email: ''
}

const ForgotPassword: React.FC<any> = () => {
  const history = useHistory()
  const [Inprogress, SetInprogress] = React.useState<boolean>(false)
  const [Message, SetMessage] = React.useState<string>('')
  React.useEffect(() => {}, [])

  const submit = async (data: any) => {
    console.log('forgot-password', data)
    SetInprogress(true)
    try {
      let result: any = await GetData(
        `/Auth/ForgotPassword?email=${data.Email}`
      )
      console.log(result, Message, 'RESULT')
      SetMessage(result.message)
      if (result.status == 402) {
        return
      }
      // setTimeout(() => {
      //   history.push('/login')
      // }, 2000)
    } catch (error) {
      console.log('Error Logging in', error)
    } finally {
      SetInprogress(false)
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
    defaultValues: initialValues,
    mode: 'onBlur' // when the you blur... check for errors
  })

  return (
    <div className='login forgot-password'>
      <div className='container'>
        <div className='row'>
          <div className='col-md-7'>
            <img src='images/left-img.png' alt='' />
          </div>
          <div className='col-md-5'>
            <div className='logo text-center'>
              <img src='images/logo-inner.png' alt='' />

              <h2>Forgot Password</h2>
              <h4>Please enter your registered email to reset your password</h4>
            </div>

            <form onSubmit={handleSubmit(submit)}>
              <InputCtrl
                ID='login-email'
                name={'Email'}
                control={control}
                className={'form-control'}
                showError={showError}
                type={'email'}
                placeholder='Enter Email'
                required={true}
                disabled={Inprogress}
              />

              <div className='row'>
                <div className='col-md-12'>
                  <div className='col-md-6'></div>
                  <div className='col-md-6 form-check text-right'>
                    <label className='hand forgot_pw'>
                      <a
                        onClick={() => {
                          history.push('/login')
                        }}
                      >
                        Sign in
                      </a>
                    </label>
                  </div>
                </div>
              </div>

              {Message ? <span className='text-danger'>{Message}</span> : null}

              <div className='row submit_row'>
                <div className='col-md-12 col-12'>
                  <button
                    id='login-btn'
                    className='green-btn'
                    disabled={Inprogress}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
