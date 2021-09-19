import React from 'react'
import Popup from 'reactjs-popup'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'

interface IState {
  APIStatus: IApiCallStatus
}

let InitialValues: any = {
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

class SchedulingPopup extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = { ...InitialValues }
  }

  ClosePopup = () => {
    console.log('close ops')
    if (this.props.Reset) this.props.Reset()
  }

  AutoSchedule = (mode: any) => {
    console.log('schedule with', mode)
    if (this.props.AutoSchedule) this.props.AutoSchedule(mode)
    
    if (this.props.Reset) this.props.Reset()
  }

  render () {
    return (
      <Popup
        closeOnDocumentClick={true && !this.state.APIStatus.InProgress}
        open={this.props.ShowPopup}
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
                <h4>{`Auto Scheduling`}</h4>
                {this.state.APIStatus.InProgress ? (
                  <div className='text-center text-danger'>Please wait...</div>
                ) : null}
                <div className='options-btn-grp'>
                  <button
                    className='btn-nav'
                    onClick={() => {
                      this.AutoSchedule('Today')
                    }}
                    disabled={this.state.APIStatus.InProgress}
                  >
                    Today
                  </button>
                  <button
                    className='btn-view'
                    onClick={() => {
                      this.AutoSchedule('Week')
                    }}
                    disabled={this.state.APIStatus.InProgress}
                  >
                    Week
                  </button>
                  <button
                    className='btn-delete'
                    disabled={this.state.APIStatus.InProgress}
                    onClick={() => {
                      this.AutoSchedule('Month')
                    }}
                  >
                    Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Popup>
    )
  }
}

export default SchedulingPopup
