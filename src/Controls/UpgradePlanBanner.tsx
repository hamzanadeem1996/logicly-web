import React from 'react'
import Popup from 'reactjs-popup'
import AddressAutoComplete from './AddressAutoComplete'
import {
  ValueFromUserData,
  setLocalStorage,
  ShowAlert
} from '../Services/utility'
import { SaveUser, PostData, ME, GetData } from '../Services/Api'

interface IState {
  Location: ILocation
}

interface ILocation {
  Error: boolean
  InProgress: boolean
  Address: string
  Latitude: number
  Longitude: number
}

export default class UpgradePlanBanner extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      Location: {
        Error: false,
        InProgress: false,
        Address: '',
        Latitude: 0,
        Longitude: 0
      }
    }
  }

  OnSubmit = async (e: any) => {
    e.preventDefault()
    if (!this.state.Location.Address) {
      this.setState({
        Location: {
          ...this.state.Location,
          Error: true
        }
      })
      return
    }

    this.setState({
      Location: {
        ...this.state.Location,
        InProgress: true
      }
    })

    try {
      let obj = {
        Address: this.state.Location.Address,
        CityName: ValueFromUserData('cityName'),
        Email: ValueFromUserData('email'),
        FirstName: ValueFromUserData('firstName'),
        Id: ValueFromUserData('id'),
        LastName: ValueFromUserData('lastName'),
        Lat: this.state.Location.Latitude,
        Long: this.state.Location.Longitude,
        Password: '',
        RoleId: ValueFromUserData('roleId')
      }
      console.log('submit', this.state, obj)

      let svUser: any = await PostData('/User/Save', obj)

      if (svUser.data) {
      } else {
        throw svUser
      }

      let _me: any = await ME()
      if (_me.data && _me.status == 200) {
        setLocalStorage('userData_Apex', JSON.stringify(_me.data))
      }

      // update agency data
      this.SaveAgency()

      if (this.props.History) {
        this.props.History.push(
          window.location.hash.split('#')[1] || '/patients'
        )
      }

      ShowAlert(svUser.message, 'success')
    } catch (err) {
      console.log('err', err)
      ShowAlert(err.message, 'error')
    } finally {
      this.setState({
        Location: {
          ...this.state.Location,
          InProgress: false
        }
      })
    }
  }

  SaveAgency = async () => {
    try {
      let result: any = await GetData('/Agency/GetAgencySetting')
      console.log('result', result)

      if (result.data) {
        result = result.data
        let SvAgency: any = {
          Address: this.state.Location.Address,
          Email: result.email,
          IsActive: result.isActive,
          Latitude: this.state.Location.Latitude,
          Longitude: this.state.Location.Longitude,
          MaxSessionHours: result.maxSessionHours,
          Name: result.name,
          PlanId: result.planId
        }

        result = await PostData('/Agency/Save', SvAgency)
        console.log('result', result)

        if (result.data) {
          console.log('Done!')
        } else {
          throw result
        }
      } else {
        throw result
      }
    } catch (err) {
      console.log(err, 'err')
    }
  }

  render () {
    return (
      <Popup
        className='uprage-plan-banner'
        open={this.props.ShowBanner}
        closeOnDocumentClick={!this.props.IsFixed}
        onClose={() => {
          if (this.props.OnDismiss) this.props.OnDismiss()
        }}
        closeOnEscape={false}
      >
        <img src={'../../images/logo-inner.png'} />
        {!this.props.AddressPopup ? (
          <>
            <span className='message'>{this.props.BannerMessage}</span>
            {this.props.IsPaymentMethodRequest ? (
              <div className='center-flex'>
                <div className='add-btn pay-method-redirect'>
                  <button
                    onClick={() => {
                      this.props.History.push('/payment-method')
                    }}
                  >
                    Add Payment Method
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className='address-popup white-container'>
            <form onSubmit={this.OnSubmit}>
              <AddressAutoComplete
                id={'address-field'}
                Data={(data: any) => {
                  console.log(data, 'popup')
                  this.setState({
                    Location: {
                      Error: false,
                      InProgress: false,
                      Address: data.address,
                      Latitude: data.lat,
                      Longitude: data.long
                    }
                  })
                }}
                address={this.state.Location.Address}
                UnsetAddress={() => {
                  this.setState({
                    Location: {
                      Error: false,
                      InProgress: false,
                      Address: '',
                      Latitude: 0,
                      Longitude: 0
                    }
                  })
                }}
                SetAddress={(fn: any) => {}}
                InProgress={this.state.Location.InProgress}
              />

              {this.state.Location.Error ? (
                <div className='controller-outer'>
                  <div className='err-block'>
                    {'Please select an address from drop-down'}
                  </div>
                </div>
              ) : null}

              <div className='row submit_row'>
                <div
                  className='col-md-12 signup'
                  style={{ position: 'relative' }}
                >
                  <button
                    className='green-btn'
                    disabled={this.state.Location.InProgress}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Popup>
    )
  }
}
