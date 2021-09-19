import React, { Component } from 'react'
import Chart from 'chart.js'
import { GetData } from '../../../Services/Api'
import CountUp from 'react-countup'
import Datetime from 'react-datetime'
import 'react-datetime/css/react-datetime.css'
import {
  MONTHS,
  WEEKDAYS,
  HOURS,
  FormatDate,
  ValueFromUserData
} from '../../../Services/utility'
import Loader from 'react-loader-spinner'
import moment from 'moment'
interface IState {
  [x: string]: any
  RDTDate: any
  ActiveGraph: string
  Data: any
  DriveData: any
  InProgress: boolean
}

let MYCHART: any = undefined

//
let _month = [
  { head: 'Month', accessor: 'month' },
  { head: 'Year', accessor: 'year' },
  { head: 'Total Earning', accessor: 'distance' }
]
let _week = [
  { head: 'Day', accessor: 'day' },
  { head: 'Total Earning', accessor: 'distance' }
]
let _daily = [{ head: 'Date' }, { head: 'Total Earning' }]
//
class ClinicianDashboard extends Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      DriveData: {},
      RDTDate: moment(),
      ActiveGraph: 'month',
      Data: {},
      InProgress: false
    }
  }
  componentDidMount = () => {
    // reset the global variable
    MYCHART = undefined
    //
    this.InitGraph()
    this.FetchData()
  }

  FetchData = async () => {
    try {
      this.FetchDriveHistory()
      this.setState({ InProgress: true })
      let result: any = await GetData(`/Dashboard/ClinicianDashboard`)
      console.log('result', result)
      if (result.data)
        this.setState({
          Data: result.data
        })
    } catch (err) {
      console.log('error', err)
    } finally {
      this.setState({ InProgress: false })
    }
  }

  FetchDriveHistory = async () => {
    try {
      this.setState({ InProgress: true })
      let result: any = await GetData(
        `/Dashboard/DrivenHistory?Date=${this.state.RDTDate.format(
          'MM-DD-YYYY'
        ) || FormatDate(new Date(), 'MM-DD-YYYY')}${'&clinician=' +
          ValueFromUserData('id')}`
      )
      console.log(result, 'result drive')
      if (result.data) {
        this.setState({
          DriveData: result.data
        })
      }
    } catch (err) {
      console.log('err', err)
    } finally {
      this.setState({ InProgress: false })
      this.AddData()
      // this.InitGraph()
    }
  }

  AddData = () => {
    //
    // data for graph
    let data: any[] = []
    // hold decided data
    let temp: any[] = []
    // compare with
    let CompareWith: any[] = []
    let key: string = ''
    let largest: number = 25

    // decide data
    if (this.state.ActiveGraph === 'month') {
      temp = [...(this.state.DriveData.month || [])]
      CompareWith = [...MONTHS]
      key = 'month'
    } else {
      temp = [...(this.state.DriveData.week || [])]
      CompareWith = [...WEEKDAYS]
      key = 'day'
    }
    //

    let dailyLabel: any[] = []
    if (this.state.ActiveGraph == 'daily') {
      data.push(this.state.DriveData.daily || '0')
      dailyLabel.push(
        this.state.RDTDate.format('MM-DD-YYYY') ||
          FormatDate(this.state.DriveData.driveDate, 'MM-DD-YYYY')
      )
    } else {
      data = CompareWith.reduce((a, c) => {
        console.log('reduc mthd', temp, a, c)
        let index: number = temp.findIndex((value: any) => {
          console.log('!', value, key, c)
          return value[key] == c
        })
        if (index !== -1) {
          a.push(temp[index].distance)
          largest =
            largest < parseInt(temp[index].distance)
              ? temp[index].distance
              : largest
        } else {
          a.push(0)
        }
        return a
      }, [])
    }
    console.log('graph data', data)
    //
    if (MYCHART) {
      console.log('check', MYCHART.data)
      //
      // let copy:any=
      MYCHART.data.labels = []
      // MYCHART.data.datasets = []

      //

      let labels: any[] =
        this.state.ActiveGraph == 'month'
          ? [...MONTHS]
          : this.state.ActiveGraph == 'week'
          ? [...WEEKDAYS]
          : [this.state.RDTDate.format('dddd, MMM DD, YYYY')]

      labels.forEach((label: any, idx: any) => {
        let _l: string = label

        if (this.state.ActiveGraph == 'week') {
          _l = `${this.state.RDTDate.startOf('week')
            .add(idx, 'days')
            .format('dddd, MMM DD, YYYY')}`
        }
        MYCHART.data.labels.push(_l)
      })
      MYCHART.data.datasets.forEach((dataset: any) => {
        dataset.data = []
        data.forEach((_data: any) => {
          dataset.data.push(_data)
        })
      })
      MYCHART.update()
    }
  }

  InitGraph = () => {
    try {
      if (MYCHART) {
        MYCHART.destroy()
      }

      var ctx: any = document.getElementById('admission-bar-chart')
      ctx = ctx.getContext('2d')
      var my_gradient = ctx.createLinearGradient(0, 0, 0, 600)
      my_gradient.addColorStop(0, '#3385DA')
      my_gradient.addColorStop(0.4, '#3385DA')
      my_gradient.addColorStop(1, '#09C8FA')
      var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Driven(miles)',
              data: [],
              backgroundColor: my_gradient,
              borderWidth: 1,
              barPercentage: this.state.ActiveGraph === 'daily' ? 0.1 : 1
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  stepSize: 200,
                  max: 1000
                }
              }
            ]
          }
        }
      })
      //
      MYCHART = myChart
    } catch (err) {
      console.log('err', err)
    }
  }

  GetDate = () => {
    if (this.state.ActiveGraph !== 'month') {
      if (this.state.ActiveGraph === 'week') {
        return `${this.state.RDTDate.startOf('week').format(
          'MM-DD-YYYY'
        )} - ${this.state.RDTDate.endOf('week').format('MM-DD-YYYY')}`
      }
      return this.state.RDTDate.format('MM-DD-YYYY')
    }
    return this.state.RDTDate.format('YYYY')
  }

  IsActive = (random: any, type: string, compareKey: string) => {
    if (this.state[compareKey] == type) {
      return 'toggle-btn is-active'
    } else {
      return 'toggle-btn'
    }
  }

  IsLoading = () => {
    if (!this.state.InProgress) {
      return
    }
    return (
      <span className='data-fetching'>
        <Loader
          visible={true}
          type='Oval'
          color='#009944'
          height={20}
          width={20}
        />
      </span>
    )
  }

  RenderHeaders = () => {
    let data: any[] = []
    if (this.state.ActiveGraph === 'month') {
      data = _month
    } else if (this.state.ActiveGraph === 'week') {
      data = _week
    } else {
      data = _daily
    }
    return data.map((value: any) => {
      return <th>{value.head}</th>
    })
  }

  RenderTableData = (data: any) => {
    let temp: any[] = []
    if (this.state.ActiveGraph === 'month') {
      temp = _month
    } else if (this.state.ActiveGraph === 'week') {
      temp = _week
    } else {
      temp = _daily
    }

    if (this.state.ActiveGraph === 'daily') {
      //do nothing
      return null
    } else {
      return temp.map((value: any) => {
        return <td>{data[value.accessor]}</td>
      })
    }
  }

  render () {
    return (
      <div className='white-container dashboard'>
        {/* Badges */}
        <div className='row overview-section'>
          <div className='col-md-3 dashboard-card visits-scheduled'>
            <div className='row'>
              <div className='col-7 data'>
                <label>
                  <span>Patients</span>
                  <CountUp
                    end={this.state.Data.patients || 0}
                    className='count-up'
                    duration={2}
                  />
                </label>
              </div>
              <div className='col-5'>
                <div className='image'>
                  <img src='../../images/dash-visit-schedule.png' alt='' />
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3 dashboard-card clinicians'>
            <div className='row'>
              <div className='col-7 data'>
                <label className='purple-text'>
                  <span>Driving Time</span>
                  <CountUp
                    end={this.state.Data.drivingTime || 0}
                    className='count-up'
                    duration={2}
                  />
                  hrs
                </label>
              </div>
              <div className='col-5'>
                <div className='image'>
                  <img src='../../images/dash-clinicians.png' alt='' />
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3 dashboard-card missed-visits'>
            <div className='row'>
              <div className='col-7 data'>
                <label className='orange-text'>
                  <span>Admissions</span>
                  <CountUp
                    end={this.state.Data.admissions || 0}
                    className='count-up'
                    duration={2}
                  />
                </label>
              </div>
              <div className='col-5'>
                <div className='image'>
                  <img src='../../images/dash-missed-visits.png' alt='' />
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3 dashboard-card last-visits'>
            <div className='row'>
              <div className='col-7 data'>
                <label className='orange-text'>
                  <span>Travelled Distance</span>
                  <CountUp
                    end={this.state.Data.lengthOfVisits || 0}
                    className='count-up'
                    duration={2}
                  />
                  mi
                </label>
              </div>
              <div className='col-5'>
                <div className='image'>
                  <img src='../../images/dash-dollar-sign.png' alt='' />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Admissions Completed */}
        <div className='bar-graph'>
          <div className='row head'>
            <div className='col-md-4 heading'>
              Route History
              {this.IsLoading()}
            </div>
            <div className='col-md-3'>
              <Datetime
                inputProps={{
                  placeholder: `Select Year`,
                  value: this.GetDate(),
                  readOnly: true
                }}
                onChange={(e: any) => {
                  this.setState(
                    {
                      RDTDate: e
                    },
                    () => {
                      this.FetchData()
                    }
                  )
                }}
                dateFormat={
                  this.state.ActiveGraph === 'month' ? 'YYYY' : 'MM-DD-YYYY'
                }
                timeFormat={false}
                closeOnSelect
              />
            </div>
            <div className='col-md-5'>
              <div className='toggle-options'>
                <span
                  onClick={() => {
                    this.setState(
                      {
                        ActiveGraph: 'month'
                      },
                      () => {
                        this.FetchData()
                      }
                    )
                  }}
                  className={this.IsActive(this.state, 'month', 'ActiveGraph')}
                >
                  Month
                </span>
                <span
                  onClick={() => {
                    this.setState(
                      {
                        ActiveGraph: 'week'
                      },
                      () => {
                        this.FetchData()
                      }
                    )
                  }}
                  className={this.IsActive(this.state, 'week', 'ActiveGraph')}
                >
                  Weekly
                </span>
                <span
                  onClick={() => {
                    this.setState(
                      {
                        ActiveGraph: 'daily'
                      },
                      () => {
                        this.FetchData()
                      }
                    )
                  }}
                  className={this.IsActive(this.state, 'daily', 'ActiveGraph')}
                >
                  Daily
                </span>
              </div>
            </div>
          </div>
          <div>
            <canvas id='admission-bar-chart'></canvas>
          </div>
        </div>
        {/* <div className='row'>
          <div className='col-md-9'>
            <div className='bar-graph'>
              <h2>
                Earning
                <span className='table-drop-down'>
                  <select
                    className='form-control'
                    disabled={this.state.InProgress}
                  >
                    <option value='all' selected>
                      View All
                    </option>
                  </select>
                </span>
              </h2>
              <table className='table'>
                <thead>
                  <tr>{this.RenderHeaders()}</tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={9}>No Data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div> */}
      </div>
    )
  }
}

export default ClinicianDashboard
