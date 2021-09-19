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
// let patientId: any = undefined
interface IState {
  Data: any
  fetching: boolean
  PatientId: any
  ClinicianId: any
  APIStatus: IApiCallStatus
}

let initialValues = {
  fetching: false,
  Data: {},
  PatientId: '',
  ClinicianId: '',
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}
class PatientSchedule extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
    console.log('props', props)
  }

  componentDidMount = () => {
    let params = utility.GetParamsFromSearch(this.props.location.search)
    console.log(params.get('patientId'), params.get('clinicianId'))

    this.setState(
      {
        ClinicianId: params.get('clinicianId'),
        PatientId: params.get('patientId')
      },
      () => {
        this.FetchData()
      }
    )
    // patientId = undefined
  }

  Init = (events: any, patient_id: any) => {
    var calendarEl: any = document.getElementById('test')
    var calendar = new Calendar(calendarEl, {
      initialView: 'timeGridDay',
      titleFormat: { month: 'long', day: 'numeric', year: 'numeric' },
      height: 650,
      timeZone: 'UTC',
      scrollTime: '',
      contentHeight: 700,
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
        // left:"dayGridMonth,timeGridWeek,timeGridDay",
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      datesSet: function (info: any) {
        // console.log('INFO', info)
        // calendar.gotoDate(calendar.getDate())
        // callBack(calendar.getDate());
      },
      eventClick: function (data: any) {
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
        // let start = moment(info.event._instance.range.start).utc().format()
        // let end = moment(info.event._instance.range.end).utc().format()
        // console.log(info, 'DRAG DROP INFO')
        // let result = await API.GetData(
        //   `/PatientVisitSchedule/UpdatePatientVisitSchedule?visitScheduleId=${patient_id}&StartDate=${start}&EndDate=${end}`
        // )
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
    calendar.gotoDate(new Date())
  }

  GoBack = () => {
    this.props.history.goBack()
  }

  FetchData = async () => {
    //
    if (!this.state.PatientId || isNaN(this.state.PatientId)) {
      this.GoBack()
      return
    }
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

      // patientId = this.props.match.params.patient_id
      let result = await API.GetData(
        `/PatientVisitSchedule/GetSinglePatientVisitSchedule?patientId=${this.state.PatientId}`
      )
      console.log(result, 'result')

      if (result.data) {
        this.Init(result.data.items, this.state.PatientId)
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

  render () {
    return (
      <div className='white-container patient-schedule'>
        {this.state.fetching ? (
          <div className='in-progress'>Fetching Data...</div>
        ) : null}
        <div id={`test`} className={`timeGridDay`}></div>
      </div>
    )
  }
}

export default PatientSchedule
