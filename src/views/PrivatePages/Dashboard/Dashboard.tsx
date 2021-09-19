import React, { Component } from 'react'
import Chart from 'chart.js'
import { GetData } from '../../../Services/Api'
import CountUp from 'react-countup'
import Datetime from 'react-datetime'
import 'react-datetime/css/react-datetime.css'
import { MONTHS, WEEKDAYS, FormatDate } from '../../../Services/utility'
import moment from 'moment'
import Loader from 'react-loader-spinner'
interface IState {
  [x: string]: any
  ActiveGraph: string
  RDTDate: any
  Data: any
  GraphData: any[]
  Clinicians: any[]
  SelectedClinician: any
  DriveData: any
  InProgress: boolean
}

let MYCHART: any = undefined

//
let _month = [
  { head: 'Month', accessor: 'month' },
  { head: 'Year', accessor: 'year' },
  { head: 'Total Miles', accessor: 'distance' }
]
let _week = [
  { head: 'Day', accessor: 'day' },
  { head: 'Total Miles', accessor: 'distance' }
]
let _daily = [{ head: 'Date' }, { head: 'Total Miles' }]
//
class Dashboard extends Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ActiveGraph: 'month',
      RDTDate: moment(),
      Data: {},
      GraphData: [],
      Clinicians: [],
      SelectedClinician: '',
      DriveData: {},
      InProgress: false
    }
  }
  componentDidMount = () => {
    // reset the global variable
    MYCHART = undefined
    //
    this.FetchClinicians()
    this.InitGraph()
    this.FetchData()
  }

  FetchClinicians = async () => {
    try {
      let result: any = await GetData(`/User/GetAll`)
      console.log('result users', result)
      if (result.data) {
        this.setState({
          Clinicians: result.data.items
        })
      }
    } catch (err) {
      console.log('err', err)
    }
  }

  FetchDriveHistory = async () => {
    try {
      this.setState({ InProgress: true })
      let result: any = await GetData(
        `/Dashboard/DrivenHistory?Date=${this.state.RDTDate.format(
          'MM-DD-YYYY'
        ) || FormatDate(new Date(), 'MM-DD-YYYY')}${
          this.state.SelectedClinician
            ? '&clinician=' + this.state.SelectedClinician
            : ''
        }`
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
    }
  }

  FetchData = async () => {
    try {
      // fetch clinician drive history
      this.FetchDriveHistory()
      this.setState({ InProgress: true })
      let result: any = await GetData(
        `/Dashboard/AgencyDashboard?Date=${this.state.RDTDate.format(
          'MM-DD-YYYY'
        ) || FormatDate(new Date(), 'MM-DD-YYYY')}`
      )
      console.log('result', result)
      if (result.data)
        this.setState({
          Data: result.data
        })
    } catch (err) {
      console.log('error', err)
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
      temp = [...(this.state.Data.admissionCompleted || [])]
      CompareWith = [...MONTHS]
      key = 'month'
    } else {
      temp = [...(this.state.Data.weekly || [])]
      CompareWith = [...WEEKDAYS]
      key = 'day'
    }
    //

    let dailyLabel: any[] = []
    if (this.state.ActiveGraph == 'daily') {
      data.push(this.state.Data.daily.count || '0')
      dailyLabel.push(
        this.state.RDTDate.format('MM-DD-YYYY') ||
          FormatDate(this.state.Data.daily.admission, 'MM-DD-YYYY')
      )
    } else {
      data = CompareWith.reduce((a, c) => {
        console.log('reduc mthd', temp, a, c)
        let index: number = temp.findIndex((value: any) => {
          console.log('!', value, key, c)
          return value[key] == c
        })
        if (index !== -1) {
          a.push(temp[index].count)
          largest =
            largest < parseInt(temp[index].count) ? temp[index].count : largest
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
              label: 'Admissions',
              data: [],
              backgroundColor: my_gradient,
              borderWidth: 1
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
                  stepSize: 5,
                  max: 50
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
  IsActive = (random: any, type: string, compareKey: string) => {
    if (this.state[compareKey] == type) {
      return 'toggle-btn is-active'
    } else {
      return 'toggle-btn'
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

  HandleClinician = (evt: any) => {
    let { value } = evt.target
    value = value == 'all' ? '' : value
    this.setState({ SelectedClinician: value }, () => {
      this.FetchDriveHistory()
    })
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
                  <span>Visits Scheduled</span>
                  <CountUp
                    end={this.state.Data.visitsScheduled || 0}
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
                  <span>Clinicians</span>
                  <CountUp
                    end={this.state.Data.clinicians || 0}
                    className='count-up'
                    duration={2}
                  />
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
                  <span>Missed Visits</span>
                  <CountUp
                    end={this.state.Data.missedVisits || 0}
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
                  <span>Last 30 Days</span>
                  <CountUp
                    end={this.state.Data.visitsLast30Days || 0}
                    className='count-up'
                    duration={2}
                  />
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
              Admission Completed
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
          <canvas id='admission-bar-chart'></canvas>
        </div>
        <div className='row'>
          <div className='col-md-9'>
            <div className='bar-graph'>
              <h2>
                Clinician Detail
                <span className='table-drop-down'>
                  <select
                    className='form-control'
                    onChange={this.HandleClinician}
                    disabled={this.state.InProgress}
                  >
                    <option value='all' selected>
                      All Clinicians
                    </option>
                    {this.state.Clinicians.map((clinician: any) => {
                      return (
                        <option value={clinician.id}>
                          {clinician.fullName}
                        </option>
                      )
                    })}
                  </select>
                </span>
              </h2>
              <table className='table'>
                <thead>
                  <tr>{this.RenderHeaders()}</tr>
                </thead>
                <tbody>
                  {!this.state.DriveData[this.state.ActiveGraph] ||
                  this.state.DriveData[this.state.ActiveGraph].length == 0 ? (
                    <tr>
                      <td colSpan={9}>No Data</td>
                    </tr>
                  ) : this.state.ActiveGraph !== 'daily' ? (
                    this.state.DriveData[this.state.ActiveGraph].map(
                      (driven: any) => {
                        return <tr>{this.RenderTableData(driven)}</tr>
                      }
                    )
                  ) : (
                    <>
                      <td>
                        {this.state.RDTDate.format('MM-DD-YYYYY') ||
                          FormatDate(new Date(), 'MM-DD-YYYY')}
                      </td>
                      <td>{this.state.DriveData.daily || 0}</td>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className='col-md-3 table-aside-section'>
            {/* <div className='row overview-section'>
              <div className='col-md-12 dashboard-card'>
                <div className='row'>
                  <div className='col-7 data'>
                    <label>
                      <span>Missed visits per clinician and discipline</span>
                      <strong className='green-text'>
                        <CountUp
                          end={this.state.Data.missedVisitsPerClinician || 0}
                          className='count-up'
                          duration={2}
                        />
                      </strong>
                    </label>
                  </div>
                  <div className='col-5'>
                    <div className='image green-border'>
                      <img
                        src='../../images/dash-clinicians-green.png'
                        alt=''
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className='col-md-12 dashboard-card'>
                <div className='row'>
                  <div className='col-7 data'>
                    <label>
                      <span>Missed visits per agency</span>
                      <strong className='red-text'>
                        <CountUp
                          end={this.state.Data.missedVisitsPerAgency || 0}
                          className='count-up'
                          duration={2}
                        />
                      </strong>
                    </label>
                  </div>
                  <div className='col-5'>
                    <div className='image red-border'>
                      <img src='../../images/dash-report-red.png' alt='' />
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard
