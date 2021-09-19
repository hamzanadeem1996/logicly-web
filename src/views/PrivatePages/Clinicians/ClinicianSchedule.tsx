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
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridDayPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
interface IState {
  Data: any
  Events: any[]
  PopupData: any
  ShowPopup: boolean
  fetching: boolean
  APIStatus: IApiCallStatus
}

let initialValues = {
  fetching: false,
  Data: {},
  Events: [],
  ShowPopup: false,
  PopupData: {
    PatientName: '',
    EventData: {}
  },
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

let removePatientFn: any = undefined
let lockPatientVisit: any = undefined
let ActiveView: any = 'timeGridDay'
let CurrentDate: any = new Date()
class ClinicianSchedule extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
    console.log('props', props)
  }

  componentDidMount = () => {
    ActiveView = 'timeGridDay'
    const params = utility.GetParamsFromSearch(this.props.location.search)
    CurrentDate = params.get('start_date') || new Date()
    this.FetchData()
  }

  Init = (events: any, view: any = undefined) => {
    let _this = this

    if (ActiveView == 'timeGridDay') {
      events.forEach((v: any) => {
        // v.icon="fa-trash";
        if (v.isLocked) {
          v.editable = false
        }
        if (v.distance == undefined) return
        v.title = `${v.title}\nDrive: ${v.distance} ${
          v.units == 'Kilometers' ? 'Km' : 'mi'
        }\n`
      })
    }

    var calendarEl: any = document.getElementById('test')
    var calendar = new Calendar(calendarEl, {
      initialView: ActiveView || 'timeGridDay',
      titleFormat: { month: 'long', day: 'numeric', year: 'numeric' },
      height: 650,
      timeZone: 'UTC',
      scrollTime: '',
      contentHeight: 700,
      editable: ActiveView == 'dayGridMonth' ? false : true,
      eventDurationEditable: false,
      droppable: true,
      allDaySlot: false,
      longPressDelay: 100,
      eventLongPressDelay: 100,
      selectLongPressDelay: 100,
      slotDuration: '00:15:00',
      slotLabelInterval: '01:00',
      eventOverlap: false,
      headerToolbar: {
        // left:"dayGridMonth,timeGridWeek,timeGridDay",
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      datesSet: function (info: any) {
        console.log('INFO', info)
        calendar.gotoDate(calendar.getDate())
        // callBack(calendar.getDate());
      },
      eventClick: function (data: any) {
        console.log(data, 'event')
        _this.setState({
          ShowPopup: !_this.state.ShowPopup,
          PopupData: {
            PatientName: data.event._def.title.includes('Drive')
              ? data.event._def.title.split('Drive')[0]
              : data.event._def.title,
            EventData: { ...data }
          }
        })
        removePatientFn = (close: any) => {
          removePatientFn = undefined
          data.event.remove()
          _this.DeletePatient(data, close)
        }
        lockPatientVisit = (close: any) => {
          lockPatientVisit = undefined
          _this.LockPatientVisit(data, close)
        }
        // state.currentDate = Utility.FormatYYYY_MM_DD(calendar.getDate());
        // setState({ ...state });
        // if (calendarID == "home") {
        // let patientId = data.event._def.extendedProps.patientId;
        // history.push("details/" + patientId);
        //   let name = data.event._def.title.split("Drive")[0];
        //   setPatientData({...data});
        //   remove=()=>{
        //     remove=undefined
        //     data.event.remove();
        //     deletion(data)
        //   }
        //   ViewDeletePatient(name);
        // }
        // console.log(Utility.FormatYYYY_MM_DD(calendar.getDate()), "CURRENT DATE");
      },
      eventDrop: async function (info: any) {
        // if (view == "dayGridMonth") return;
        let id = info.event._def.publicId
        let start = moment(info.event._instance.range.start)
          .utc()
          .format()
        let end = moment(info.event._instance.range.end)
          .utc()
          .format()
        console.log(info, start, id, end, 'DRAG DROP INFO')
        let result = await API.GetData(
          `/PatientVisitSchedule/UpdatePatientVisitSchedule?visitScheduleId=${id}&StartDate=${start}&EndDate=${end}`
        )
        // let res = await Api.updatePatientVisitSchedule(id, start, end);
        // console.log(res, "UPDATED SCHEDULE");
        // let success = false;
        // if (res.data.message.toLowerCase().includes("success")) {
        //   success = true;
        // } else {
        //   success = false;
        // }
        // let data = {
        //   success: success,
        //   currentDate: cDate
        // }
        // callBack(data);
      },
      eventDragStop: function (data: any) {
        console.log('CHANGE', data)
      },
      events: events,
      plugins: [timeGridDayPlugin, dayGridPlugin, interactionPlugin]
    })
    calendar.render()
    calendar.gotoDate(CurrentDate)
  }

  GoBack = () => {
    this.props.history.goBack()
  }

  DeletePatient = async (data: any, close: any) => {
    //
    let clinicianId: any = utility.GetParamsFromSearch(
      this.props.location.search
    )
    clinicianId = clinicianId.get('clinician_id')
    //
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      const result = await API.DeleteData(
        `/PatientVisitSchedule/RemoveFromVisitSchedule?id=${
          data.event._def.publicId
        }${clinicianId ? '&clinicianId=' + clinicianId : ''}`
      )
      console.log(result, 'result')
      // GoBack()
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
      if (close) {
        close()
      }
    } catch (err) {
      console.log(err.message, 'error')
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          FailMessage: err.message,
          Failed: true
        }
      })
    }
  }

  LockPatientVisit = async (patientData: any, close: any) => {
    console.log(patientData, 'PATIENT')
    let ID = patientData.event.extendedProps.patientId
    console.log('GOT INO LOCK BLOCK', ID)
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result = await API.GetData(
        `/PatientVisitSchedule/SetVisitLockStatus?patientId=${
          this.state.PopupData.EventData.event.extendedProps.patientId
        }&isLocked=${!this.state.PopupData.EventData.event.extendedProps
          .isLocked}`
      )

      console.log('result', result)
      this.setState(
        {
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        },
        () => {
          this.FetchData()
          if (close) {
            close()
          }
        }
      )
    } catch (err) {
      console.log(err.message, 'error')
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          FailMessage: err.message,
          Failed: true
        }
      })
    }
  }

  FetchData = async () => {
    //
    let clinicianId: any = utility.GetParamsFromSearch(
      this.props.location.search
    )
    clinicianId = clinicianId.get('clinician_id')
    //
    try {
      this.setState({
        // ...this.state,
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result = await API.GetData(
        `/PatientVisitSchedule/GetVisitSchedule?pagesize=${100}&pagenumber=${1}&mode=manual${
          clinicianId ? '&clinicianId=' + clinicianId : ''
        }`
      )
      console.log(result, 'result')

      if (result.data) {
        this.Init(result.data)
        this.setState({
          ...this.state,
          Events: result.data,
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

  SemiAutomatic = async () => {
    try {
      this.setState({
        // ...this.state,
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      console.log('Semi-auto')
      let startdate: any = utility.FormatDate(CurrentDate)

      let result: any = await API.GetData(
        `/PatientVisitSchedule/GetVisitSchedule?pagesize=1000&pagenumber=1&mode=semiautomatic&startdate=${startdate}`
      )
      console.log(result, 'VISITING SCHEDULE')

      if (result.data != null && result.data != undefined) {
        if (result.data.length != 0) {
          this.Init(result.data)
          this.setState({
            Events: result.data
          })
        }
        this.setState({
          ...this.state,
          fetching: false,
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
        fetching: false,
        APIStatus: {
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  Navigate = (manual: any = false) => {
    if (!manual) {
      let data = this.state.Events.find((v: any) => {
        return (
          moment(v.start).format('HH:mm:ss') >
          moment(new Date()).format('HH:mm:ss')
        )
      })
      if (data == undefined) {
        this.setState({
          APIStatus: {
            ...this.state.APIStatus,
            Failed: true,
            FailMessage: 'You have visited all your patients!'
          }
        })
      } else {
        utility.navigateToGoogleMaps(data.patientLat, data.patientLong)
      }
    } else {
      let temp: any = this.state.PopupData.EventData
      temp = temp.event._def.extendedProps
      let lat = temp.patientLat
      let long = temp.patientLong
      utility.navigateToGoogleMaps(lat, long)
    }
  }

  IsActive = (random: any, view: any) => {
    if (ActiveView == view) {
      return 'active-btn'
    }
    return ''
  }

  ClosePopup = () => {
    this.setState({
      ShowPopup: false,
      PopupData: {
        PatientName: '',
        EventData: {}
      }
    })
  }

  render () {
    return (
      <div className='white-container patient-schedule'>
        <Popup
          closeOnDocumentClick={true && !this.state.APIStatus.InProgress}
          open={this.state.ShowPopup}
          onClose={this.ClosePopup}
          contentStyle={{
            width: '25%',
            // marginRight: '32%',
            borderRadius: '20px'
          }}
        >
          {(close: any) => (
            <div className='white-container event-options'>
              <div className='row'>
                <div className='col-md-12'>
                  <h4>
                    {`Options for ${this.state.PopupData.PatientName}`}
                    {/* <i className='fas fa-times hand' onClick={close}></i> */}
                  </h4>
                  {this.state.APIStatus.InProgress ? (
                    <div className='text-center text-danger'>
                      Please wait...
                    </div>
                  ) : null}
                  <div className='options-btn-grp'>
                    <button
                      className='btn-nav'
                      onClick={() => {
                        this.Navigate(true)
                      }}
                      disabled={this.state.APIStatus.InProgress}
                    >
                      Navigate
                    </button>
                    <button
                      className='btn-view'
                      onClick={() => {
                        this.props.history.push(
                          `/patients/add?patient_id=${this.state.PopupData.EventData.event._def.extendedProps.patientId}`
                        )
                      }}
                      disabled={this.state.APIStatus.InProgress}
                    >
                      View
                    </button>
                    <button
                      className='btn-delete'
                      disabled={this.state.APIStatus.InProgress}
                      onClick={() => {
                        removePatientFn(close)
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className='btn-lock'
                      onClick={() => {
                        if (lockPatientVisit) {
                          lockPatientVisit(close)
                        }
                      }}
                      disabled={this.state.APIStatus.InProgress}
                    >
                      {this.state.PopupData.EventData.event
                        ? this.state.PopupData.EventData.event._def
                            .extendedProps.isLocked
                          ? 'Unlock'
                          : 'Lock'
                        : 'Lock'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Popup>
        <div className='row scheduling-options'>
          <div className='col-md-6'>
            <div className='add-btn'>
              <button
                title='Semi-Automatic'
                disabled={this.state.APIStatus.InProgress}
                onClick={this.SemiAutomatic}
              >
                {/* View Schedule */}
                <i className='fas fa-th-large'></i>
              </button>
            </div>
            <div className='add-btn'>
              <button
                title='Navigate'
                disabled={this.state.APIStatus.InProgress}
                onClick={this.Navigate}
              >
                {/* View Schedule */}
                <i className='fas fa-location-arrow'></i>
              </button>
            </div>
            {this.state.APIStatus.Failed ? (
              <span className='text-danger'>
                {this.state.APIStatus.FailMessage}
              </span>
            ) : null}
          </div>
          <div className='col-md-6'>
            <div className='add-btn'>
              <button
                className={this.IsActive(this.state, 'timeGridDay')}
                disabled={this.state.APIStatus.InProgress}
                onClick={() => {
                  ActiveView = 'timeGridDay'
                  this.setState({ ...this.state })
                  this.Init(this.state.Events, 'timeGridDay')
                }}
              >
                Today
              </button>
            </div>
            <div className='add-btn'>
              <button
                className={this.IsActive(this.state, 'timeGridWeek')}
                disabled={this.state.APIStatus.InProgress}
                onClick={() => {
                  this.setState({ ...this.state })
                  ActiveView = 'timeGridWeek'
                  this.Init(this.state.Events, 'timeGridWeek')
                }}
              >
                Week
              </button>
            </div>
            <div className='add-btn'>
              <button
                className={this.IsActive(this.state, 'dayGridMonth')}
                disabled={this.state.APIStatus.InProgress}
                onClick={() => {
                  ActiveView = 'dayGridMonth'
                  this.setState({ ...this.state })
                  this.Init(this.state.Events, 'dayGridMonth')
                }}
              >
                Month
              </button>
            </div>
          </div>
        </div>
        {this.state.fetching ? (
          <div className='in-progress'>Fetching Data...</div>
        ) : null}
        <div id={`test`} className={`timeGridDay`}></div>
      </div>
    )
  }
}

export default ClinicianSchedule
