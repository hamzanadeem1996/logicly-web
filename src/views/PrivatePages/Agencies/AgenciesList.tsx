import React from 'react'
import * as API from '../../../Services/Api'
import Pagination from 'react-js-pagination'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import moment from 'moment'
interface IState {
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  SearchText: string
  AllRecords: any[]
  APIStatus: IApiCallStatus
}

let initialValues = {
  activePage: 1,
  APIPageNumber: 1,
  APIPageSize: 100,
  SearchText: '',
  AllRecords: [],
  APIStatus: {
    InProgress: false,
    Failed: false,
    FailMessage: ''
  }
}
export default class AgenciesList extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount = () => {
    this.FetchData()
  }

  FetchData = async () => {
    try {
      this.setState({
        APIStatus: {
          ...this.state.APIStatus,
          InProgress: true
        }
      })

      let result: any = await API.GetData(`/Agency/GetAll`)
      console.log(result, 'result')

      if (result.data != null) {
        let upPageNumber: any
        if (result.data.items.length < this.state.APIPageSize) {
          // Means end of records reached
          upPageNumber = null
        } else {
          upPageNumber = this.state.APIPageNumber + 1
        }
        this.setState({
          ...this.state,
          AllRecords: this.state.AllRecords.concat(result.data.items),
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
      this.setState({
        ...this.state,
        APIStatus: {
          ...this.state.APIStatus,
          FailMessage: err.message,
          Failed: true
        }
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
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: true
          }
        })
        //

        if (value.trim() == '') {
          this.setState(
            {
              AllRecords: [],
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

        let result = await API.GetData(`/Agency/GetAll?query=${value}`)
        console.log('result', result)

        if (result.data != null) {
          this.setState({
            ...this.state,
            AllRecords: result.data.items,
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
          AllRecords: [],
          APIStatus: {
            ...this.state.APIStatus,
            InProgress: false
          }
        })
      } finally {
        this.setState({
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

    if (this.state.APIPageNumber != null && !this.state.APIStatus.InProgress) {
      if (this.state.AllRecords.length - pageNumber * 10 <= 10) {
        this.FetchData()
      }
    }
  }

  GetBadge = (IsActive: boolean) => {
    let color_class = 'gray_pill'
    let text = 'InActive'

    if (IsActive) {
      color_class = 'green_pill'
      text = 'Active'
    }

    return <span className={`badges ${color_class}`}>{text}</span>
  }

  render () {
    return (
      <div className='white-container'>
        <div className='row head-button-input-grp sticky-comp-caseload' style={{padding: 0}}>
          <div className='col-md-12'>
            <h1>Agencies</h1>
          </div>
          <div className='col-md-8'>
            <div className='add-btn'>
              <button
                id='add-btn-user'
                onClick={() => {
                  this.props.history.push('/agencies/add')
                }}
              >
                ADD
              </button>
            </div>
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
              <th>Name</th>
              <th>Plan</th>
              <th>Last Payment</th>
              <th>Year</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {this.state.APIStatus.InProgress ? (
              <tr>
                <td colSpan={9}>Fetching Records...</td>
              </tr>
            ) : null}
            {this.state.AllRecords.length == 0 &&
            !this.state.APIStatus.InProgress ? (
              <tr>
                <td colSpan={9}>No matching records found</td>
              </tr>
            ) : (
              this.state.AllRecords.filter((val, idx) => {
                let low, high
                low = this.state.activePage * 10 - 10
                high = this.state.activePage * 10
                if (idx >= low && idx < high) return true
                else return false
              }).map((agency: any, idx) => {
                return (
                  <tr
                    onClick={() => {
                      this.props.history.push(`/agencies/${agency.id}`)
                    }}
                  >
                    <td>{agency.name}</td>
                    <td>{agency.planName || 'N/A'}</td>
                    <td>{agency.lastPayment || 'N/A'}</td>
                    <td>{moment(agency.addedOn).format('YYYY')}</td>
                    <td>{this.GetBadge(agency.isActive)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {this.state.AllRecords.length != 0 ? (
          <div className='row table-footer'>
            <Pagination
              hideFirstLastPages
              prevPageText='Prev'
              nextPageText='Next'
              activePage={this.state.activePage}
              itemsCountPerPage={10}
              totalItemsCount={this.state.AllRecords.length}
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
