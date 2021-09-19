import React from 'react'
import Popup from 'reactjs-popup'
import { GetData } from '../../../Services/Api'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import moment from 'moment'
import { FormatDate, getColor } from '../../../Services/utility'

interface IState {
  [x: string]: any
  StartDate: any
  Documents: any[]
  APIStatus: IApiCallStatus
}

let InitialValues: IState = {
  StartDate: new Date(),
  Documents: [],
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

export default class VisitDates extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...InitialValues
    }
  }

  componentWillReceiveProps = () => {
    // this.FetchData()
  }
  componentDidMount = () => {
    if (this.props.SetupCB) this.props.SetupCB(this.FetchData)
  }

  ClosePopup = () => {
    // cleanup
    console.log('clean up')
    this.setState({
      ...InitialValues
    })
    if (this.props.OnPopupClose) this.props.OnPopupClose()
  }

  HandleDateChange = (action: any) => {
    // INProgress
    // if (this.state.APIStatus.InProgress) {
    //   return
    // }
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
        this.FetchData()
      }
    )
  }

  RenderDateRange = (random: any) => {
    let temp = this.state.StartDate
    return `${moment(temp).format('MMM DD')} - ${moment(temp)
      .add(7, 'days')
      .format('MMM DD, YYYY')}`
  }

  SyncVar: any
  FetchData = async () => {
    try {
      this.setState({
        // ...this.state,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      //
      let temp: any = Math.random()
      this.SyncVar = temp
      //

      let result = await GetData(
        `/MyDocuments/MyDocumentsDue?startdate=${FormatDate(
          this.state.StartDate
        )}&patientid=${this.props.PatientId}`
      )
      console.log('result', result)

      if (temp != this.SyncVar) {
        return
      }

      if (result.data) {
        this.setState({
          ...this.state,
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
    }
  }

  render () {
    return (
      <Popup
        open={this.props.ShowPopup}
        closeOnDocumentClick={true && !this.state.APIStatus.InProgress}
        onClose={this.ClosePopup}
        contentStyle={{
          width: '60%',
          height: '80vh',
          overflow: 'scroll'
        }}
      >
        {(close: any) => {
          return (
            <div className='white-container document-due'>
              <span className='close-btn hand' onClick={close}>
                <i className='fas fa-times'></i>
              </span>
              <div className='row'>
                <div className='col-md-12'>
                  <div className='week-ctrl'>
                    <span className={`contain`}>
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
                {/* {this.state.APIStatus.InProgress ? (
                  <div className='col-md-12 in-progress'>Fetching...</div>
                ) : null} */}
                {this.state.Documents.length == 0 &&
                !this.state.APIStatus.InProgress ? (
                  <div className='col-md-12 in-progress'>
                    No Records Found !{' '}
                  </div>
                ) : null}
                {this.state.Documents.map((doc: any, idx: any) => {
                  return (
                    <>
                      <div className='col-md-6 card'>
                        <div
                          className='head-section'
                          style={{
                            color: getColor(doc.visitType),
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
                                  <div className='col-md-6'>
                                    {event.patientName}
                                  </div>
                                  <div className='col-md-4'>
                                    {' '}
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
        }}
      </Popup>
    )
  }
}
