import React, { useEffect } from 'react'
import { Content, Sidebar, Footer, Header } from './index'
import { useHistory } from 'react-router'
import {
  readFromLocalStorage,
  ChatLogin,
  GetCookieValue,
  SetAlertMethod,
  ValueFromUserData,
  IsAdmin,
  ShowAlert
} from '../Services/utility'
import { initChat } from '../Services/util/rocketChatServices'
import { useAlert } from 'react-alert'
import UpgradePlanBanner from '../Controls/UpgradePlanBanner'

interface IProps {
  [x: string]: any
}

const Layout: React.FC<IProps> = (props: IProps) => {
  const history = useHistory()
  const alert = useAlert()

  useEffect(() => {}, [])
  useEffect(() => {
    console.log('app starting...')
    SetAlertMethod(alert)
    // initChat()
    // console.log('chat is initialized')
    ChatLogin()
    console.log('chat- Logging in to chat...')
  }, [])

  const CheckLoginStatus = () => {
    if (
      !readFromLocalStorage('userData_Apex') ||
      GetCookieValue('login-session') == ''
    ) {
      localStorage.removeItem('userData_Apex')
      console.log('need to login')
      history.push('/login')
      return
    } else {
      console.log('all good')
      return
    }
  }

  const CheckNeedToAddPaymentMethod = () => {
    let HasPaymentMthd: any = ValueFromUserData('hasPaymentMethod')
    console.log('check need to add payment mthd ...', HasPaymentMthd)
    if (IsAdmin() && !HasPaymentMthd) {
      console.log("let's add a payment method ...")
      // ShowAlert('Add a payment method to continue.', 'error')
      // history.push('/payment-method')
      if (!window.location.href.includes('/payment-method')) {
        return (
          <UpgradePlanBanner
            ShowBanner={true}
            BannerMessage={
              ValueFromUserData('paymentMessage') ||
              'Please provide a payment method to continue.'
            }
            IsFixed={true}
            IsPaymentMethodRequest={IsAdmin()}
            History={props.history}
          />
        )
      }
    }

    if (!ValueFromUserData('address') && HasPaymentMthd) {
      return (
        <UpgradePlanBanner
          ShowBanner={true}
          BannerMessage={"Let's add Address"}
          IsFixed={true}
          AddressPopup={true}
          History={props.history}
        />
      )
    }

    return null
  }

  return (
    <div className='c-app c-default-layout'>
      <Sidebar random={Math.random()} />
      <div className='c-wrapper'>
        {/* to make header re-render to detect changes */}
        <Header random={Math.random()} />
        <div className='c-body'>
          {CheckNeedToAddPaymentMethod()}
          <Content />
          {CheckLoginStatus()}
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default Layout
