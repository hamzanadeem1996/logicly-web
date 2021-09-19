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
import AutoComplete from '../patients/AutoComplete'
interface IState {
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  fetching: boolean
  SearchText: string
  FilteredArray: any[]
  ClinicianId: any
  EvaluationDate: any
  Clinicians: any[]
  APIStatus: IApiCallStatus
}

let initialValues = {
  filter: 'none',
  activePage: 1,
  APIPageNumber: 1,
  APIPageSize: 100,
  fetching: false,
  SearchText: '',
  FilteredArray: [],
  ClinicianId: '',
  EvaluationDate: utility.FormatDate(new Date()),
  Clinicians: [],
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}
class PatientScheduling extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount = () => {
    if (utility.IsAdmin()) {
      this.FetchClinicians()
    } else {
      this.FetchData()
    }
  }

  FetchClinicians = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })
      let result: any = await API.GetData(
        '/User/GetAll?pagenumber=1&pagesize=100'
      )
      console.log('clinicians', result)
      if (result.data) {
        this.setState({
          Clinicians: result.data.items
        })
      }
    } catch (err) {
      console.log(err, 'err')
    } finally {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    }
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

      let result: any = await API.GetData(
        `/PatientProfile/GetSchedule?startdate=${
          this.state.EvaluationDate
        }&pagenumber=${this.state.APIPageNumber}&pagesize=${
          this.state.APIPageSize
        }${this.state.SearchText ? `&query=${this.state.SearchText}&` : ''}${
          this.state.ClinicianId
            ? `&clinicianId=${this.state.ClinicianId}&`
            : ''
        }`
      )
      console.log(result, 'result')

      if (result.data != null) {
        let upPageNumber: any
        if (result.data.length < this.state.APIPageSize) {
          // Means end of records reached
          upPageNumber = null
        } else {
          upPageNumber = this.state.APIPageNumber + 1
        }
        this.setState({
          ...this.state,
          FilteredArray: this.state.FilteredArray.concat(result.data),
          APIPageNumber: upPageNumber,
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

  SyncVar: any

  Search = async (e: any) => {
    if (this.SyncVar) {
      clearInterval(this.SyncVar)
    }
    let value = e.target.value
    this.SyncVar = setTimeout(async () => {
      try {
        this.setState({
          ...this.state,
          fetching: true,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: true
          }
        })
        //

        if (value.trim() == '') {
          this.setState(
            {
              FilteredArray: [],
              activePage: 1,
              APIPageNumber: 1,
              SearchText: ''
            },
            () => {
              this.FetchData()
            }
          )
          return
        }

        let result = await API.GetData(
          `/PatientProfile/GetSchedule?startdate=${
            this.state.EvaluationDate
          }&query=${value}${
            this.state.ClinicianId
              ? `&clinicianId=${this.state.ClinicianId}&`
              : ''
          }`
        )
        console.log('result', result)

        if (result.data != null) {
          this.setState({
            ...this.state,
            FilteredArray: result.data,
            SearchText: value,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          })
        } else {
          throw result
        }
      } catch (err) {
        console.log(err)
        this.setState({
          ...this.state,
          FilteredArray: [],
          APIStatus: {
            InProgress: false,
            Failed: true,
            FailMessage: err.message
          }
        })
      } finally {
        this.setState({
          fetching: false,
          activePage: 1,
          APIPageNumber: 1
        })
      }
    }, 400)
  }

  HandlePageChange = async (pageNumber: any) => {
    console.log('', `active page is ${pageNumber}`)
    this.setState({ activePage: pageNumber })

    if (this.state.SearchText != '') {
      return
    }

    if (this.state.APIPageNumber != null && !this.state.fetching) {
      if (this.state.FilteredArray.length - pageNumber * 10 <= 10) {
        this.FetchData()
      }
    }
  }

  HandleAutoComplete = (selection: any, name: any) => {
    console.log('check', selection)
    this.setState(
      {
        FilteredArray: [],
        APIPageNumber: 1,
        ClinicianId: selection ? selection.value : ''
      },
      () => {
        this.FetchData()
      }
    )
  }

  render () {
    return (
      <div className='white-container patient-schedules'>
        <div className='row head-button-input-grp sticky-comp-caseload'>
          <div className='col-md-5 form-group'></div>
          <div className='col-md-3'>
            {utility.IsAdmin() ? (
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
                endpoint={'/User/GetAll'}
                NoBlurCB={true}
                IncludeNone={false}
                NoPreSelect={true}
              />
            ) : null}
          </div>
          <div className='col-md-4'>
            <label>
              <input
                type='text'
                placeholder='Search...'
                onChange={this.Search}
              />
              <i className='fas fa-search'></i>
            </label>
          </div>
        </div>

        <table className='table data' id='custom_datatable'>
          <thead>
            <tr>
              {/* <th>ID</th> */}
              <th>Patient Name</th>
            </tr>
          </thead>
          <tbody>
            {this.state.fetching ? (
              <tr>
                <td colSpan={9}>Fetching Records...</td>
              </tr>
            ) : null}
            {this.state.FilteredArray.length == 0 && !this.state.fetching ? (
              <tr>
                <td colSpan={9}>No matching records found</td>
              </tr>
            ) : (
              this.state.FilteredArray.filter((val, idx) => {
                let low, high
                low = this.state.activePage * 10 - 10
                high = this.state.activePage * 10
                if (idx >= low && idx < high) return true
                else return false
              }).map((patient, idx) => {
                return (
                  <tr
                    onClick={() => {
                      this.props.history.push(
                        `/patient-scheduling/schedule?patientId=${
                          patient.patientId
                        }${
                          this.state.ClinicianId
                            ? '&clinicianId=' + this.state.ClinicianId
                            : ''
                        }`
                      )
                    }}
                  >
                    <td>{patient.title}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {this.state.FilteredArray.length != 0 ? (
          <div className='row float-right'>
            <Pagination
              hideFirstLastPages
              prevPageText='Prev'
              nextPageText='Next'
              activePage={this.state.activePage}
              itemsCountPerPage={10}
              totalItemsCount={this.state.FilteredArray.length}
              pageRangeDisplayed={5}
              onChange={this.HandlePageChange}
              innerClass='custom_pagination'
            />
          </div>
        ) : null}
      </div>
    )
  }
}

export default PatientScheduling
