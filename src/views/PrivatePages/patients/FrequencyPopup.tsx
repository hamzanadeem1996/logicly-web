import React from 'react'
import Popup from 'reactjs-popup'
import { GetData, PostData, DeleteData } from '../../../Services/Api'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import moment from 'moment'
import InplaceConfirm from '../../../Controls/InplaceConfirm'
import {
  ShowAlert,
  FormatDate,
  IsAdmin,
  IsStaging
} from '../../../Services/utility'
import AutoComplete from './AutoComplete'

interface IState {
  [x: string]: any
  RadioValue: any
  VisitCodes: any[]
  NumberOfUnits: any
  NumberPerUnit: any
  Recerts: any[]
  RecertId: any
  RecertDate: any
  VisitFrequencies: any[]
  ManageRecertFrequencies: boolean
  APIStatus: IApiCallStatus
  ClinicianId: any
}

let InitialValues: IState = {
  RadioValue: 'week',
  VisitCodes: [],
  NumberOfUnits: 1,
  NumberPerUnit: 1,
  Recerts: [],
  RecertId: 0,
  RecertDate: '',
  VisitFrequencies: [],
  ClinicianId: 0,
  ManageRecertFrequencies: false,
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}

let TrackPrev: any = []
export default class FrequencyPopup extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...InitialValues
    }
  }

  componentDidMount = () => {
    if (this.props.FetchData) this.props.FetchData(this.FetchData)
    if (this.props.FetchRecerts) this.props.FetchRecerts(this.FetchRecerts)
  }

  FetchRecerts = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await GetData(
        `/PatientRecertification/GetRecertification?patientId=${this.props.PatientData.id}`
      )
      console.log('result', result)
      if (result.data) {
        result = result.data
        this.setState({
          Recerts: result,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } else {
        throw result
      }
    } catch (err) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  FetchData = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await GetData(
        `/PatientSchedule/Get?patientId=${this.props.PatientData.id}${
          this.state.RecertId && this.state.RecertId !== true
            ? '&recertId=' + this.state.RecertId
            : ''
        }${
          IsAdmin() &&
          this.state.ClinicianId != 0 &&
          this.state.ClinicianId != -1
            ? '&clinicianId=' + this.state.ClinicianId
            : ''
        }`
      )
      console.log('result', result)
      if (result.data.items) {
        result = result.data.items
        let codes: any = []
        result.forEach((code: any) => {
          codes.push(code.generatedVisitCode)
        })
        // track prev frequency
        TrackPrev = [...codes]

        this.setState({
          VisitCodes: codes,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } else {
        throw result
      }
    } catch (err) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  ClosePopup = () => {
    this.setState({
      // cleanup
      ...InitialValues
    })
    if (this.props.OnPopupClose) this.props.OnPopupClose()
  }

  IsRadioActive = (text: any) => {
    return text == this.state.RadioValue ? 'active' : ''
  }

  HandleRadioChange = (e: any) => {
    let { checked, value } = e.target
    this.setState(
      {
        RadioValue: value
      },
      () => {
        this.setState({
          NumberOfUnits: 1,
          NumberPerUnit: 1
        })
      }
    )
  }

  HandleUnitChange = (action: any, name: string) => {
    console.log(action, name, ';')
    if (this.state.APIStatus.InProgress) {
      return
    }
    let temp: any = this.state[name]

    // decrease
    if (temp == 0 && action == 'dec') {
      return
    }

    // increase
    if (name == 'NumberPerUnit') {
      if (this.state.RadioValue == 'month') {
        if (temp == 31 && action == 'inc') {
          return
        }
      } else {
        if (temp == 7 && action == 'inc') {
          return
        }
      }
    } else {
      if (this.state.RadioValue == 'month') {
        if (temp == 2 && action == 'inc') {
          return
        }
      } else {
        if (temp == 10 && action == 'inc') {
          return
        }
      }
    }

    if (action == 'inc') {
      temp += 1
    } else {
      if ((temp == 1 && name == 'NumberOfUnits') || temp == 0) {
        return
      }
      temp -= 1
    }
    this.setState({
      [name]: temp
    })
  }

  AddCode = () => {
    if (this.state.APIStatus.InProgress) {
      return
    }
    let unit = 'w'
    if (this.state.RadioValue == 'month') unit = 'm'
    let temp: any = [...this.state.VisitCodes]
    temp.push(`${this.state.NumberPerUnit}${unit}${this.state.NumberOfUnits}`)
    this.setState(
      {
        VisitCodes: temp
      },
      () => {
        // dynamic
        this.SaveSchedule()
      }
    )
  }

  SaveSchedule = async (close: any = undefined) => {
    try {
      if (this.state.APIStatus.InProgress) {
        return
      }
      if (
        (this.state.ClinicianId === 0 || this.state.ClinicianId === -1) &&
        IsAdmin()
      ) {
        this.setState({
          ClinicianId: -1
        })
        return
      }
      let arr: any = []
      let temp: any = this.state.VisitCodes.join()
      arr.push(temp)
      let data: any = {
        PatientId: this.props.PatientData.id,
        RecertId:
          this.state.RecertId && this.state.RecertId !== true
            ? this.state.RecertId
            : 0,
        GeneratedVisitCode: arr,
        IsFrequencyNew: true
      }

      // if (!IsStaging) delete data.IsFrequencyNew

      // if (close) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      // }

      // if (IsStaging) {
      // comparison logic TrackPrev and VisitCodes(from local state)
      // if TrackPrev length is less than equal to VisitCodes, means that we remove some frequency from previous(if less) or changed the frequency in last position(if equal)
      if (this.state.VisitCodes.length <= TrackPrev.length) {
        data.IsFrequencyNew = true
      } else {
        let flag: number = 0
        // If previously frequency saved is empty, then the IsNewFrequency is supposed to be true
        if (!TrackPrev.length) flag = 1
        TrackPrev.forEach((code: any, idx: any) => {
          if (code != this.state.VisitCodes[idx]) {
            flag = 1
          }
        })
        if (!flag) {
          let temp: any[] = []
          temp.push(this.state.VisitCodes[this.state.VisitCodes.length - 1])
          data.IsFrequencyNew = false
          data.GeneratedVisitCode = temp
        }
      }
      //
      // }

      // console.log(
      //   'data!',
      //   this.state.ClinicianId,
      //   this.state.VisitCodes,
      //   data,
      //   close
      // )
      // return
      let result: any = await PostData(
        `/PatientSchedule/PatientScheduleSave${
          IsAdmin() ? '?clinicianId=' + this.state.ClinicianId : ''
        }`,
        data
      )
      console.log('result', result)

      if (result.status == 402) {
        throw result
      }

      //
      TrackPrev = [...this.state.VisitCodes]
      //
      //   cleanup routine but not when dynamic req
      if (!close) return

      if (this.state.RecertId && this.state.RecertId !== true) {
        this.setState(
          {
            ManageRecertFrequencies: false,
            VisitFrequencies: [],
            ClinicianId: 0
          },
          () => {
            this.FetchRecertData()
          }
        )
      } else {
        if (this.props.CallBackForNewFrequencySet) {
          let ele = ''
          this.state.VisitCodes.forEach((code: any, i: any) => {
            if (i == 0) {
              ele = code
            } else {
              ele += ',' + code
            }
          })
          this.props.CallBackForNewFrequencySet(ele)
        }
        if (close) close()
      }
    } catch (err) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
          // Failed: true,
          // FailMessage: err.message
        }
      })
      ShowAlert(err.message, 'error')
    } finally {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    }
  }

  SaveRecert = async (e: any) => {
    e.preventDefault()
    console.log('sv recert')
    try {
      if (this.state.APIStatus.InProgress) {
        return
      }
      let data: any = {
        PatientId: this.props.PatientData.id,
        // RecertId: this.state.RecertId || 0,
        RecertificationDate: this.state.RecertDate
      }
      if (this.state.RecertId !== true) {
        data.id = this.state.RecertId
      }
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result: any = await PostData(
        '/PatientRecertification/AddRecertification',
        data
      )
      console.log('result', result)
      if (result.data) {
        this.setState({
          RecertId: result.data.id,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } else {
        throw result
      }
      //   cleanup routine
    } catch (err) {
      ShowAlert(err.message, 'error')
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
          // Failed: true,
          // FailMessage: err.message
        }
      })
    }
  }

  FetchRecertData = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await GetData(
        `/PatientSchedule/Get?patientId=${this.props.PatientData.id}&recertId=${this.state.RecertId}`
      )
      console.log('result', result)
      if (result.data.items) {
        result = result.data.items

        result = result.reduce((a: any, c: any) => {
          console.log('...', a, c)
          let check = a.findIndex((ele: any) => {
            return ele.ClinicianId == c.clinicianId
          })
          let obj: any = {
            ClinicianId: c.clinicianId,
            ClinicianName: c.clinicianName,
            Data: []
          }
          // alert(check)
          if (check !== -1) {
            obj.Data = a[check].Data
            obj.Data.push(c)
            a[check] = obj
          } else {
            obj.Data.push(c)
            a.push(obj)
          }

          return a
        }, [])

        console.log('grouping....', result)
        this.setState({
          VisitFrequencies: result,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } else {
        throw result
      }
    } catch (err) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  DeleteRecert = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await DeleteData(
        `/PatientRecertification/DeleteRecertification?id=${this.state.RecertId}`
      )
      console.log('result', result)
      // if (result.data) {
      this.setState(
        {
          RecertId: 0,
          RecertDate: '',
          VisitFrequencies: [],
          ClinicianId: 0,
          Recerts: [],
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        },
        () => {
          this.FetchRecerts()
        }
      )
      // } else {
      //   throw result
      // }
    } catch (err) {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false,
          Failed: true,
          FailMessage: err.message
        }
      })
    }
  }

  HandleAutoComplete = (selection: any, name: any) => {
    console.log('check', selection)
    this.setState(
      {
        ClinicianId: selection ? selection.value : 0,
        VisitCodes: []
      },
      () => {
        this.FetchData()
      }
    )
  }

  RenderVisitFrequency = (close: any = undefined) => {
    return (
      <div className='visit-frequency'>
        <span className='close-btn hand' onClick={close}>
          <i className='fas fa-times'></i>
        </span>
        <div className='header'>
          <label>Patients Visits Frequency</label>
          <span className='green-text font-weight-bold'>
            {this.props.PatientData.fullName}
          </span>
          {/* <div className='api-inprogress'>
            {this.state.APIStatus.InProgress ? (
              <div className='text-danger'>Please wait...</div>
            ) : null}
          </div> */}
          <div className='radio-option-grp'>
            <div className={`form-check ` + this.IsRadioActive('week')}>
              <input
                className='form-check-input'
                type='radio'
                name='flexRadioDefault'
                value='week'
                disabled={this.state.APIStatus.InProgress}
                onChange={this.HandleRadioChange}
                checked={this.state.RadioValue == 'week'}
              />
              <label className='form-check-label'>Week</label>
            </div>
            <div className={`form-check ` + this.IsRadioActive('month')}>
              <input
                className='form-check-input'
                type='radio'
                value='month'
                name='flexRadioDefault'
                disabled={this.state.APIStatus.InProgress}
                onChange={this.HandleRadioChange}
                checked={this.state.RadioValue == 'month'}
              />
              <label className='form-check-label'>Month</label>
            </div>
          </div>
        </div>
        <div className='visit-type-selectors'>
          <div className='selector'>
            # of visits/{this.state.RadioValue}
            <div className='increment-decrement'>
              <i
                className='fas fa-minus hand'
                onClick={() => {
                  this.HandleUnitChange('dec', 'NumberPerUnit')
                }}
              />
              <span className='count'>{this.state.NumberPerUnit}</span>
              <i
                className='fas fa-plus hand'
                onClick={() => {
                  this.HandleUnitChange('inc', 'NumberPerUnit')
                }}
              />
            </div>
          </div>
          <div className='selector'>
            # of {`${this.state.RadioValue}s`}
            <div className='increment-decrement'>
              <i
                className='fas fa-minus hand'
                onClick={() => {
                  this.HandleUnitChange('dec', 'NumberOfUnits')
                }}
              />
              <span className='count'>{this.state.NumberOfUnits}</span>
              <i
                className='fas fa-plus hand'
                onClick={() => {
                  this.HandleUnitChange('inc', 'NumberOfUnits')
                }}
              />
            </div>
          </div>
          {IsAdmin() ? (
            <div className='selector select-clinician'>
              <AutoComplete
                CallBack={this.HandleAutoComplete}
                InitVal={(fn: any) => {
                  fn({
                    value: null,
                    label: null
                  })
                }}
                Placeholder={'Select a Clinician'}
                name={'clinician'}
                endpoint={'/PatientProfile/GetCliniciansAssignedToPatient'}
                NoBlurCB={true}
                IncludeNone={false}
                NoPreSelect={true}
                AssignedAutoCompelte={true}
                PatientId={this.props.PatientData.id}
              />
              {this.state.ClinicianId == -1 ? (
                <div className='text-danger'>Field Required</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <label>
          {this.state.VisitCodes.length == 0
            ? 'Add a visit frequency!'
            : 'You have selected a visit frequency of:'}
        </label>

        <div className='frequency-listing'>
          {this.state.VisitCodes.map((code: any, index: any) => {
            return (
              <div className='list-item'>
                <span className='frequency'>{code}</span>
                <i
                  className='fas fa-minus hand'
                  onClick={() => {
                    let temp: any = [...this.state.VisitCodes]
                    temp.splice(index, 1)
                    this.setState(
                      {
                        VisitCodes: temp
                      },
                      () => {
                        // dynamic
                        this.SaveSchedule()
                      }
                    )
                  }}
                ></i>
              </div>
            )
          })}
        </div>
        {/*  */}
        {this.state.ManageRecertFrequencies ? (
          <span className='go-back-bottom'>
            <button
              id='user-cancel'
              type='button'
              className='go-back'
              onClick={() => {
                this.setState(
                  {
                    ManageRecertFrequencies: false,
                    VisitFrequencies: [],
                    ClinicianId: 0
                  },
                  () => {
                    this.FetchRecertData()
                  }
                )
              }}
              disabled={this.state.APIStatus.InProgress}
            >
              GO BACK
            </button>
          </span>
        ) : null}
        <span className='float-right'>
          {/* dynamic */}
          <span
            className={`plus-bottom center-flex ${
              this.state.APIStatus.InProgress ? 'in-progress' : ''
            }`}
            onClick={this.AddCode}
          >
            <i className='fas fa-plus hand'></i>
          </span>
          {/* <span
            className='tick-bottom'
            onClick={() => {
              this.SaveSchedule(close)
            }}
          >
            <i className='fas fa-check hand'></i>
          </span> */}
        </span>
      </div>
    )
  }

  RenderRecertListing = (close: any = undefined) => {
    return (
      <div className='visit-frequency recert'>
        <span className='close-btn hand' onClick={close}>
          <i className='fas fa-times'></i>
        </span>
        <div className='header'>
          <label>Certification Period</label>
          <span className='green-text font-weight-bold'>
            {this.props.PatientData.fullName}
          </span>
          {/* {this.state.APIStatus.InProgress ? (
            <div className='api-inprogress'>
              <div className='text-danger'>Please wait...</div>
            </div>
          ) : null} */}
        </div>
        <div className='recert-body'>
          {this.state.Recerts.length != 0 ? (
            <table className='table'>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {this.state.Recerts.length == 0 ? (
                  <tr>
                    <td colSpan={9}>No Data</td>
                  </tr>
                ) : null}
                {this.state.Recerts.map((recert: any) => {
                  return (
                    <tr
                      onClick={() => {
                        this.setState(
                          {
                            RecertId: recert.id,
                            RecertDate: FormatDate(recert.recertificationDate)
                          },
                          () => {
                            this.FetchRecertData()
                          }
                        )
                      }}
                    >
                      <td>
                        {moment(recert.recertificationDate)
                          .utc()
                          .format('MMM DD, YYYY')}
                      </td>
                      <td>{recert.nurseName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <>
              <img src='../../images/recerts.png' />
              <div>No Certifications Found</div>
            </>
          )}
        </div>
        <span
          className='plus-bottom hand'
          onClick={() => {
            this.setState({
              RecertId: true,
              VisitFrequencies: []
            })
          }}
        >
          <i className='fas fa-plus hand'></i>
        </span>
      </div>
    )
  }

  FetchRecert = async () => {
    try {
      let result: any = await GetData(
        `/PatientRecertification/GetNextRecert?patientId=${this.props.PatientData.id}`
      )
      console.log('result', result)
      if (result.data) {
        this.setState({
          RecertDate: FormatDate(result.data.recertificationDate)
        })
      }
    } catch (err) {
      console.log('err', err)
    }
  }

  RenderRecertForm = (close: any = undefined) => {
    if (!this.state.RecertDate) {
      this.FetchRecert()
    }

    return (
      <div className='visit-frequency recert'>
        <span className='close-btn hand' onClick={close}>
          <i className='fas fa-times'></i>
        </span>
        <div className='header'>
          <label>Certification Period</label>
          <span className='green-text font-weight-bold'>
            {this.props.PatientData.fullName}
          </span>
          {/* {this.state.APIStatus.InProgress ||true? (
            <div className='api-inprogress'>
              <div className='text-danger'>Please wait...</div>
            </div>
          ) : null} */}
        </div>
        <div className='recert-form white-container'>
          <form onSubmit={this.SaveRecert}>
            <div className='form-group'>
              <label>Start of Care</label>
              <input
                className='form-control'
                value={this.state.RecertDate}
                type='date'
                onChange={(e: any) => {
                  let { value } = e.target
                  console.log('value', value)
                  this.setState({
                    RecertDate: value
                  })
                }}
                required
              />
              {console.log('recert', this.state.RecertDate)}
              {this.state.RecertDate ? (
                <small>
                  The care period will be from{' '}
                  {moment(this.state.RecertDate).format('MMM DD, YYYY')} to{' '}
                  {moment(this.state.RecertDate)
                    .add(59, 'days')
                    .format('MMM DD, YYYY')}
                </small>
              ) : null}
            </div>
            <h4>
              Frequency{' '}
              {this.state.RecertId && this.state.RecertId !== true ? (
                <span
                  className='hand text-btn'
                  onClick={() => {
                    this.setState(
                      {
                        ManageRecertFrequencies: true,
                        VisitCodes: []
                      },
                      () => {
                        if (!IsAdmin()) {
                          this.FetchData()
                        }
                      }
                    )
                  }}
                >
                  Manage
                </span>
              ) : null}
            </h4>

            {this.state.VisitFrequencies.length == 0 ? (
              <>
                <img src='../../images/recerts.png' />
                <div>
                  No Frequencies Found
                  <div>
                    <strong>Save</strong> a certification to add{' '}
                    <strong>frequencies</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className='frequency-listing'>
                {this.state.VisitFrequencies.map((data: any, i: any) => {
                  return (
                    <>
                      {IsAdmin() ? (
                        <div className='list-item'>
                          <span className='frequency is-clinician-name'>
                            {data.ClinicianName}
                          </span>
                        </div>
                      ) : null}
                      {data.Data.map((freq: any, index: any) => {
                        return (
                          <div className='list-item'>
                            <span className='frequency'>
                              {freq.generatedVisitCode}
                            </span>
                          </div>
                        )
                      })}
                    </>
                  )
                })}
              </div>
            )}
            <div className='row buttons'>
              <div className='col-md-9 text-left'>
                <button
                  id='user-submit'
                  type='submit'
                  className='save'
                  disabled={this.state.APIStatus.InProgress}
                >
                  {'SAVE'}
                </button>
                <button
                  id='user-cancel'
                  type='button'
                  className='cancel'
                  onClick={() => {
                    this.setState(
                      {
                        RecertId: 0,
                        RecertDate: '',
                        VisitFrequencies: [],
                        ClinicianId: 0,
                        Recerts: []
                      },
                      () => {
                        this.FetchRecerts()
                      }
                    )
                  }}
                  disabled={this.state.APIStatus.InProgress}
                >
                  GO BACK
                </button>

                {this.state.APIStatus.Failed ? (
                  <div className='form-check'>
                    <label className='text-danger'>
                      {this.state.APIStatus.FailMessage}
                    </label>
                  </div>
                ) : null}
              </div>
              <div className='col-md-3'>
                {this.state.RecertId && this.state.RecertId !== true ? (
                  <InplaceConfirm
                    Action={this.DeleteRecert}
                    HTMLComponent={
                      <i className='fas fa-trash' id='delete-action'></i>
                    }
                  />
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  render () {
    return (
      <Popup
        open={this.props.ShowPopup}
        closeOnDocumentClick={true && !this.state.APIStatus.InProgress}
        onClose={this.ClosePopup}
        contentStyle={{
          width: '35%'
          // marginRight: '26%',
          // marginTop: '10%'
        }}
      >
        {(close: any) => {
          return !this.state.ManageRecertFrequencies && this.props.RecertPopup
            ? this.state.RecertId
              ? this.RenderRecertForm(close)
              : this.RenderRecertListing(close)
            : this.RenderVisitFrequency(close)
        }}
      </Popup>
    )
  }
}
