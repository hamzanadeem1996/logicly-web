import React from 'react'
import 'datatables.net'
import * as API from '../../../Services/Api'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import Pagination from 'react-js-pagination'
import moment from 'moment'
import { getColor, FormatDate } from '../../../Services/utility'
const $ = require('jquery')
$.DataTable = require('datatables.net')

interface IState {
  StartDate: any
  Documents: any[]
  fetching: boolean
  APIStatus: IApiCallStatus
}

class DocumentsDue extends React.Component<{}, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      fetching: false,
      Documents: [],
      StartDate: new Date(),
      APIStatus: {
        InProgress: false,
        Failed: false,
        FailMessage: ''
      }
    }
  }

  componentDidMount = () => {
    this.FetchData()
  }

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

      let result = await API.GetData(
        `/MyDocuments/MyDocumentsDue?startdate=${FormatDate(
          this.state.StartDate
        )}`
      )
      console.log('result', result)

      if (result.data) {
        this.setState({
          Documents: result.data
        })
      } else {
        throw result
      }

      this.setState({
        ...this.state,

        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    } catch (err) {
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

  RenderDateRange = (random: any) => {
    let temp = this.state.StartDate
    return `${moment(temp).format('MMM DD')} - ${moment(temp)
      .add(7, 'days')
      .format('MMM DD, YYYY')}`
  }

  SyncChar: any
  HandleDateChange = (action: any) => {
    // INProgress
    if (this.state.APIStatus.InProgress) {
      return
    }
    let temp: any = new Date()

    if (action == 'inc') {
      temp = moment(this.state.StartDate).add(7, 'days')
    } else {
      temp = moment(this.state.StartDate).subtract(7, 'days')
    }

    console.log('action', action, temp)
    this.setState(
      {
        ...this.state,
        StartDate: temp
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

  render () {
    return (
      <div className='white-container document-due'>
        <div className='row sticky-comp-caseload'>
          <div className='col-md-12'>
            <div className='week-ctrl'>
              <span
                className={`contain ${
                  this.state.APIStatus.InProgress ? 'disabled' : ''
                }`}
              >
                <i
                  className='fas fa-chevron-left hand'
                  onClick={() => {
                    this.HandleDateChange('dec')
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
                    this.HandleDateChange('inc')
                  }}
                ></i>
              </span>
            </div>
          </div>
        </div>
        <div className='row document-block'>
          {this.state.APIStatus.InProgress ? (
            <div className='col-md-12 in-progress'>Fetching...</div>
          ) : null}
          {this.state.Documents.length == 0 &&
          !this.state.APIStatus.InProgress ? (
            <div className='col-md-12 in-progress'>No Records Found ! </div>
          ) : null}
          {this.state.Documents.map((doc: any, idx: any) => {
            return (
              <>
                <div className='col-md-6 card'>
                  <div
                    className='head-section'
                    style={{ color: getColor(doc.visitType), fontWeight: 600 }}
                  >
                    {doc.visitType}
                  </div>
                  <div className='listing'>
                    {doc.events.length == 0 ? (
                      <div className='list-item no-data'>No Data Found!</div>
                    ) : null}
                    {doc.events.map((event: any) => {
                      return (
                        <div className='list-item'>
                          <div className='row'>
                            <div className='col-md-6'>{event.patientName}</div>
                            <div className='col-md-4'>
                              {' '}
                              {moment(event.patientDates).utc().format(
                                'MMM DD, YYYY'
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {idx + 1 == this.state.Documents.length &&
                this.state.Documents.length % 2 == 1 ? (
                  <div className='col-md-6'></div>
                ) : null}
              </>
            )
          })}
        </div>
      </div>
    )
  }
}

export default DocumentsDue
