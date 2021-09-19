import React, { useState, useEffect } from 'react'
import InputMask from 'react-input-mask'
import { PostData, ME } from '../../../Services/Api'
import { ShowAlert, setLocalStorage } from '../../../Services/utility'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'

let ErrorInitialObject = JSON.stringify({
  CVV: {
    length: 3,
    error: false,
    mssg: ''
  },
  Expiry: {
    error: false,
    mssg: ''
  },
  CardNumber: {
    length: 14,
    error: false,
    mssg: ''
  },
  CardOwner: {
    error: false,
    mssg: ''
  }
})

let InitialValues = {
  CVV: '',
  Expiry: '',
  CardNumber: '',
  CardOwner: ''
}

const CardForm: React.FC = (props: any) => {
  const [CardDetails, SetCardDetails] = useState<any>({ ...InitialValues })

  let [Errors, SetErrors] = useState<any>({
    ...JSON.parse(ErrorInitialObject)
  })

  const [ExistingCard, SetExistingCard] = useState<any>('')

  const [APIStatus, SetAPIStatus] = useState<IApiCallStatus>({
    InProgress: false,
    FailMessage: '',
    Failed: false
  })

  useEffect(() => {
    FetchCard()
  }, [])

  const FetchCard = async () => {
    try {
      SetAPIStatus({
        ...APIStatus,
        InProgress: true
      })
      let result: any = await PostData('/Card/GetCard', {})
      console.log('result', result)

      if (result.data) {
        SetExistingCard(result.data.cardNumber || '')
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
    } finally {
      SetAPIStatus({
        ...APIStatus,
        InProgress: false
      })
    }
  }

  const HandleChange = (evt: any) => {
    let { value, name }: any = evt.target
    console.log('name', name, 'value', value)
    CardDetails[name] = value
    SetCardDetails({
      ...CardDetails,
      [name]: value
    })

    ValidateCardData(name)
  }

  const OnSubmit = async (evt: any) => {
    evt.preventDefault()
    console.log('submit', CardDetails)

    ValidateCardData()
  }

  const ValidateCardData = (KEY: string | undefined = undefined) => {
    const cb = (key: string, index: number, length: number) => {
      try {
        let temp: string = CardDetails[key]
          .replace(/_/g, '')
          .replace(/ /g, '')
          .replace(/-/g, '')
        console.log('submit key', temp)

        // String Empty
        if (!temp) {
          console.log('submit error', key)
          Errors[key].error = true
          throw { message: 'Field is Required' }
        }

        // String length issue
        if (Errors[key].length) {
          if (temp.length < Errors[key].length) {
            console.log('submit error', key)
            Errors[key].error = true
            throw { message: 'Invalid Value' }
          }
        }

        // Expiry Check
        if (key == 'Expiry') {
          let ExpiryMonthYear: any[] = temp.split('/')
          let ThisMonth: any = new Date()
          let ThisYear: any = ThisMonth.getFullYear()
          ThisMonth = ThisMonth.getMonth()
          console.log('submit', key, ExpiryMonthYear, ThisMonth, ThisYear)
          // Month
          if (
            !ExpiryMonthYear[0] ||
            parseInt(ExpiryMonthYear[0]) == 0 ||
            parseInt(ExpiryMonthYear[0]) > 12
          ) {
            console.log('submit error', key)
            Errors[key].error = true
            throw { message: 'Invalid Month' }
          }
          // Year
          if (
            !ExpiryMonthYear[1] ||
            parseInt(ExpiryMonthYear[1]) == 0 ||
            parseInt('20' + ExpiryMonthYear[1]) < ThisYear ||
            (parseInt('20' + ExpiryMonthYear[1]) == ThisYear &&
              parseInt(ExpiryMonthYear[0]) < ThisMonth + 1)
          ) {
            console.log('submit error', key)
            Errors[key].error = true
            throw { message: 'Invalid Year' }
          }
        }

        // default
        if (index + 1 == length) {
          console.log('okay 1', Errors)
          Errors[key].error = false
          throw { message: '' }
          // SetErrors({ ...Errors })
        }
        return true
      } catch (err) {
        // error found case
        console.log('okay 2', Errors, err)
        Errors[key].mssg = err.message
        SetErrors({ ...Errors })
        if (err.message) return false
        else return true
      }
    }

    // Validate Data //
    if (KEY) {
      // Validate On Change
      cb(KEY, 0, 1)
      // alert(CardDetails.CardNumber)
    } else {
      // Validate On Submit
      Errors = { ...JSON.parse(ErrorInitialObject) }
      let keys: any[] = Object.keys(CardDetails)
      console.log('submit', keys, Errors)

      let IsValid: boolean = true

      keys.forEach((key: string, index: number) => {
        let temp: any
        temp = cb(key, index, keys.length)
        IsValid = IsValid && temp

        if (index + 1 == keys.length && IsValid) {
          SaveCard()
        }
      })
    }
    // END //
  }

  const SaveCard = async () => {
    try {
      SetAPIStatus({
        ...APIStatus,
        InProgress: true
      })

      console.log('submit after validation', CardDetails, Errors)
      let ExpiryMonthYear: any[] = CardDetails.Expiry.replace(/_/g, '')
        .replace(/ /g, '')
        .split('/')

      let CardDetail = {
        CardHolderName: CardDetails.CardOwner,
        CardNumber: CardDetails.CardNumber.replace(/_/g, '')
          .replace(/ /g, '')
          .replace(/-/g, ''),
        ExpiryMonth: ExpiryMonthYear[0],
        ExpiryYear: '20' + ExpiryMonthYear[1],
        Cvv: CardDetails.CVV.replace(/_/g, '').replace(/ /g, '')
      }

      console.log('CARD DETAIL', CardDetail)
      let result: any = await PostData('/Card/SaveCard', CardDetail)
      console.log('result', result)
      if (result.data) {
        SetCardDetails({ ...InitialValues })
        ShowAlert(result.message)

        // get me
        let _me: any = await ME()
        if (_me.data && _me.status == 200) {
          setLocalStorage('userData_Apex', JSON.stringify(_me.data))
        }

        // // hasPaymentMethod updation in local
        // let temp: any = localStorage.getItem('userData_Apex')
        // if (temp) {
        //   temp = JSON.parse(temp)
        //   if (!temp.hasPaymentMethod) {
        //     temp.hasPaymentMethod = true
        //     localStorage.setItem(JSON.stringify(temp), 'userData_Apex')
        //   }
        // }
        // //
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
      ShowAlert(err.message, 'error')
    } finally {
      SetAPIStatus({
        ...APIStatus,
        InProgress: false
      })
      FetchCard()
    }
  }

  const ShowError = (errors: any, key: string) => {
    return Errors[key].error ? (
      <div className='text-danger'>{Errors[key].mssg}</div>
    ) : null
  }

  return (
    <div className='white-container payment-card-form'>
      <h2>
        Payment Method
        {/* {ExistingCard && <span>Active Card: {ExistingCard}</span>} */}
      </h2>
      <form onSubmit={OnSubmit}>
        <div className='row'>
          <div className='col-md-6'>
            <label>Card Number</label>
            <InputMask
              className='form-control'
              name={'CardNumber'}
              mask='9999-9999-9999-9999'
              placeholder={ExistingCard || 'XXXX-XXXX-XXXX-XXXX'}
              type={'text'}
              alwaysShowMask={false}
              value={CardDetails.CardNumber}
              onChange={HandleChange}
              disabled={APIStatus.InProgress}
            />
            {ShowError(Errors, 'CardNumber')}
          </div>
          <div className='col-md-6'></div>
          <div className='col-md-3'>
            <label>Expiry</label>
            <InputMask
              className='form-control'
              name={'Expiry'}
              placeholder={'MM / YY'}
              mask='99 / 99'
              type={'text'}
              alwaysShowMask={false}
              value={CardDetails.Expiry}
              onChange={HandleChange}
              disabled={APIStatus.InProgress}
            />
            {ShowError(Errors, 'Expiry')}
          </div>
          <div className='col-md-3'>
            <label>CVV</label>
            <InputMask
              className='form-control'
              name={'CVV'}
              mask='9999'
              type={'text'}
              placeholder={'CVV'}
              alwaysShowMask={false}
              value={CardDetails.CVV}
              onChange={HandleChange}
              disabled={APIStatus.InProgress}
            />
            {ShowError(Errors, 'CVV')}
          </div>
          <div className='col-md-6'></div>
          <div className='col-md-6'>
            <label>Card Owner</label>
            <input
              type='text'
              placeholder='Card Owner Name'
              name='CardOwner'
              className='form-control'
              value={CardDetails.CardOwner}
              onChange={HandleChange}
              disabled={APIStatus.InProgress}
            />
            {ShowError(Errors, 'CardOwner')}
          </div>
        </div>
        <div className='row buttons'>
          <div className='col-md-6 text-left'>
            <button
              type='submit'
              className='save'
              disabled={APIStatus.InProgress}
            >
              {'SAVE'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CardForm
