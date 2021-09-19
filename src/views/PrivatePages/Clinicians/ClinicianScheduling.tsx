import React, { Component, useState } from 'react'
import { useHistory } from 'react-router'
import 'datatables.net'
import * as API from '../../../Services/Api'
import { data } from 'jquery'
import { IPatients, PatientList } from '../../../Services/Models/IPatients'
import { trackPromise } from 'react-promise-tracker'
import * as utility from '../../../Services/utility'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import Pagination from 'react-js-pagination'
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'
import moment from 'moment'
interface IState {
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  fetching: boolean
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
  StartDate: new Date(),
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
  }
}
class ClinicianScheduling extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount = () => {
    this.FetchData()
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
        `/PatientProfile/GetSchedule?startdate=${utility.FormatDate(
          this.state.StartDate
        )}&pagenumber=${this.state.APIPageNumber}&pagesize=${
          this.state.APIPageSize
        }${this.state.SearchText ? `&query=${this.state.SearchText}&` : ''}`
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
      this.setState({
        ...this.state,
        APIStatus: {
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    } finally {
      this.setState({
        fetching: false
      })
    }
  }

  SyncVar: any

  Search = async (e: any) => {
    if (this.SyncVar) {
      clearInterval(this.SyncVar)
    }
    let value = e.target.value
    this.SyncVar = setTimeout(async () => {
      try {
        this.setState({
          ...this.state,
          fetching: true,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: true
          }
        })
        //

        if (value.trim() == '') {
          this.setState(
            {
              FilteredArray: [],
              activePage: 1,
              APIPageNumber: 1,
              SearchText: ''
            },
            () => {
              this.FetchData()
            }
          )
          return
        }

        let result = await API.GetData(
          `/PatientProfile/GetSchedule?startdate=${utility.FormatDate(
            new Date()
          )}&query=${value}`
        )
        console.log('result', result)

        if (result.data != null) {
          this.setState({
            ...this.state,
            FilteredArray: result.data,
            SearchText: value,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          })
        } else {
          throw result
        }
      } catch (err) {
        console.log(err)
        this.setState({
          ...this.state,
          FilteredArray: [],
          APIStatus: {
            InProgress: false,
            Failed: true,
            FailMessage: err.message
          }
        })
      } finally {
        this.setState({
          fetching: false,
          activePage: 1,
          APIPageNumber: 1
        })
      }
    }, 400)
  }

  HandlePageChange = async (pageNumber: any) => {
    console.log('', `active page is ${pageNumber}`)
    this.setState({ activePage: pageNumber })

    if (this.state.SearchText != '') {
      return
    }

    if (this.state.APIPageNumber != null && !this.state.fetching) {
      if (this.state.FilteredArray.length - pageNumber * 10 <= 10) {
        this.FetchData()
      }
    }
  }

  SyncChar: any
  HandleDateChange = (action: any, count: any) => {
    if (this.state.APIStatus.Failed) {
      this.state.APIStatus.Failed = false
    }
    let temp: any = new Date()

    if (action == 'inc') {
      if (count == 'd') {
        temp = moment(this.state.StartDate).add(1, 'day')
      } else {
        temp = moment(this.state.StartDate).add(1, 'month')
      }
    } else {
      if (count == 'd') {
        temp = moment(this.state.StartDate).subtract(1, 'day')
      } else {
        console.log('reduce 1 month')
        temp = moment(this.state.StartDate).subtract(1, 'month')
      }
    }

    console.log('action', action, temp)
    this.setState(
      {
        ...this.state,
        activePage: 1,
        APIPageNumber: 1,
        FilteredArray: [],
        StartDate: temp, // Reset Selected Patients
        SelectedPatients: []
      },
      () => {
        // if (this.SyncChar) {
        //   clearInterval(this.SyncChar)
        // }
        // setTimeout(() => {
        this.FetchData()
        // }, 800)
      }
    )
  }

  RenderDateRange = (random: any) => {
    let temp = this.state.StartDate
    return `${moment(temp).format('MM-DD-YYYY')}`
  }

  HandleSelectPatient = (patient: any, idx: any) => {
    if (this.state.APIStatus.InProgress) {
      return
    }
    //
    if (this.state.APIStatus.Failed) {
      this.state.APIStatus.Failed = false
    }
    //

    let newBool = !patient.IsChecked

    if (newBool) {
      if (this.state.SelectedPatients.length == 10) {
        // Can raise an alert here to inform that 10 patients already selected
        return
      }
      //

      let obj: any = {
        patientId: patient.patientId,
        colorType: patient.colorType,
        routineVisitDate: ''
      }
      if (patient.vsttype && patient.vsttype.length !== 0) {
        //  console.log(patient.vsttype[0].visitTypeCode,"VISIT")
        let dat2 = patient.vsttype.find((a: any) => {
          return a.visitcolor !== '#808080'
        })

        if (dat2 && dat2.visitTypeCode == 'RV') {
          obj.routineVisitDate = dat2.routineVisitDate
        } else {
          delete obj.routineVisitDate
        }

        if (!dat2) {
          // Patient already added in Visiting Schedule!
          return
        }
        obj.colorType = dat2.visitTypeCode
      } else {
        delete obj.routineVisitDate
      }

      //
      this.state.SelectedPatients.push(obj)
      this.state.FilteredArray[idx].IsChecked = newBool
    } else {
      let temp = this.state.SelectedPatients.findIndex((patient: any) => {
        return patient.patientId == patient.id
      })
      if (temp != -1) {
        this.state.SelectedPatients.splice(temp, 1)
      }
      this.state.FilteredArray[idx].IsChecked = newBool
    }
    console.log('selected patients', this.state.SelectedPatients)
    this.setState({
      ...this.state
    })
  }

  AddPatientsToSchedule = async () => {
    if (this.state.SelectedPatients.length == 0) {
      this.setState({
        APIStatus: {
          Failed: true,
          FailMessage: 'Please select patients to add to schedule.',
          InProgress: false
        }
      })
      return
    }

    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      // Proceed to schedule
      this.state.SelectedPatients.forEach((v: any, idx: any) => {
        v.sortIndex = idx
      })
      let obj = {
        Patients: this.state.SelectedPatients,
        VisitDate: moment(new Date(this.state.StartDate))
          .utc()
          .format()
      }
      console.log(obj)
      let result = await API.PostData(
        '/PatientVisitSchedule/AddToVisitSchedule',
        obj
      )
      console.log(result, 'result')
      if (result.data) {
        // Redirect to schedule
        this.props.history.push(
          '/caseload-scheduling/visit-schedule?start_date=' +
            this.state.StartDate.toISOString()
        )
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
      this.setState({
        APIStatus: {
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  AutomaticScheduling = async () => {
    if (this.state.APIStatus.InProgress) {
      return
    }
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let res: any = await API.PostData(
        `/PatientVisitSchedule/AutoScheduling?startdate=${utility.FormatDate(
          this.state.StartDate
        )}`,
        {}
      )
      console.log(res, 'res')
      if (res.data !== null) {
        res = res.data.data
        if (res == undefined || res.length == 0) {
          throw { message: 'All Patients are already Scheduled!' }
        } else {
          this.props.history.push(
            '/caseload-scheduling/visit-schedule?start_date=' +
              this.state.StartDate.toISOString()
          )
        }
      }
    } catch (err) {
      console.log('err', err)
      this.setState({
        APIStatus: {
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  ClosePopup = () => {
    this.setState({
      ShowPopup: false,
      PopupData: {
        PatientName: '',
        Fetch: false,
        Data: []
      }
    })
  }

  FetchPopupData = async (patient: any) => {
    try {
      this.setState({
        PopupData: {
          ...this.state.PopupData,
          Fetch: true
        }
      })
      let result = await API.GetData(
        `/MyDocuments/MyDocumentsDue?startdate=${utility.FormatDate(
          this.state.StartDate
        )}&patientid=${patient.patientId}`
      )
      console.log('result', result)
      if (result.data) {
        this.setState({
          PopupData: {
            PatientName: patient.title,
            Data: result.data,
            Fetch: false
          }
        })
      }
    } catch (err) {
      console.log(err, 'err')
    }
  }

  render () {
    return (
      <div className='white-container clinicians'>
        <Popup
          closeOnDocumentClick={false}
          open={this.state.ShowPopup}
          onClose={this.ClosePopup}
        >
          {(close: any) => (
            <div className='white-container'>
              <div className='row'>
                <div className='col-md-12'>
                  <h4>
                    {this.state.PopupData.PatientName}
                    <i className='fas fa-times hand' onClick={close}></i>
                  </h4>
                  <div className='row due-documents'>
                    {this.state.PopupData.Fetch ? 'Fetching Data...' : null}
                    {this.state.PopupData.Data.map((doc: any) => {
                      return (
                        <div className='col-md-5'>
                          <div
                            className='head-section'
                            style={{
                              color: utility.getColor(doc.visitType),
                              fontWeight: 600
                            }}
                          >
                            {doc.visitType}
                          </div>
                          <div className='listing'>
                            {doc.events.length == 0 ? (
                              <div className='list-item no-data'>
                                No Data Found!
                              </div>
                            ) : null}
                            {doc.events.map((event: any) => {
                              return (
                                <div className='list-item'>
                                  <div className='row'>
                                    <div className='col-md-12'>
                                      {moment(event.patientDates)
                                        .utc()
                                        .format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Popup>
        <div className='row'>
          <div className='col-md-4 head-btn-grp'>
            <div className='add-btn'>
              <button
                id='add-btn-user'
                onClick={() => {
                  this.props.history.push(
                    '/caseload-scheduling/visit-schedule?start_date=' +
                      this.state.StartDate.toISOString()
                  )
                }}
              >
                View Schedule
              </button>
            </div>
            <div className='add-btn'>
              <button
                id='add-btn-user'
                onClick={this.AddPatientsToSchedule}
                disabled={this.state.APIStatus.InProgress}
              >
                Add
              </button>
            </div>
            {this.state.APIStatus.Failed ? (
              <span className='text-danger'>
                {this.state.APIStatus.FailMessage}
              </span>
            ) : null}
          </div>
          <div className='col-md-6'>
            <div className='week-ctrl'>
              <span
                className={`contain ${
                  this.state.APIStatus.InProgress ? 'disabled' : ''
                }`}
              >
                <i
                  className='fas fa-angle-double-left'
                  onClick={() => {
                    this.HandleDateChange('dec', 'm')
                  }}
                ></i>
                <i
                  className='fas fa-chevron-left hand'
                  onClick={() => {
                    this.HandleDateChange('dec', 'd')
                  }}
                ></i>
                {'   '}
                <span className='date-range'>
                  {this.RenderDateRange(this.state)}
                </span>
                {'   '}
                <i
                  className='fas fa-chevron-right hand'
                  onClick={() => {
                    this.HandleDateChange('inc', 'd')
                  }}
                ></i>
                <i
                  className='fas fa-angle-double-right'
                  onClick={() => {
                    this.HandleDateChange('inc', 'm')
                  }}
                ></i>
              </span>
            </div>
          </div>
          <div className='col-md-2'>
            <div className='auto-schedule' onClick={this.AutomaticScheduling}>
              <i className='fas fa-bolt hand' title='Automatic Scheduling'></i>
            </div>
          </div>
        </div>

        <table className='table data' id='custom_datatable'>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>City</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {this.state.fetching ? (
              <tr>
                <td colSpan={9}>Fetching Records...</td>
              </tr>
            ) : null}
            {this.state.FilteredArray.length == 0 && !this.state.fetching ? (
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
                        this.HandleSelectPatient(patient, idx)
                      }}
                    >
                      <td>{patient.title}</td>
                      <td>{patient.cityName || 'N/A'}</td>
                      <td
                        onClick={evt => {
                          evt.stopPropagation()
                        }}
                      >
                        {patient.vsttype.map((visit: any) => {
                          return (
                            <span
                              className='dot'
                              style={{
                                backgroundColor: visit.visitcolor
                              }}
                              onClick={() => {
                                if (patient.isDisabled) return
                                this.setState(
                                  {
                                    ShowPopup: !this.state.ShowPopup
                                  },
                                  () => {
                                    this.FetchPopupData(patient)
                                  }
                                )
                              }}
                            >
                              {visit.visitTypeCode}
                            </span>
                          )
                        })}
                      </td>
                      <td
                        onClick={() => {
                          this.HandleSelectPatient(patient, idx)
                        }}
                      >
                        {patient.IsChecked ? (
                          <i className='fas fa-check green-text'></i>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
            )}
          </tbody>
        </table>
        {/* {this.state.FilteredArray.length != 0 ? (
          <div className='row float-right'>
            <Pagination
              hideFirstLastPages
              prevPageText='Prev'
              nextPageText='Next'
              activePage={this.state.activePage}
              itemsCountPerPage={10}
              totalItemsCount={this.state.FilteredArray.length}
              pageRangeDisplayed={5}
              onChange={this.HandlePageChange}
              innerClass='custom_pagination'
            />
          </div>
        ) : null} */}
      </div>
    )
  }
}

export default ClinicianScheduling
