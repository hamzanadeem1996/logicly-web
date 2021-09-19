import React from 'react'
import * as API from '../../../Services/Api'
import * as utility from '../../../Services/utility'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import moment from 'moment'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridDayPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import Loader from 'react-loader-spinner'
interface IState {
  Data: any
  Events: any[]
  PopupData: any
  ShowPopup: boolean
  IncludeWeekendsInWeekView: boolean
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
  IncludeWeekendsInWeekView: true,
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

let ActiveView: any = 'timeGridDay'
let CurrentDate: any = utility.UTCNow()
let StartHour: any = '06:00:00'

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
    this.Init([])
    if (this.props.CBToRefreshFullCalendarData) {
      this.props.CBToRefreshFullCalendarData(this.ReFetchMethod)
    }
    //
  }

  ReFetchMethod = (startdate: any) => {
    console.log('full calendar refresh', startdate, this.GetIds())
    // check
    if (this.GetIds().cid && this.GetIds().pid) {
      if (startdate === undefined && window._x)
        CurrentDate = moment(
          window._x.view.getCurrentData().currentDate
        ).format()
      if (startdate) CurrentDate = startdate
      this.GetSettings()
    } else {
      this.Init([])
    }
    //
  }

  GetSettings = async () => {
    this.FetchData()
    let result: any = await API.GetData(
      `/Setting/Get?${this.GetIds() ? 'clinicianId=' + this.GetIds().cid : ''}`
    )
    console.log('result', result)
    if (result.data) {
      this.setState({
        IncludeWeekendsInWeekView:
          result.data.includeWeekendsInWeekView == 'Yes'
      })
      StartHour = result.data.start
    }
  }

  Init = (events: any, view: any = undefined) => {
    let _this = this

    if (ActiveView == 'timeGridDay') {
      events.forEach((v: any) => {
        if (v.isLocked) {
          v.editable = false
        }
        if (v.distance == undefined) return
        v.title = `${v.title}\nDrive: ${v.distance} ${
          v.units == 'Kilometers' ? 'Km' : 'mi'
        }\n`
      })
    }

    var calendarEl: any = document.getElementById('patient-schedule')
    var calendar = new Calendar(calendarEl, {
      initialView: ActiveView || 'timeGridDay',
      titleFormat: { month: 'long', day: 'numeric', year: 'numeric' },
      height: 650,
      timeZone: 'UTC',
      scrollTime: StartHour,
      contentHeight: 700,
      weekends: this.state.IncludeWeekendsInWeekView,
      editable: false,
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
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      datesSet: function (info: any) {
        // console.log('INFO', info)
        // calendar.gotoDate(calendar.getDate())
      },
      eventClick: function (data: any) {},
      eventDrop: async function (info: any) {},
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

  FetchData = async () => {
    try {
      this.setState({
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result: any = await API.GetData(
        `/PatientVisitSchedule/GetSinglePatientVisitSchedule?patientId=${
          this.GetIds().pid
        }&clinicianId=${this.GetIds().cid}`
      )
      console.log(result, 'result')

      if (result.data) {
        this.Init(result.data.items)
        this.setState({
          ...this.state,
          Events: result.data.items,
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
    } finally {
      this.setState({
        fetching: false
      })
    }
  }

  IsActive = (random: any, view: any) => {
    if (ActiveView == view) {
      return 'full-calendar-toggle-btn is-active'
    }
    return 'full-calendar-toggle-btn'
  }

  GetIds = () => {
    if (this.props.GetClinicianId) return this.props.GetClinicianId()
    return ''
  }

  render () {
    return (
      <div className='patient-schedule'>
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
        <div id={`patient-schedule`} className={`timeGridDay`}></div>
      </div>
    )
  }
}

export default CaseloadFullCalendar
