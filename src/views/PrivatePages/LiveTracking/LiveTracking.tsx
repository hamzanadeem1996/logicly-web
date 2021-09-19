import React from 'react'
import { GOOGLE, GetCurrentCoordinates } from '../../../Services/utility'
import { GetData } from '../../../Services/Api'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import UpgradePlanBanner from '../../../Controls/UpgradePlanBanner'

interface IState {
  Clinicians: any[]
  APIStatus: IApiCallStatus
  LocationPermission: any
  ShowBanner: boolean
  BannerMessage: string
}
let map: any = undefined
let infowindow: any = undefined
let Interval: any = undefined
let markers: any[] = []
export default class LiveTracking extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      Clinicians: [],
      APIStatus: {
        InProgress: false,
        Failed: false,
        FailMessage: ''
      },
      LocationPermission: {
        Denied: false,
        Message: ''
      },
      ShowBanner: false,
      BannerMessage: ''
    }
  }
  componentDidMount = () => {
    map = undefined
    infowindow = undefined
    markers = []
    this.initMap()
    // this.FetchClinicians()
    this.setState({
      APIStatus: {
        ...this.state.APIStatus,
        InProgress: true
      }
    })

    //
    GetCurrentCoordinates(this.RemoveMarkers)
    Interval = setInterval(() => {
      GetCurrentCoordinates(this.RemoveMarkers)
    }, 30000)
    //
  }
  componentWillUnmount = () => {
    console.log('clear interval')
    if (Interval) {
      clearInterval(Interval)
    }
  }
  initMap = () => {
    const _default = { lat: 35.97, lng: -78.95 }
    // The map, centered at US
    map = new GOOGLE.maps.Map(document.getElementById('map') as HTMLElement, {
      zoom: 7,
      center: _default
    })
    infowindow = new GOOGLE.maps.InfoWindow()
  }

  FetchClinicians = async (coords: any) => {
    try {
      console.log(coords)
      if (!coords.latitude || !coords.longitude) {
        this.setState({
          LocationPermission: {
            Denied: true,
            Message:
              coords.message ||
              'Please enable location access from your settings'
          }
        })
        return
      }
      let result: any = await GetData(
        `/ClinicianAvailability/GetClinicianLocations?latitude=${coords.latitude}&longitude=${coords.longitude}`
      )
      console.log(coords, result, 'result')

      if (result.status == 401) {
        this.setState(
          {
            ShowBanner: true,
            BannerMessage: result.message,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          },
          () => {
            console.log('clear interval')
            if (Interval) {
              clearInterval(Interval)
            }
          }
        )
        return
      }

      if (result.data) {
        result = result.data.items
        this.setState(
          {
            Clinicians: result,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          },
          () => {
            this.SetupMarkers()
            // setTimeout(() => {
            //   this.RemoveMarkers()
            // }, 5000)
          }
        )
      } else {
        throw result
      }
    } catch (err) {
      console.log(err, 'err')
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  SetupMarkers = () => {
    let _this = this
    console.log('setup markers')
    if (map) {
      this.state.Clinicians.map((clinician: any, index: any) => {
        var myLatLng = new GOOGLE.maps.LatLng(
          clinician.latitude,
          clinician.longitude
        )
        var marker = new GOOGLE.maps.Marker({
          position: myLatLng,
          map: map,
          // animation: GOOGLE.maps.Animation.Sp,
          title: clinician.fullName,
          data: clinician
          // icon: clinician.iconImage
        })

        marker.addListener('click', (evt: any) => {
          map.setCenter(
            new GOOGLE.maps.LatLng(marker.position.lat(), marker.position.lng())
          )
          map.setZoom(10)
          _this.OnMarkerClick(evt, marker)
        })

        markers.push(marker)
        if (index == 0) {
          map.panTo(myLatLng)
        }
      })
    }
  }

  OnMarkerClick (event: any, marker: any) {
    console.log(marker)
    var contentString = `
    <div class="marker-content">
      <div><label>Clinician: </label>${marker.data.fullName}</div>
      <div class="link-schedule">
        <a href="#/caseload-view" target="_blank">View Schedule</a>
      </div>
    </div>
    `

    // Replace our Info Window's content and position
    infowindow.setContent(contentString)
    infowindow.setPosition(marker.position)
    infowindow.open(map)
  }

  RemoveMarkers = (coords: any) => {
    console.log('remove markers')
    markers.forEach((marker: any) => {
      marker.setMap(null)
    })
    markers = []
    this.FetchClinicians(coords)
  }

  render () {
    return (
      <div className='white-container live-tracking'>
        <UpgradePlanBanner
          ShowBanner={this.state.ShowBanner}
          BannerMessage={this.state.BannerMessage}
          IsFixed={true}
        />
        {/* <h2>Live Tracking</h2> */}
        <div className='tracking-map'>
          {/* <h2>Live Tracking</h2> */}
          <div className='map-space'>
            <div
              id='map'
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '100%',
                height: '100%;'
              }}
            ></div>
          </div>
          {this.state.LocationPermission.Denied ? (
            <div className='location-denied'>
              <small>*{this.state.LocationPermission.Message}</small>
            </div>
          ) : null}
        </div>
        <div className='tracking-map'>
          <h2>
            Clinician Location
            <span className='map-search'>
              <select className='form-control'>
                <option value='' hidden selected disabled>
                  View All
                </option>
                <option value='active'>Active</option>
                <option value='inactive'>In Active</option>
              </select>
            </span>
          </h2>
          <table className='table'>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>City</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {this.state.APIStatus.InProgress ? (
                <tr>
                  <td colSpan={9}>Fetching Data...</td>
                </tr>
              ) : null}
              {!this.state.APIStatus.InProgress &&
              this.state.Clinicians.length == 0 ? (
                <tr>
                  <td colSpan={9}>No Data</td>
                </tr>
              ) : (
                this.state.Clinicians.map((clincian: any) => {
                  return (
                    <tr>
                      <td>{clincian.firstName}</td>
                      <td>{clincian.lastName}</td>
                      <td>{clincian.city}</td>
                      <td>{clincian.state}</td>
                    </tr>
                  )
                })
              )}
              <tr></tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
