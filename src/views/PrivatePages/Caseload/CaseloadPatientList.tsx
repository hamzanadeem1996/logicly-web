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
import SchedulingPopup from './SchedulingPopup'
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

class CaseloadPatientList extends React.Component<any, IState> {
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
    if (this.props.CBForDateController) {
      this.props.CBForDateController(this.HandleDateChange)
    }
    if (this.props.NotifyRefreshTable)
      this.props.NotifyRefreshTable(() => {
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
        }${this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''}
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

        let arr: any = JSON.stringify(result.data)
        arr = JSON.parse(arr)

        result.data.forEach((data: any, index: any) => {
          let temp: any = {
            splitVisit: true
          }
          data.vsttype.forEach((value: any, idx: any) => {
            if (value.isCombined) {
              if (value.isPrimary) {
                temp.isPrimary = value
              } else {
                temp.isSecondary = value
              }
            }

            if (idx + 1 == data.vsttype.length) {
              if (temp.isPrimary && temp.isSecondary) {
                arr[index].vsttype.push(temp)
              }
            }
          })
        })

        console.log('!!!', arr)
        //
        this.setState({
          ...this.state,
          FilteredArray: this.state.FilteredArray.concat(arr),
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
        temp = moment(this.state.StartDate).add(1, 'week')
      }
    } else {
      if (count == 'd') {
        temp = moment(this.state.StartDate).subtract(1, 'day')
      } else {
        console.log('reduce 1 month')
        temp = moment(this.state.StartDate).subtract(1, 'week')
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
        if (this.props.MethodToUpdateStartdate)
          this.props.MethodToUpdateStartdate(temp)
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
        let flag: any = {}
        let dat2 = patient.vsttype.find((a: any) => {
          if (a.isCombined) {
            if (Object.keys(flag).length != 0) {
              this.state.SelectedPatients.push({
                patientId: patient.patientId,
                colorType: patient.colorType,
                routineVisitDate: flag.routineVisitDate,
                clinicianId: flag.clinicianId,
                certEndDate: flag.certEndDate,
                isCombined: flag.isCombined,
                recertId: flag.recertId
              })
              return true
            }
            flag = a
            return false
          }
          return (
            a.visitcolor !== '#808080' &&
            a.visitcolor !== '#FF69B4' &&
            !a.isCompleted
          )
        })

        if (!dat2) {
          // Patient already added in Visiting Schedule!
          return
        }

        // check
        obj.routineVisitDate = dat2.routineVisitDate
        obj.clinicianId = dat2.clinicianId
        obj.isCombined = dat2.isCombined
        obj.certEndDate = dat2.certEndDate
        obj.recertId = dat2.recertId

        //   if (dat2 && dat2.visitTypeCode == 'RV') {
        // } else {
        //   delete obj.routineVisitDate
        // }

        obj.colorType = dat2.visitTypeCode
      } else {
        delete obj.routineVisitDate
      }

      //
      this.state.SelectedPatients.push(obj)
      this.state.FilteredArray[idx].IsChecked = newBool
    } else {
      let temp = this.state.SelectedPatients.findIndex((ele: any) => {
        return ele.patientId == patient.patientId
      })
      if (temp != -1) {
        if (this.state.SelectedPatients[temp].isCombined) {
          this.state.SelectedPatients.splice(temp, 1)

          let temp2 = this.state.SelectedPatients.findIndex((ele: any) => {
            return ele.patientId == patient.patientId && ele.isCombined
          })

          if (temp2 !== -1) {
            this.state.SelectedPatients.splice(temp2, 1)
          }
        } else {
          this.state.SelectedPatients.splice(temp, 1)
        }
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
      utility.ShowAlert('Please select patients to add to schedule.', 'error')
      // this.setState({
      //   APIStatus: {
      //     Failed: true,
      //     FailMessage: 'Please select patients to add to schedule.',
      //     InProgress: false
      //   }
      // })
      return
    }
    // console.log('!!!', this.state.StartDate)
    try {
      if (this.state.APIStatus.InProgress) return
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true,
          Failed: false
        }
      })
      // Proceed to schedule
      this.state.SelectedPatients.forEach((v: any, idx: any) => {
        v.sortIndex = idx
      })
      let obj = {
        Patients: this.state.SelectedPatients,
        VisitDate: moment(this.state.StartDate).format('YYYY-MM-DD'),
        // .utc()
        // .format().split('T')[0],
        AddedBy: this.GetClinicianId()
          ? this.GetClinicianId()
          : utility.ValueFromUserData('id')
      }
      console.log(obj, '!!')
      // return
      let result = await API.PostData(
        `/PatientVisitSchedule/AddToVisitSchedule${
          this.GetClinicianId() ? '?clinicianId=' + this.GetClinicianId() : ''
        }`,
        obj
      )
      console.log(result, 'result')
      if (result.data && result.status != 402) {
        // Redirect to schedule
        // PROPS.history.push(
        //   '/caseload-scheduling/visit-schedule?start_date=' +
        //     this.state.StartDate.toISOString()
        // )
        utility.ShowAlert(result.message)
        if (this.props.NotifyFetchSchedule)
          this.props.NotifyFetchSchedule(this.state.StartDate)
        this.setState(
          {
            FilteredArray: [],
            APIPageNumber: 1,
            SelectedPatients: []
          },
          () => {
            this.FetchData()
          }
        )
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
      utility.ShowAlert(err.message, 'error')
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
          // Failed: true,
          // FailMessage: err.message
        }
      })
    }
  }

  AutomaticScheduling = async () => {
    this.setState({
      ShowSchedulePopup: true,
      APIStatus: {
        ...this.state.APIStatus,
        Failed: false
      }
    })
    return
  }

  AutoSchedule = async (mode: any) => {
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
        )}${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
        }${mode ? '&Mode=' + mode : ''}`,
        {}
      )
      console.log(res, 'res')
      if (res.data !== null) {
        let _message: string = res.message
        res = res.data.data
        if (
          (res == undefined || res.length == 0) &&
          !_message.includes('success')
        ) {
          throw { message: _message }
        } else {
          //   PROPS.history.push(
          //     '/caseload-scheduling/visit-schedule?start_date=' +
          //       this.state.StartDate.toISOString()
          //   )
          utility.ShowAlert(_message)
        }
      } else {
        throw res
      }
    } catch (err) {
      console.log('err', err)
      utility.ShowAlert(err.message, 'error')
      this.setState({
        APIStatus: {
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    } finally {
      if (this.props.NotifyFetchSchedule)
        this.props.NotifyFetchSchedule(this.state.StartDate)
      this.setState(
        {
          FilteredArray: [],
          APIPageNumber: 1
        },
        () => {
          this.FetchData()
        }
      )
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
        )}&patientid=${patient.patientId}${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
        }`
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
  UnMarkFromMissed = async (visit: any, secondary: any = undefined) => {
    try {
      console.log('toggle from marked missed', visit)
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      if (secondary) {
        const result = API.PostData(
          `/PatientVisitSchedule/UpdateVisitStatus?id=${0}&status=unmissed&patientDateId=${
            secondary.id
          }`,
          {}
        )
      }

      const result = await API.PostData(
        `/PatientVisitSchedule/UpdateVisitStatus?id=${0}&status=unmissed&patientDateId=${
          visit.id
        }`,
        {}
      )
      console.log(result, 'result of marking missed')

      //
      if (result.data) {
        utility.ShowAlert(result.message)
        let temp: any = this.state.StartDate
        if (window._x) {
          temp = moment(window._x.view.getCurrentData().currentDate)
        }
        if (this.props.NotifyFetchSchedule) this.props.NotifyFetchSchedule(temp)
        this.setState(
          {
            FilteredArray: [],
            APIPageNumber: 1,
            SelectedPatients: []
          },
          () => {
            this.FetchData()
          }
        )
      } else {
        throw result
      }
    } catch (err) {
      console.log('err', err)
      utility.ShowAlert(err.message, 'error')
    }
  }

  _Startdate = () => {
    return this.state.StartDate
  }

  render () {
    return (
      <div className='clinicians caseload-patient-listing'>
        <SchedulingPopup
          ShowPopup={this.state.ShowSchedulePopup}
          AutoSchedule={this.AutoSchedule}
          Reset={() => {
            this.setState({
              ShowSchedulePopup: false
            })
          }}
        />
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
        {/* <div className='row'>
          <div className='col-md-12'>
            <div className='week-ctrl'>
              <span
                className={`contain ${
                  this.state.APIStatus.InProgress ? 'disabled' : ''
                }`}
              >
                <i
                  className='fas fa-angle-double-left hand'
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
                  className='fas fa-angle-double-right hand'
                  onClick={() => {
                    this.HandleDateChange('inc', 'm')
                  }}
                ></i>
              </span>
            </div>
          </div>
        </div> */}
        <div id='table-wrapper'>
          <div id='table-scroll'>
            <table className='table data' id='custom_datatable'>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>City</th>
                  <th>Visits</th>
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
                          <td>{patient.cityName || 'N/A'}</td>
                          <td
                            onClick={evt => {
                              evt.stopPropagation()
                            }}
                          >
                            {patient.vsttype.map((visit: any) => {
                              return visit.visitcolor !== '#FF69B4' &&
                                !visit.isCompleted ? (
                                visit.splitVisit ? (
                                  visit.isPrimary.visitcolor == '#FF69B4' ||
                                  visit.isSecondary.visitcolor == '#FF69B4' ||
                                  visit.isPrimary.isCompleted ||
                                  visit.isSecondary.isCompleted ? (
                                    <InplaceConfirm
                                      Action={() => {
                                        this.UnMarkFromMissed(
                                          visit.isPrimary,
                                          visit.isSecondary
                                        )
                                      }}
                                      ConfirmationText={
                                        'Change the status back to active?'
                                      }
                                      IsCenter={true}
                                      ClassName={'un-mark-miss'}
                                      HTMLComponent={
                                        <div
                                          className='split-outer dot'
                                          style={{
                                            backgroundImage: `linear-gradient(-236deg, ${visit.isPrimary.visitcolor} 50%, ${visit.isSecondary.visitcolor} 50%)`
                                          }}
                                        >
                                          <span>
                                            {visit.isPrimary.visitTypeCode}
                                          </span>
                                        </div>
                                      }
                                    />
                                  ) : (
                                    <div
                                      className='split-outer dot'
                                      style={{
                                        backgroundImage: `linear-gradient(-236deg, ${visit.isPrimary.visitcolor} 50%, ${visit.isSecondary.visitcolor} 50%)`
                                      }}
                                      onClick={() => {
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
                                      <span>
                                        {visit.isPrimary.visitTypeCode}
                                      </span>
                                    </div>
                                  )
                                ) : !visit.isCombined ? (
                                  <span
                                    className='dot'
                                    style={{
                                      backgroundColor: visit.visitcolor
                                    }}
                                    onClick={() => {
                                      // if (patient.isDisabled) return
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
                                ) : null
                              ) : !visit.isCombined ? (
                                <InplaceConfirm
                                  Action={() => {
                                    this.UnMarkFromMissed(visit)
                                  }}
                                  ConfirmationText={
                                    'Change the status back to active?'
                                  }
                                  IsCenter={true}
                                  ClassName={'un-mark-miss'}
                                  HTMLComponent={
                                    <span
                                      className='dot'
                                      style={{
                                        backgroundColor: visit.visitcolor
                                      }}
                                    >
                                      {visit.visitTypeCode}
                                    </span>
                                  }
                                />
                              ) : null
                            })}
                          </td>
                          <td
                          // onClick={() => {
                          //   this.HandleSelectPatient(patient, idx)
                          // }}
                          >
                            {patient.IsChecked ? (
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
        <div className='row stick-to-bottom'>
          <div className='col-md-6'>
            <div
              className={`auto-schedule ${
                this.state.APIStatus.InProgress ? 'is-disabled' : ''
              }`}
              onClick={this.AutomaticScheduling}
              title={'Automatic Scheduling'}
            >
              <i className='fas fa-bolt hand' title='Automatic Scheduling'></i>
            </div>
          </div>
          <div className='col-md-6'>
            <div
              className={`auto-schedule is-green ${
                this.state.APIStatus.InProgress ? 'is-disabled' : ''
              }`}
              onClick={this.AddPatientsToSchedule}
              title={'Manual Scheduling'}
            >
              <i className='fas fa-plus hand' title=''></i>
            </div>
          </div>
          {/* {this.state.APIStatus.Failed ? (
            <span className='text-danger'>
              {this.state.APIStatus.FailMessage}
            </span>
          ) : null} */}
        </div>
      </div>
    )
  }
}

export default CaseloadPatientList
