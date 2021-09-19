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
import InplaceConfirm from '../../../Controls/InplaceConfirm'
import UpgradePlanBanner from '../../../Controls/UpgradePlanBanner'

import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'

let columns: any = JSON.stringify([
  {
    Header: 'First Name',
    accessor: 'firstName',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: 'Last Name',
    accessor: 'lastName',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: 'City',
    accessor: 'cityName',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: 'Frequency',
    accessor: 'frequency',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: '30 Day Re-evaluation',
    accessor: 'thirtyDaysRelEval',
    sortType: 'date',
    sortState: ''
  },
  {
    Header: 'Discharge Week',
    accessor: 'dischargeWeek',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: 'End of Care',
    accessor: 'eoc',
    sortType: 'date',
    sortState: ''
  }
])
interface IState {
  DeleteArray: any[]
  SelectAll: boolean
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  CountPerPage: number
  fetching: boolean
  SearchText: string
  FilteredArray: any[]
  columns: any[]
  APIStatus: any
  ShowPopup: boolean
  CSV: any
  status: string
  Duplicates: any[]
  ShowBanner: boolean
  BannerMessage: string
  Frequency: any[]
  HaveFreq: boolean
  DischargeWeek: any[]
  HaveDischargeWeek: boolean
}

let initialValues = {
  status: 'active',
  DeleteArray: [],
  SelectAll: false,
  activePage: 1,
  APIPageNumber: 1,
  APIPageSize: 100,
  CountPerPage: 25,
  fetching: false,
  SearchText: '',
  FilteredArray: [],
  columns: JSON.parse(columns),
  ShowBanner: false,
  BannerMessage: '',
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: '',
    Failed1: false,
    FailMessage1: ''
  },
  Duplicates: [],
  ShowPopup: false,
  CSV: {
    file: undefined,
    name: 'Select a file to upload'
  },
  Frequency: [],
  HaveFreq: true,
  DischargeWeek: [],
  HaveDischargeWeek: true
}

let OriginalOrder: any = []
class Patients extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount = () => {
    this.setState({ DeleteArray: [] })
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

      let result: any = await API.GetData(
        `/PatientProfile/GetAll?pagenumber=${
          this.state.APIPageNumber
        }&pagesize=${this.state.APIPageSize}&${
          this.state.SearchText ? `query=${this.state.SearchText}` : ''
        }&Status=${this.state.status}`
      )
      // result = { data: result.data.items, message: result.message }
      console.log(result, 'result')

      if (result.data != null) {
        let upPageNumber: any
        if (result.data.items.length < this.state.APIPageSize) {
          // Means end of records reached
          upPageNumber = null
        } else {
          upPageNumber = this.state.APIPageNumber + 1
        }
        this.setState(
          {
            ...this.state,
            FilteredArray: this.state.FilteredArray.concat(result.data.items),
            columns: JSON.parse(columns),
            APIPageNumber: upPageNumber,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          },
          () => {
            OriginalOrder = [...this.state.FilteredArray]
          }
        )
      } else {
        throw result
      }
    } catch (err) {
      utility.ShowAlert(err.message, 'error')
      this.setState({
        ...this.state,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
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
              columns: JSON.parse(columns),
              activePage: 1,
              APIPageNumber: 1,
              SearchText: ''
            },
            () => {
              OriginalOrder = []
              this.FetchData()
            }
          )
          return
        }

        let result = await API.GetData(
          `/PatientProfile/GetAll?query=${value}&Status=${this.state.status}`
        )
        console.log('result', result)

        if (result.data != null) {
          this.setState({
            ...this.state,
            FilteredArray: result.data.items,
            columns: JSON.parse(columns),
            SearchText: value,
            APIStatus: {
              ...this.state.APIStatus,
              InProgress: false
            }
          })
          OriginalOrder = [...result.data.items]
        } else {
          throw result
        }
      } catch (err) {
        console.log(err)
        utility.ShowAlert(err.message, 'error')
        this.setState({
          ...this.state,
          FilteredArray: [],
          columns: JSON.parse(columns),
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
        OriginalOrder = []
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
      if (
        this.state.FilteredArray.length -
          pageNumber * this.state.CountPerPage <=
        this.state.CountPerPage
      ) {
        this.FetchData()
      }
    }
  }

  ClosePopup = () => {
    this.setState({
      ShowPopup: false,
      Duplicates: [],
      CSV: {
        file: undefined,
        name: 'Select a file to upload'
      },
      APIStatus: {
        ...this.state.APIStatus,
        InProgress: false,
        FailMessage: '',
        Failed: false
      }
    })
  }

  HandleCSV = (e: any) => {
    let file = e.target.files[0]
    console.log('file', file)
    if (file == undefined) {
      return
    }
    file = {
      file: file,
      name: file.name
    }
    this.setState({
      CSV: file,
      APIStatus: {
        ...this.state.APIStatus,
        FailMessage: '',
        Failed: false
      }
    })
  }

  UploadCSV = async () => {
    if (this.state.CSV.file == undefined) {
      utility.ShowAlert('Please select a CSV', 'error')
      return
    }
    console.log('save csv')

    try {
      this.setState({
        ...this.state,
        Duplicates: [],
        APIStatus: {
          ...this.state.APIStatus,
          FailMessage: '',
          Failed: false,
          InProgress: true
        }
      })

      let formdata = new FormData()
      formdata.append('file', this.state.CSV.file)

      let result = await API.PostData(
        '/PatientProfile/ImportPatientCsv',
        formdata
      )
      console.log('result', result)
      if (result.status == 401) {
        this.setState({
          ShowBanner: true,
          BannerMessage: result.message,
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
        return
      }
      if (result.data != null) {
        // That is duplicates found
        this.setState({
          Duplicates: result.data
        })
        throw result
      } else {
        throw result
      }
    } catch (err) {
      utility.ShowAlert(err.message, 'error')
      this.setState({
        ...this.state,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    }
  }

  HandleSelect = (checked: any, index: any) => {
    this.state.FilteredArray[index].IsSelected = checked
    let selectall: boolean = false
    let temp = { ...this.state.FilteredArray[index] }

    if (checked) {
      // add
      this.state.DeleteArray.push(temp.id)
      if (this.state.FilteredArray.length == this.state.DeleteArray.length) {
        selectall = true
      }
    } else {
      // remove
      let check = this.state.DeleteArray.findIndex((ele: any) => {
        return ele == temp.id
      })
      console.log(checked, check)
      if (check != -1) {
        this.state.DeleteArray.splice(check, 1)
      }

      selectall = false
    }

    this.setState({
      ...this.state,
      SelectAll: selectall,
      APIStatus: {
        ...this.state.APIStatus,
        Failed1: false,
        FailMessage1: ''
      }
    })
  }

  HandleSelectAll = (checked: any) => {
    let delArr: any = []
    let temp = [...this.state.FilteredArray]
    temp.forEach((patient: any) => {
      patient.IsSelected = checked
      delArr.push(patient.id)
    })
    if (!checked) {
      delArr = []
    }

    this.setState({
      ...this.state,
      SelectAll: checked,
      FilteredArray: temp,
      DeleteArray: delArr,
      APIStatus: {
        ...this.state.APIStatus,
        Failed1: false,
        FailMessage1: ''
      }
    })
    OriginalOrder = temp
  }

  HandleDelete = async () => {
    console.log(this.state.DeleteArray, 'del action')
    try {
      if (this.state.APIStatus.InProgress) {
        return
      }
      this.setState({
        ...this.state,
        fetching: true,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      // Delete Multiple

      let resultDelete: any = await API.DeleteData(
        '/PatientProfile/DeleteMultiplePatients',
        this.state.DeleteArray
      )
      console.log(resultDelete, 'result')
      //

      if (resultDelete.message == 'Successful') {
        utility.ShowAlert(resultDelete.message)
        this.setState(
          {
            ...initialValues,
            DeleteArray: [],
            CountPerPage: this.state.CountPerPage
          },
          () => {
            this.FetchData()
          }
        )
      } else {
        throw resultDelete
      }
    } catch (err) {
      console.log(err, 'err')
      utility.ShowAlert(err.message, 'error')
      this.setState({
        ...this.state,
        fetching: false,
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: false
        }
      })
    }
  }

  IsLatest: any = ''
  FetchFrequency = async (patient: any) => {
    console.log('fetch....')
    try {
      //
      let temp: any = Math.random()
      this.IsLatest = temp

      this.setState({ Frequency: [], HaveFreq: false })
      let result: any = await API.GetData(
        `/PatientSchedule/Get?patientId=${patient.id}&recertId=${patient.activeCertId}`
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

        //
        if (temp === this.IsLatest) {
          this.setState({
            Frequency: result,
            HaveFreq: true
          })
        }
      }
    } catch (err) {
      console.log(err.message, 'err')
    }
  }

  FetchDischargeWeek = async (patient: any) => {
    console.log('fetch week....')
    try {
      //
      let temp: any = Math.random()
      this.IsLatest = temp

      this.setState({ DischargeWeek: [], HaveDischargeWeek: false })
      let result: any = await API.GetData(
        `/PatientProfile/GetMultipleVisit?patientId=${patient.id}&recertId=${
          patient.activeCertId
        }&type=${'Discharge'}`
      )
      console.log('result', result)

      if (result.data) {
        result = result.data

        //
        if (temp === this.IsLatest) {
          this.setState({
            DischargeWeek: result,
            HaveDischargeWeek: true
          })
        }
      }
    } catch (err) {
      console.log(err.message, 'err')
    }
  }

  TippyContent = () => {
    return (
      <div className='freq-view'>
        <h2>FREQUENCIES</h2>
        <div
          className={`freq-wrapper ${
            this.state.Frequency.length == 0 ? 'cust-loader' : ''
          }`}
        >
          {!this.state.HaveFreq
            ? 'Loading...'
            : this.state.Frequency.map((data: any) => {
                return (
                  <div className='item'>
                    <label>{data.ClinicianName}</label>
                    {data.Data.map((val: any) => {
                      return <span>{val.generatedVisitCode}</span>
                    })}
                  </div>
                )
              })}
          {this.state.Frequency.length === 0 && this.state.HaveFreq
            ? 'N/A'
            : null}
        </div>
      </div>
    )
  }

  TippyContentDischargeWeek = () => {
    return (
      <div className='freq-view'>
        <h2>DISCHARGE WEEK</h2>
        <div
          className={`freq-wrapper ${
            this.state.DischargeWeek.length == 0 ? 'cust-loader' : ''
          }`}
        >
          {!this.state.HaveDischargeWeek
            ? 'Loading...'
            : this.state.DischargeWeek.map((data: any) => {
                return (
                  <div className='item'>
                    <label>{data.nurseName}</label>
                    <span>{data.dischargeWeek || 'N/A'}</span>
                  </div>
                )
              })}
          {this.state.DischargeWeek.length === 0 && this.state.HaveDischargeWeek
            ? 'N/A'
            : null}
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className='white-container'>
        <UpgradePlanBanner
          ShowBanner={this.state.ShowBanner}
          BannerMessage={this.state.BannerMessage}
          OnDismiss={() => {
            this.setState({
              ShowBanner: false,
              BannerMessage: ''
            })
          }}
          IsFixed={false}
        />
        <Popup
          closeOnDocumentClick={false}
          open={this.state.ShowPopup}
          onClose={this.ClosePopup}
        >
          {(close: any) => (
            <div className='white-container'>
              <div className='row'>
                <div className='col-md-12'>
                  <h4>
                    Upload Patients CSV
                    <i className='fas fa-times hand' onClick={close}></i>
                  </h4>
                </div>
              </div>
              <div className='row'>
                <div className='col-md-9'>
                  <label className='hand'>
                    <div className='upload-field'>{this.state.CSV.name}</div>
                    <input
                      type='file'
                      style={{ display: 'none' }}
                      accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
                      onChange={this.HandleCSV}
                      disabled={this.state.APIStatus.InProgress}
                    />
                  </label>
                </div>
                <div className='col-md-3 upload-btn'>
                  <label>
                    <span className='hand' onClick={this.UploadCSV}>
                      Upload
                    </span>
                  </label>
                </div>
                <div className='col-md-12'>
                  <a
                    href={utility.SAMPLEPATIENTCSV}
                    target='_blank'
                    download={
                      '9a7deb54-d042-48f5-8a02-611f4c1c6417samplePatientUpload.xlsx'
                    }
                    className='sample-csv'
                  >
                    Sample CSV
                  </a>
                </div>
                <div className='col mt-2 font-lg'>
                  {this.state.APIStatus.InProgress ? (
                    <div className='text-danger'>{'Please Wait...'}</div>
                  ) : null}
                  {this.state.APIStatus.Failed ? (
                    <div className='text-danger'>
                      {this.state.APIStatus.FailMessage}
                    </div>
                  ) : null}
                </div>
              </div>
              {/* Display Duplicate Records */}
              {this.state.Duplicates.length != 0 ? (
                <div className='row duplicates-view'>
                  <div className='col-md-12'>
                    <h4>Duplicates in Uploaded CSV</h4>
                    <table className='table data' id='custom_datatable'>
                      <thead>
                        <tr>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>30 Day Re-evaluation</th>
                          <th>End of Care</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.Duplicates.map((patient, idx) => {
                          return (
                            <tr>
                              <td>{patient.firstName}</td>
                              <td>{patient.lastName}</td>
                              <td>{patient.upcoming30DRE || 'N/A'}</td>
                              <td>{patient.eoc || 'N/A'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Popup>
        <div className='row head-button-input-grp sticky-comp-caseload'>
          <div className='col-md-6'>
            <div className='add-btn'>
              {/* <h1>Patients</h1> */}
              <button
                id='add-btn-user'
                onClick={() => {
                  console.log('allowed', utility.ManagePatientAllowed())
                  this.props.history.push('/patients/add')
                }}
                disabled={!utility.ManagePatientAllowed()}
              >
                ADD
              </button>
            </div>

            <a className='export hand'>
              <i
                data-toggle='tooltip'
                title='Import Patient CSV'
                className='fas fa-file-import'
                onClick={() => {
                  this.setState({
                    ShowPopup: true
                  })
                }}
              ></i>{' '}
              <i
                className='fas fa-redo-alt hand'
                onClick={() => {
                  if (this.state.fetching) {
                    return
                  }
                  this.setState(
                    {
                      ...initialValues,
                      CountPerPage: this.state.CountPerPage,
                      DeleteArray: []
                    },
                    () => {
                      this.FetchData()
                    }
                  )
                }}
                title={'Refresh'}
              ></i>
            </a>
          </div>
          <div className='col-md-2 form-group page-size'>
            <div>Page Size:</div>
            <select
              className='form-control'
              value={this.state.CountPerPage}
              onChange={(e: any) => {
                this.setState({
                  CountPerPage: e.target.value
                })
              }}
              disabled={this.state.fetching}
            >
              <option value='25'>25</option>
              <option value='50'>50</option>
              <option value='100'>100</option>
              <option value='500'>500</option>
            </select>
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

        <div className='row'>
          <div className='col-md-7 error-message'>
            {this.state.APIStatus.InProgress &&
            this.state.DeleteArray.length != 0 ? (
              <div className='text-danger'>{'Please Wait...'}</div>
            ) : null}
            {this.state.APIStatus.Failed1 ? (
              <div className='text-danger'>
                {this.state.APIStatus.FailMessage1}
              </div>
            ) : null}
          </div>
          <div className='col-md-2 delete-selected'>
            {this.state.DeleteArray.length != 0 ? (
              <InplaceConfirm
                Action={this.HandleDelete}
                HTMLComponent={
                  <span className='text-danger delete-btn'>
                    Delete Selected
                  </span>
                }
              />
            ) : null}
          </div>
          <div className='col-md-3 form-group page-size'>
            <div>Patient Status:</div>
            <select
              value={this.state.status}
              onChange={(e: any) => {
                if (this.state.fetching) {
                  return
                }
                this.setState(
                  {
                    ...initialValues,
                    CountPerPage: this.state.CountPerPage,
                    SearchText: this.state.SearchText,
                    status: e.target.value,
                    DeleteArray: []
                  },
                  () => {
                    this.FetchData()
                  }
                )
              }}
              disabled={this.state.fetching}
              className='form-control'
            >
              <option value='active'>Active</option>
              <option value='discharged'>Discharged</option>
            </select>
          </div>
        </div>

        <table className='table data' id='custom_datatable'>
          <thead>
            <tr>
              {this.state.columns.map((column: any, idx: number) => {
                return (
                  <th
                    onClick={() => {
                      utility.SORT(
                        column,
                        idx,
                        OriginalOrder,
                        (SORTED: any, newSortState: any, idx: number) => {
                          let temp: any = JSON.parse(columns)
                          temp[idx].sortState = newSortState

                          this.setState({
                            ...this.state,
                            FilteredArray: SORTED,
                            columns: temp
                          })
                        }
                      )
                    }}
                  >
                    <span className='contain-head-ico'>
                      {column.Header}
                      {column.sortState ? (
                        column.sortState == 'asc' ? (
                          <i className='fas fa-arrow-up' />
                        ) : (
                          <i className='fas fa-arrow-down' />
                        )
                      ) : (
                        <i className='fas fa-arrow-up transparent-text' />
                      )}
                    </span>
                  </th>
                )
              })}
              <th>
                <input
                  type='checkbox'
                  title={'Select/Deselect All'}
                  checked={this.state.SelectAll}
                  onChange={evt => {
                    let { checked } = evt.target
                    this.HandleSelectAll(checked)
                  }}
                  disabled={this.state.APIStatus.InProgress}
                />
              </th>
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
                low =
                  this.state.activePage * this.state.CountPerPage -
                  this.state.CountPerPage
                high = this.state.activePage * this.state.CountPerPage
                if (idx >= low && idx < high) return true
                else return false
              }).map((patient, idx) => {
                return (
                  <tr
                    onClick={() => {
                      this.props.history.push(`/patients/${patient.id}`)
                    }}
                  >
                    <td>{patient.firstName}</td>
                    <td>{patient.lastName}</td>
                    <td>{patient.cityName || 'N/A'}</td>
                    <td>
                      {utility.IsAdmin() ? (
                        <Tippy
                          content={this.TippyContent()}
                          animation={'scale-subtle'}
                          interactive={true}
                          placement={'right'}
                          onMount={() => {
                            console.log('mount fetch...')
                            this.FetchFrequency(patient)
                          }}
                        >
                          <span>View</span>
                        </Tippy>
                      ) : (
                        patient.frequency || 'N/A'
                      )}
                    </td>
                    {/* <td>{patient.frequency || 'N/A'}</td> */}
                    <td>{utility.getDate(patient.thirtyDaysRelEval)}</td>
                    <td>
                      {utility.IsAdmin() ? (
                        <Tippy
                          content={this.TippyContentDischargeWeek()}
                          animation={'scale-subtle'}
                          interactive={true}
                          placement={'right'}
                          onMount={() => {
                            console.log('mount fetch week...')
                            this.FetchDischargeWeek(patient)
                          }}
                        >
                          <span>View</span>
                        </Tippy>
                      ) : (
                        patient.dischargeWeek || 'N/A'
                      )}
                    </td>
                    {/* <td>{patient.dischargeWeek}</td> */}
                    <td>{utility.getDate(patient.eoc)}</td>
                    <td
                      onClick={e => {
                        e.stopPropagation()
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={patient.IsSelected}
                        onChange={event => {
                          this.HandleSelect(event.target.checked, idx)
                        }}
                        disabled={this.state.APIStatus.InProgress}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {this.state.FilteredArray.length != 0 ? (
          <div className='row table-footer'>
            <Pagination
              hideFirstLastPages
              prevPageText='Prev'
              nextPageText='Next'
              activePage={this.state.activePage}
              itemsCountPerPage={this.state.CountPerPage}
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

export default Patients
