import React from 'react'
import * as API from '../../../Services/Api'
import * as utility from '../../../Services/utility'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'
import moment from 'moment'
import InplaceConfirm from '../../../Controls/InplaceConfirm'
interface IState {
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  fetching: boolean
  ShowSchedulePopup: boolean
  SearchText: string
  ShowPopup: boolean
  PopupData: any
  StartDate: any
  FilteredArray: any[]
  SelectedPatients: any[]
  APIStatus: IApiCallStatus
}

let initialValues = {
  filter: 'none',
  activePage: 1,
  APIPageNumber: 1,
  APIPageSize: 1000,
  fetching: false,
  ShowPopup: false,
  StartDate: moment(new Date()),
  SearchText: '',
  FilteredArray: [],
  SelectedPatients: [],
  PopupData: {
    Fetch: false,
    PatientName: '',
    Data: []
  },
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  },
  ShowSchedulePopup: false
}

let selectedPatient: any = undefined

class PatientList extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount = () => {
    if (!utility.IsAdmin()) {
      this.FetchData()
    }
    //
    if (this.props.NotifyRefreshTable)
      this.props.NotifyRefreshTable(() => {
        selectedPatient = undefined
        this.setState(
          {
            FilteredArray: [],
            APIPageNumber: 1
          },
          () => {
            this.FetchData()
          }
        )
      })
  }

  GetClinicianId = () => {
    if (this.props.GetClinicianId) return this.props.GetClinicianId()
    return ''
  }

  ISLatest: any
  FetchData = async () => {
    try {
      this.setState({
        // ...this.state,
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let temp = Math.random()
      this.ISLatest = temp
      let result: any = await API.GetData(
        `/PatientProfile/GetSchedule?startdate=${moment(
          this.state.StartDate
        ).format('YYYY-MM-DD')}&pagenumber=${
          this.state.APIPageNumber
        }&pagesize=${this.state.APIPageSize}${
          this.state.SearchText ? `&query=${this.state.SearchText}&` : ''
        }${
          this.GetClinicianId()
            ? '&clinicianId=' + this.GetClinicianId().cid
            : ''
        }
        `
      )
      console.log(result, 'result')
      if (this.ISLatest != temp) {
        return
      }
      if (result.data != null) {
        let upPageNumber: any
        if (result.data.length < this.state.APIPageSize) {
          // Means end of records reached
          upPageNumber = null
        } else {
          upPageNumber = this.state.APIPageNumber + 1
        }

        //
        selectedPatient = undefined
        //
        this.setState({
          ...this.state,
          FilteredArray: this.state.FilteredArray.concat(result.data),
          APIPageNumber: upPageNumber,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
      utility.ShowAlert(err.message, 'error')
      this.setState({
        ...this.state,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
          // Failed: true,
          // FailMessage: err.message
        }
      })
    } finally {
      this.setState({
        fetching: false
      })
    }
  }

  HandleSelectPatient = (patient: any, idx: any) => {
    console.log('check uncheck', patient)
    if (this.props.ReportPatientId) {
      selectedPatient = patient.patientId
      this.props.ReportPatientId(patient.patientId)
      this.setState({ ...this.state })
    }
  }

  render () {
    return (
      <div className='clinicians caseload-patient-listing'>
        <div id='table-wrapper'>
          <div id='table-scroll'>
            <table className='table data' id='custom_datatable'>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {this.state.fetching ? (
                  <tr>
                    <td colSpan={9}>Fetching Records...</td>
                  </tr>
                ) : null}
                {this.state.FilteredArray.length == 0 &&
                !this.state.fetching ? (
                  <tr>
                    <td colSpan={9}>No matching records found</td>
                  </tr>
                ) : (
                  this.state.FilteredArray
                    // .filter((val, idx) => {
                    //   let low, high
                    //   low = this.state.activePage * 10 - 10
                    //   high = this.state.activePage * 10
                    //   if (idx >= low && idx < high) return true
                    //   else return false
                    // })
                    .map((patient, idx) => {
                      return (
                        <tr
                          onClick={() => {
                            // logic to check patient selection

                            this.HandleSelectPatient(patient, idx)
                          }}
                        >
                          <td>{patient.title}</td>
                          <td>
                            {patient.patientId == selectedPatient ? (
                              <i className='fas fa-check green-text'></i>
                            ) : (
                              <i className='fas fa-check check-mark-text'></i>
                            )}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
}

export default PatientList
