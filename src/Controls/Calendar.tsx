import React from 'react'
import * as dateFns from 'date-fns'
import './styles/Calendar.css'
var _ = require('lodash')

const isInArray = (array: any, date: Date) =>
  !!array.find((item: any) => item.getTime() === date.getTime())

interface IState {
  selectedMonth: Date
  selectedDate: Date
  eventDates: Array<{
    class: string
    date: Date
  }>
  legends: any
}
const InitialState: IState = {
  selectedMonth: new Date(),
  selectedDate: new Date(),
  eventDates: [],
  legends: []
}

interface ICalProps {
  onChange?: () => {}
  selectedMonth?: Date
  selectedDate?: Date
  eventDates: Array<{
    class: string
    date: Date
  }>
  minDate: Date
  maxDate: Date
  legends: any
  customStyles?: {
    header: {}
    title: {}
    prev: {}
    next: {}
    days: {}
    daysRow: {}
    body: {}
    numberRow: {}
    cell: {}
    innerCell: {}
    number: {}
    selected: {}
    event: {}
    disabled: {}
    outOfRange: {}
    extra: any
  }
}

const DefaultProps: ICalProps = {
  //   onChange: () => {},
  selectedMonth: new Date(),
  selectedDate: new Date(),
  eventDates: [],
  legends: [],
  minDate: new Date(),
  maxDate: new Date(),
  customStyles: {
    header: {},
    title: {},
    prev: {},
    next: {},
    days: {},
    daysRow: {},
    body: {},
    numberRow: {},
    cell: {},
    innerCell: {},
    number: {},
    selected: {},
    event: {},
    disabled: {},
    outOfRange: {},
    extra: {}
  }
}

const Calendar: React.FC<ICalProps> = (props: ICalProps) => {
  const [state, setMyState] = React.useState<IState>(InitialState)

  state.eventDates = props.eventDates
  // console.log(props,"PROPS ")
  //   state = {
  //     selectedMonth: props.selectedMonth,
  //     selectedDate: props.selectedDate,
  //     eventDates: props.eventDates
  //   };

  function renderHeader (): any {
    const label = dateFns.format(state.selectedMonth, 'MMMM yyyy')
    const customStyles:any = props.customStyles || {}

    return (
      <div className='header row' style={customStyles.header}>
        <div
          className='col col-start'
          style={customStyles.prev}
          onClick={prevMonth}
        >
          <div className='icon'>chevron_left</div>
        </div>
        <div className='col col-center' style={customStyles.title}>
          <span>{label}</span>
        </div>
        <div
          className='col col-end'
          style={customStyles.next}
          onClick={nextMonth}
        >
          <div className='icon'>chevron_right</div>
        </div>
      </div>
    )
  }

  function renderDays () {
    const customStyles:any = props.customStyles || {}

    const startDate = dateFns.startOfWeek(state.selectedMonth)
    const days = []

    for (let i = 0; i < 7; i++) {
      const label = dateFns.format(dateFns.addDays(startDate, i), 'EEE')
      days.push(
        <div key={i} className='col col-center' style={customStyles.days}>
          {label}
        </div>
      )
    }

    return (
      <div className='days row' style={customStyles.daysRow}>
        {days}
      </div>
    )
  }

  function getEvent (day: Date) {
    var evt = _.find(state.eventDates, { date: day })
    // console.log(evt,state.eventDates,"DATES")
    return evt
  }

  function renderCells () {
    const { selectedMonth, selectedDate, eventDates } = state
    const { minDate, maxDate } = props
    const customStyles:any = props.customStyles || {}

    const monthStart = dateFns.startOfMonth(selectedMonth)
    const monthEnd = dateFns.endOfMonth(monthStart)
    const startDate = dateFns.startOfWeek(monthStart)
    const endDate = dateFns.endOfWeek(monthEnd)
    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = dateFns.format(day, 'd')
        const cloneDay = day

        let outerClass = 'col cell'
        let outerStyle = customStyles.cell
        if (!dateFns.isSameMonth(day, monthStart)) {
          outerClass += ' disabled fad'
          outerStyle = { ...outerStyle, ...customStyles.extra }
        }
        if (dateFns.isBefore(day, minDate) || dateFns.isAfter(day, maxDate)) {
          outerClass += ' disabled outside'
          outerStyle = {
            ...outerStyle,
            ...customStyles.extra,
            ...customStyles.outOfRange
          }
        }

        let innerClass = 'innerCell'
        let innerStyle = customStyles.innerCell
        var evt = getEvent(day)
        if (evt != undefined) {
          innerClass += ` event ${evt.class}`
          innerStyle = { ...innerStyle, ...customStyles.event }
        }
        if (dateFns.isSameDay(day, selectedDate)) {
          // innerClass += ' selected'; //we do not need to highlight the current date
          innerStyle = { ...innerStyle, ...customStyles.selected }
        }

        days.push(
          <div
            key={day.toString()}
            className={outerClass}
            style={outerStyle}
            onClick={() =>
              onDateClick(dateFns.parse(cloneDay.toString(), '', 0))
            }
          >
            <div className={innerClass} style={innerStyle}>
              <span className='number' style={customStyles.number}>
                {formattedDate}
              </span>
            </div>
          </div>
        )

        day = dateFns.addDays(day, 1)
      }

      rows.push(
        <div
          key={day.toString()}
          className='row'
          style={customStyles.numberRow}
        >
          {days}
        </div>
      )

      days = []
    }
    return (
      <div className='body' style={customStyles.body}>
        {rows}
      </div>
    )
  }

  function onDateClick (day: Date) {
    state.selectedDate = day
    setMyState({ ...state })
    // if (props.onChange) props.onChange(day); //SKIP FOR NOW
  }

  function nextMonth () {
    state.selectedMonth = dateFns.addMonths(state.selectedMonth, 1)
    setMyState({ ...state })
  }

  function prevMonth () {
    state.selectedMonth = dateFns.subMonths(state.selectedMonth, 1)
    setMyState({ ...state })
  }

  function renderLegends () {
    if (props.legends == undefined || props.legends.length == 0) return
    return (
      <div className='legends'>
        {props.legends.map((v: any, i: any) => {
          return (
            <>
              <div className='legendInner'>
                <span style={{ background: v.color }}> </span>
                <label>{v.name}</label>
                {/* {v.name=="Evaluation"?(<br/>):""} */}
              </div>
            </>
          )
        })}
      </div>
    )
  }
  return (
    // {const { customStyles } = props;}
    // style={customStyles.calendar}

    <div className='calendar'>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderLegends()}
    </div>
  )
}

Calendar.defaultProps = DefaultProps

// Calendar.defaultProps = {
//   onChange: () => {},
//   selectedMonth: new Date(),
//   selectedDate: new Date(),
//   eventDates: [],
//   minDate: undefined,
//   maxDate: undefined,
//   customStyles: {
//     header: {},
//     title: {},
//     prev: {},
//     next: {},
//     days: {},
//     daysRow: {},
//     body: {},
//     numberRow: {},
//     cell: {},
//     innerCell: {},
//     number: {},
//     selected: {},
//     event: {},
//     disabled: {},
//     outOfRange: {}
//   }
// }

export default Calendar
