import React from 'react'
import CaseloadPatientList from './CaseloadPatientList'
import CaseloadFullCalendar from './CaseloadFullCalendar'
import UpgradePlanBanner from '../../../Controls/UpgradePlanBanner'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import { GetData } from '../../../Services/Api'
import { IsAdmin, ValueFromUserData, UTCNow } from '../../../Services/utility'
import AutoComplete from '../patients/AutoComplete'
import moment from 'moment'

let CB: any = undefined
let CBRefreshTable: any = undefined
let CBForDateController: any = undefined

interface IState {
  ShowBanner: boolean
  BannerMessage: string
  ClinicianId: any
  Clinicians: any[]
  APIStatus: IApiCallStatus
  StartDate: any
}
export default class CaseloadView extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ShowBanner: false,
      BannerMessage: '',
      ClinicianId: '',
      Clinicians: [],
      StartDate: new Date(),
      APIStatus: {
        InProgress: false,
        FailMessage: '',
        Failed: false
      }
    }
  }

  componentDidMount = () => {
    // this.FetchClinicians()
  }

  FetchClinicians = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await GetData('/User/GetAll?pagenumber=1&pagesize=100')
      console.log('clinicians', result)
      if (result.data) {
        this.setState({
          Clinicians: result.data.items
        })
      }
    } catch (err) {
      console.log(err, 'err')
    } finally {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    }
  }

  RefreshTable = () => {
    if (CBRefreshTable) CBRefreshTable()
  }

  GetClinicianId = () => {
    return this.state.ClinicianId
  }

  HandleAutoComplete = (selection: any, name: any) => {
    console.log('check', selection)

    this.setState(
      {
        ClinicianId: selection ? selection.value : ''
      },
      () => {
        // Refresh Data In Table
        if (CBRefreshTable) CBRefreshTable()
        // Refresh Full Calendar
        if (CB) CB(UTCNow())
      }
    )
  }

  RenderDateRange = (random: any) => {
    let temp = this.state.StartDate
    return `${moment(temp).format('MM-DD-YYYY')}`
  }

  _Startdate = () => {}

  render () {
    return (
      <div className='white-container'>
        <UpgradePlanBanner
          ShowBanner={this.state.ShowBanner}
          BannerMessage={this.state.BannerMessage}
          IsFixed={true}
        />
        <div className='row head-button-input-grp sticky-comp-caseload'>
          <div className='col-md-3'>
            {/* {IsAdmin() ? ( */}
            <AutoComplete
              CallBack={this.HandleAutoComplete}
              InitVal={(fn: any) => {
                fn({
                  value: null,
                  label: null
                })
                if (!IsAdmin()) {
                  fn({
                    value: 0,
                    label: ValueFromUserData('fullName')
                  })
                }
              }}
              Placeholder={'Select a Clinician'}
              name={'clinician'}
              endpoint={'/User/GetAll'}
              NoBlurCB={true}
              IncludeNone={false}
              // NoPreSelect={true}
              Disabled={!IsAdmin()}
            />
            {/* ) : null} */}
          </div>
          <div className='col-md-3'></div>
          <div className='col-md-6 clinicians date-ctrl'>
            <div className='week-ctrl'>
              <span
                className={`contain ${
                  this.state.APIStatus.InProgress ? 'disabled' : ''
                }`}
              >
                <i
                  className='fas fa-angle-double-left hand'
                  onClick={() => {
                    CBForDateController('dec', 'm')
                  }}
                  title={'Week'}
                ></i>
                <i
                  className='fas fa-chevron-left hand'
                  onClick={() => {
                    CBForDateController('dec', 'd')
                  }}
                  title={'Day'}
                ></i>
                {'   '}
                <span className='date-range'>
                  {this.RenderDateRange(this.state)}
                </span>
                {'   '}
                <i
                  className='fas fa-chevron-right hand'
                  onClick={() => {
                    CBForDateController('inc', 'd')
                  }}
                  title={'Day'}
                ></i>
                <i
                  className='fas fa-angle-double-right hand'
                  onClick={() => {
                    CBForDateController('inc', 'm')
                  }}
                  title={'Week'}
                ></i>
              </span>
            </div>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-6'>
            <CaseloadPatientList
              NotifyFetchSchedule={(StartDate: any) => {
                if (CB) CB(StartDate.format('YYYY-MM-DD') + 'T00:00:00.000Z')
              }}
              NotifyRefreshTable={(fn: any) => {
                CBRefreshTable = fn
              }}
              GetClinicianId={this.GetClinicianId}
              CBForDateController={(fn: any) => {
                CBForDateController = fn
              }}
              MethodToUpdateStartdate={(startdate: any) => {
                this.setState({
                  StartDate: startdate
                })
              }}
              _Startdate={(fn: any) => {
                this._Startdate = fn
              }}
            />
          </div>
          <div className='col-md-6'>
            <CaseloadFullCalendar
              CBToRefreshFullCalendarData={(fn: any) => {
                CB = fn
              }}
              props={this.props}
              RefreshTable={this.RefreshTable}
              ReportUpgradePlan={(data: any) => {
                this.setState({
                  ShowBanner: true,
                  BannerMessage: data.message
                })
              }}
              GetClinicianId={this.GetClinicianId}
              FetchStartdate={() => {
                if (this._Startdate) {
                  let temp: any = this._Startdate()
                  if (temp) {
                    return temp.format('YYYY-MM-DD') + 'T00:00:00.000Z'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}
