import React from 'react'
import 'datatables.net'
import * as API from '../../../Services/Api'
import * as utility from '../../../Services/utility'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import Popup from 'reactjs-popup'
import 'reactjs-popup/dist/index.css'
import moment from 'moment'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridDayPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import Loader from 'react-loader-spinner'
import '../../../scss/custom.css'
interface IState {
  Data: any
  Events: any[]
  PopupData: any
  ShowPopup: boolean
  IncludeWeekendsInWeekView: boolean
  fetching: boolean
  distanceCalculator: any
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
  distanceCalculator: '',
  IncludeWeekendsInWeekView: true,
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

let removePatientFn: any = undefined
let MarkMissed: any = undefined
let lockPatientVisit: any = undefined
let ActiveView: any = 'timeGridDay'
let CurrentDate: any = utility.UTCNow()
let StartHour: any = '06:00:00'

let flagRefetchScroll: any = ''

let CALENDAR: any = ''

class CaseloadFullCalendar extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }

    console.log('props', props)
  }

  componentDidMount = () => {
    ActiveView = 'timeGridDay'
    if (utility.IsAdmin()) {
      this.Init([])
    } else {
      // this.FetchData()
      this.GetSettings()
    }
    //
    if (this.props.CBToRefreshFullCalendarData) {
      this.props.CBToRefreshFullCalendarData(this.ReFetchMethod)
    }
    //
  }

  componentWillUnmount = () => {
    window._x = undefined
  }

  ReFetchMethod = (startdate: any) => {
    console.log('full calendar refresh', startdate)
    if (startdate === undefined && window._x)
      CurrentDate = moment(window._x.view.getCurrentData().currentDate).format()
    if (startdate) CurrentDate = startdate
    this.GetSettings()
  }

  GetSettings = async () => {
    this.FetchData()
    let result: any = await API.GetData(
      `/Setting/Get?${
        this.GetClinicianId() ? 'clinicianId=' + this.GetClinicianId() : ''
      }`
    )
    console.log('result', result)
    if (result.data) {
      this.setState({
        distanceCalculator: result.data.distanceCalculator,
        IncludeWeekendsInWeekView:
          result.data.includeWeekendsInWeekView == 'Yes'
      })
      StartHour = result.data.start
    }
  }

  Init = (events: any, view: any = undefined) => {
    let _this = this

    // if (ActiveView == 'timeGridDay') {
    events.forEach((v: any) => {
      // v.icon="fa-trash";
      if (v.isLocked) {
        v.editable = false
      }
      // if(v.isCompleted){
      //   v.borderColor= '#0000cd'
      // }
      if (v.distance == undefined) return
      v.title = `${v.title}\nDrive: ${v.distance} ${
        v.units == 'Kilometers' ? 'Km' : 'mi'
      }\n`
    })
    // }

    // check
    if (window._x) {
      window._x.changeView(ActiveView || 'timeGridDay')
      window._x.removeAllEvents()
      window._x.addEventSource(events)
      window._x.gotoDate(CurrentDate)
      if (flagRefetchScroll) {
        window._x.scrollToTime(flagRefetchScroll)
        flagRefetchScroll = ''
      }
      return
    }

    var calendarEl: any = document.getElementById('test')
    var calendar = new Calendar(calendarEl, {
      initialView: ActiveView || 'timeGridDay',
      now: moment().format('YYYY-MM-DD') + 'T00:00:00',
      titleFormat: { month: 'long', day: 'numeric', year: 'numeric' },
      height: 650,
      timeZone: 'UTC',
      scrollTime: StartHour,
      scrollTimeReset: false,
      contentHeight: 700,
      weekends: this.state.IncludeWeekendsInWeekView,
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
      datesSet: function (info: any) {},
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
          // data.event.remove()
          _this.DeletePatient(data, close)
        }
        // mark as missed mthd
        MarkMissed = (close: any, status: any) => {
          MarkMissed = undefined
          // data.event.remove()
          _this.MarkAsMissed(data, close, status)
        }
        //
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
        if (_this.state.APIStatus.InProgress) {
          info.revert()
          return
        }

        _this.setState({
          APIStatus: {
            ..._this.state.APIStatus,
            InProgress: true
          }
        })

        try {
          // reverse update combined visit
          let reverseUpdateFlag: number = 0
          if (info.event._def.extendedProps.isCombined) {
            let data: any = info.event._def.extendedProps
            if (data.colorChar == 'D') {
              reverseUpdateFlag = 1
              // info.revert()
              // return
            }
          }

          let id = info.event._def.publicId

          // first block start/end //
          let start = moment(info.event._instance.range.start)
            .utc()
            .format()
          let end = moment(info.event._instance.range.end)
            .utc()
            .format()

          console.log('info', info, info.event._def.extendedProps)
          // - //

          // second block star/end //
          // iscombined
          let temp: any = _this.state.Events.find((evt: any) => {
            return evt.id == info.event._def.publicId
          })

          let check: any = null,
            start2: any = null,
            end2: any = null

          if (temp) {
            check = _this.state.Events.find((evt: any) => {
              return (
                evt.id != info.event._def.publicId &&
                evt.isCombined &&
                temp.recertId == evt.recertId &&
                temp.patientId == evt.patientId &&
                temp.start.split('T')[0] == evt.start.split('T')[0]
              )
            })
            if (check) {
              let startEvt2 = new Date(check.start).getTime()
              let endEvt2 = new Date(check.end).getTime()
              let endEvt1 = new Date(end).getTime()

              start2 = end
              end2 = moment(endEvt1 + (endEvt2 - startEvt2))
                .utc()
                .format()
            }
          }
          // - //

          // if (reverseUpdateFlag) {
          //   // case when bottom block of a combined visit is dragged/dropped
          //   let swap
          //   // start time
          //   swap = start
          //   start = start2
          //   start2 = swap

          //   // end time
          //   swap = end
          //   end = end2
          //   end2 = swap
          // }
          //
          flagRefetchScroll = start.split('T')[1]
          //
          let result = await API.GetData(
            `/PatientVisitSchedule/UpdatePatientVisitSchedule?visitScheduleId=${id}&StartDate=${start}&EndDate=${end}${
              info.event._def.extendedProps.combinationVisit
                ? '&combinationVisit=' +
                  info.event._def.extendedProps.combinationVisit
                : ''
            }`
          )

          console.log(info, start, id, end, result, 'DRAG DROP INFO')

          if (result.status == 402) {
            utility.ShowAlert(result.message, 'error')
            info.revert()
          } else {
            // if (temp) {
            //   // got valid data(temp) to compare with
            //   if (check && start2 && end2) {
            //     // means the just updated schedule was a in combination with other(check)
            //     // api
            //     let r = await API.GetData(
            //       `/PatientVisitSchedule/UpdatePatientVisitSchedule?visitScheduleId=${check.id}&StartDate=${start2}&EndDate=${end2}&isCombined=${check.isCombined}`
            //     )
            if (info.event._def.extendedProps.combinationVisit)
              _this.ReFetchMethod(_this.props.FetchStartdate())
            //   }
            // }
            //
          }
        } catch (err) {
          console.log('err', err)
        } finally {
          console.log('i am reverting...')
          _this.setState({
            APIStatus: {
              ..._this.state.APIStatus,
              InProgress: false
            }
          })
        }
      },
      eventDragStop: function (data: any) {
        console.log('CHANGE', data)
      },
      events: events,
      plugins: [timeGridDayPlugin, dayGridPlugin, interactionPlugin]
    })
    calendar.render()
    calendar.gotoDate(CurrentDate)

    //
    window._x = calendar

    if (!CALENDAR) {
      CALENDAR = calendar
    } else {
      CALENDAR.scrollToTime(StartHour)
    }
  }

  GoBack = () => {
    this.props.history.goBack()
  }

  DeletePatient = async (data: any, close: any) => {
    //
    // let temp: any = this.state.Events.find((evt: any) => {
    //   return evt.id == data.event._def.publicId
    // })

    // let check: any
    // if (temp) {
    //   check = this.state.Events.find((evt: any) => {
    //     return (
    //       evt.id != data.event._def.publicId &&
    //       evt.isCombined &&
    //       temp.recertId == evt.recertId &&
    //       temp.patientId == evt.patientId &&
    //       temp.start.split('T')[0] == evt.start.split('T')[0]
    //     )
    //   })

    //   //
    //   if (check) {
    //     const res: any = API.DeleteData(
    //       `/PatientVisitSchedule/RemoveFromVisitSchedule?id=${check.id}${
    //         this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
    //       }`
    //     )
    //   }
    // }

    // console.log('dta', data, check, temp)
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
        }${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
        }`
      )
      console.log(result, 'result')
      // GoBack()
      this.setState(
        {
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        },
        () => {
          this.ReFetchMethod(this.props.FetchStartdate())
        }
      )
      if (close) {
        setTimeout(() => {
          close()
          if (this.props.RefreshTable) this.props.RefreshTable()
        }, 400)
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
      utility.ShowAlert(err.message, 'error')
    }
  }

  LockPatientVisit = async (patientData: any, close: any) => {
    console.log(this.state.PopupData, 'PATIENT')
    // let ID = patientData.event.extendedProps.patientId
    // // console.log('GOT INO LOCK BLOCK', ID)

    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result = await API.GetData(
        `/PatientVisitSchedule/SetVisitLockStatus?isLocked=${!this.state
          .PopupData.EventData.event._def.extendedProps
          .isLocked}&visitScheduleId=${
          this.state.PopupData.EventData.event._def.publicId
        }`
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
          this.ReFetchMethod(this.props.FetchStartdate())
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
      utility.ShowAlert(err.message, 'error')
    }
  }

  FetchData = async () => {
    if (utility.IsAdmin() && !this.GetClinicianId()) {
      this.Init([])
      return
    }
    try {
      this.setState({
        // ...this.state,
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result: any = await API.GetData(
        `/PatientVisitSchedule/GetVisitSchedule?pagesize=${100}&pagenumber=${1}&mode=manual${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
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
        this.Init([])
        if (result.status == 401) {
          if (this.props.ReportUpgradePlan) this.props.ReportUpgradePlan(result)
        }
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
      utility.ShowAlert(err.message, 'error')
    } finally {
      this.setState({
        fetching: false
      })
    }
  }

  SemiAutomatic = async () => {
    if (this.state.APIStatus.InProgress) return
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
      CurrentDate = moment(
        window._x ? window._x.view.getCurrentData().currentDate : new Date()
      ).format()
      let startdate: any = utility.FormatDate(CurrentDate)

      let result: any = await API.GetData(
        `/PatientVisitSchedule/GetVisitSchedule?pagesize=1000&pagenumber=1&mode=semiautomatic&startdate=${startdate}${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
        }`
      )
      console.log(result, 'VISITING SCHEDULE')

      if (result.data != null && result.data != undefined) {
        if (result.data.length != 0) {
          this.ReFetchMethod(this.props.FetchStartdate())
          // this.Init(result.data)

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
      utility.ShowAlert(err.message, 'error')
    }
  }

  Navigate = (manual: any = false) => {
    console.log('manual nav', manual)
    // if (!manual) {
    //   let data = this.state.Events.find((v: any) => {
    //     return (
    //       moment(v.start)
    //         .utc()
    //         .format('HH:mm:ss') >
    //       moment(new Date())
    //         .utc()
    //         .format('HH:mm:ss')
    //     )
    //   })
    //   if (data == undefined) {
    //     this.setState({
    //       APIStatus: {
    //         ...this.state.APIStatus,
    //         Failed: true,
    //         FailMessage: 'You have visited all your patients!'
    //       }
    //     })
    //   } else {
    //     utility.navigateToGoogleMaps(data.patientLat, data.patientLong)
    //   }
    // } else {
    let ClickedEvt: any = this.state.PopupData.EventData.event
    // temp = temp.event._def.extendedProps
    // let lat = temp.patientLat
    // let long = temp.patientLong
    // utility.navigateToGoogleMaps(lat, long)

    let AllEvents: any[] = []
    if (window._x) {
      AllEvents = window._x.getEvents()
    }

    let fromEvt: any = undefined
    let ClickedEvtEndDate: any = moment(ClickedEvt._instance.range.end).utc()

    AllEvents.forEach((evt: any) => {
      let evtEndDaye: any = moment(evt._instance.range.end).utc()
      // console.log('!!!', evtEndDaye, ClickedEvtEndDate)

      // check for same day
      if (ClickedEvtEndDate.format('ll') == evtEndDaye.format('ll')) {
        // check if queried event's end date is greater than the clicked(for navigation from full calendar) event's end date
        if (ClickedEvtEndDate.unix() > evtEndDaye.unix()) {
          if (fromEvt) {
            if (
              evtEndDaye.unix() >
              moment(fromEvt._instance.range.end)
                .utc()
                .unix()
            ) {
              fromEvt = evt
            }
            return
          }
          fromEvt = evt
        }
      }
    })

    console.log('!!@!!', fromEvt, ClickedEvt)

    if (fromEvt) {
      utility.navigateToGoogleMaps(
        ClickedEvt._def.extendedProps.patientLat,
        ClickedEvt._def.extendedProps.patientLong,
        fromEvt._def.extendedProps.patientLat,
        fromEvt._def.extendedProps.patientLong
      )
    } else {
      let source = {
        lat: utility.ValueFromUserData('lat'),
        long: utility.ValueFromUserData('long')
      }
      if (
        utility.ReduceString(this.state.distanceCalculator) === 'agencyaddress'
      ) {
        source = {
          lat: utility.ValueFromUserData('agencyLatitude') || source.lat,
          long: utility.ValueFromUserData('agencyLongitude') || source.long
        }
      }

      utility.navigateToGoogleMaps(
        ClickedEvt._def.extendedProps.patientLat,
        ClickedEvt._def.extendedProps.patientLong,
        source.lat,
        source.long
      )
    }

    // }
  }

  IsActive = (random: any, view: any) => {
    if (ActiveView == view) {
      return 'full-calendar-toggle-btn is-active'
    }
    return 'full-calendar-toggle-btn'
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

  GetClinicianId = () => {
    if (this.props.GetClinicianId) return this.props.GetClinicianId()
    return ''
  }

  MarkAsMissed = async (data: any, close: any, status: any = 'Missed') => {
    console.log('marking as missed...')

    //
    // let temp: any = this.state.Events.find((evt: any) => {
    //   return evt.id == data.event._def.publicId
    // })

    // let check: any
    // if (temp) {
    //   check = this.state.Events.find((evt: any) => {
    //     return (
    //       evt.id != data.event._def.publicId &&
    //       evt.isCombined &&
    //       temp.recertId == evt.recertId &&
    //       temp.patientId == evt.patientId &&
    //       temp.start.split('T')[0] == evt.start.split('T')[0]
    //     )
    //   })

    //   //
    //   if (check) {
    //     const res = API.PostData(
    //       `/PatientVisitSchedule/UpdateVisitStatus?id=${
    //         check.id
    //       }&status=${status}&patientDateId=${0}${
    //         this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
    //       }`,
    //       {}
    //     )
    //   }
    // }

    // console.log('dta', data, check, temp)
    //

    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      const result = await API.PostData(
        `/PatientVisitSchedule/UpdateVisitStatus?id=${
          data.event._def.publicId
        }&status=${status}&patientDateId=${0}${
          this.GetClinicianId() ? '&clinicianId=' + this.GetClinicianId() : ''
        }`,
        {}
      )
      console.log(result, 'result of marking missed')
      // GoBack()
      if (result.status == 402) {
        utility.ShowAlert(result.message, 'error')
      }
      this.setState(
        {
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        },
        () => {
          this.ReFetchMethod(this.props.FetchStartdate())
        }
      )
      if (close) {
        close()
        if (this.props.RefreshTable) this.props.RefreshTable()
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
      utility.ShowAlert(err.message, 'error')
    }
  }

  render () {
    return (
      <div className='patient-schedule'>
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
                        this.props.props.history.push(
                          `/patients/${this.state.PopupData.EventData.event._def.extendedProps.patientId}`
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
                    <button
                      className='btn-view'
                      disabled={this.state.APIStatus.InProgress}
                      onClick={() => {
                        if (MarkMissed) {
                          MarkMissed(close, 'Completed')
                        }
                      }}
                    >
                      Mark as Complete
                    </button>
                    <button
                      className='btn-mark-as-missed'
                      disabled={this.state.APIStatus.InProgress}
                      onClick={() => {
                        if (MarkMissed) {
                          MarkMissed(close, 'Missed')
                        }
                      }}
                    >
                      Mark as Missed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Popup>
        <div className='row scheduling-options'>
          <div className='col-md-12 full-calendar-toggle-options'>
            <span
              className={this.IsActive(this.state, 'timeGridDay')}
              onClick={() => {
                ActiveView = 'timeGridDay'
                this.setState({ ...this.state })
                this.ReFetchMethod(null)
              }}
            >
              Today
            </span>
            <span
              className={this.IsActive(this.state, 'timeGridWeek')}
              onClick={() => {
                this.setState({ ...this.state })
                ActiveView = 'timeGridWeek'
                this.ReFetchMethod(null)
              }}
            >
              Week
            </span>
            <span
              className={this.IsActive(this.state, 'dayGridMonth')}
              onClick={() => {
                ActiveView = 'dayGridMonth'
                this.setState({ ...this.state })
                this.ReFetchMethod(null)
              }}
            >
              Month
            </span>
            {/* <div className='add-btn'>
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
            </div> */}
          </div>
        </div>
        {/*  */}
        {this.state.fetching ? (
          <div className='in-progress'>
            <Loader
              visible={true}
              type='Oval'
              color='#009944'
              height={15}
              width={15}
            />
          </div>
        ) : null}
        {/*  */}
        <div id={`test`} className={`timeGridDay`}></div>
        <div className='row scheduling-options'>
          <div className='col-md-12 flex-box full-calendar-footer'>
            {ActiveView == 'timeGridDay' ? (
              <div
                id='semi-auto-btn'
                className={`auto-schedule ${
                  this.state.APIStatus.InProgress ? 'is-disabled' : ''
                }`}
                onClick={this.SemiAutomatic}
                title={'Semi-automatic Scheduling'}
              >
                <i className='fas fa-th-large hand' title=''></i>
              </div>
            ) : null}
            {/* {this.state.APIStatus.Failed ? (
              <span className='text-danger'>
                {this.state.APIStatus.FailMessage}
              </span>
            ) : null} */}
            {!this.state.fetching ? (
              <i
                className='fas fa-redo-alt hand'
                title={'Refresh calendar data'}
                onClick={() => {
                  this.ReFetchMethod(this.props.FetchStartdate())
                }}
              ></i>
            ) : (
              <div className='in-progress'>
                <Loader
                  visible={true}
                  type='Oval'
                  color='#009944'
                  height={15}
                  width={15}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default CaseloadFullCalendar
