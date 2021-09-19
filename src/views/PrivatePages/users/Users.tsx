import React from 'react'
import 'datatables.net'
import * as API from '../../../Services/Api'
import { IApiCallStatus } from '../../../Services/Models/Interfaces'
import Pagination from 'react-js-pagination'
import { SORT } from '../../../Services/utility'
import UpgradePlanBanner from '../../../Controls/UpgradePlanBanner'

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
    Header: 'Email',
    accessor: 'email',
    sortType: 'alpha',
    sortState: ''
  },
  {
    Header: 'Role',
    accessor: 'roleName',
    sortType: 'alpha',
    sortState: ''
  }
])
interface IState {
  activePage: number
  APIPageNumber: number
  APIPageSize: number
  fetching: boolean
  CountPerPage: number
  SearchText: string
  FilteredArray: any[]
  columns: any[]
  APIStatus: IApiCallStatus
  ShowBanner: boolean
  BannerMessage: string
}

let OriginalOrder: any = []
class Users extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      activePage: 1,
      APIPageNumber: 1,
      APIPageSize: 100,
      fetching: false,
      SearchText: '',
      CountPerPage: 25,
      FilteredArray: [],
      ShowBanner: false,
      BannerMessage: '',
      columns: JSON.parse(columns),
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

      let result: any = await API.UserList(
        this.state.APIPageNumber,
        this.state.APIPageSize
      )
      // result = { data: result.data.items, message: result.message }
      console.log(result, 'result')

      // check valid plan

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
        ...this.state,
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
              activePage: 1,
              APIPageNumber: 1,
              SearchText: '',
              FilteredArray: [],
              columns: JSON.parse(columns)
            },
            () => {
              OriginalOrder = []
              this.FetchData()
            }
          )
          return
        }

        let result = await API.GetData('/User/GetAll?query=' + value)
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
        this.setState({
          ...this.state,
          FilteredArray: [],
          columns: JSON.parse(columns),
          APIStatus: {
            InProgress: false,
            Failed: true,
            FailMessage: err.message
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

  GetRoleBadge = (role: any) => {
    let text = role || 'N/A'
    text = text.toLowerCase()
    let color_class = 'gray_pill'
    if (role == 'ADMIN') {
      color_class = 'red_pill'
    } else if ('USER') {
      color_class = 'green_pill'
    }

    return <span className={`badges ${color_class}`}>{text}</span>
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
        <div className='row head-button-input-grp sticky-comp-caseload'>
          <div className='col-md-5'>
            <div className='add-btn'>
              <button
                id='add-btn-user'
                onClick={() => {
                  this.props.history.push('/users/add')
                }}
              >
                ADD
              </button>
            </div>
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
          <div className='col-md-1'>
            <div className='users-number'>
              <label>{this.state.FilteredArray.length}</label>
              <span>Users</span>
            </div>
          </div>
        </div>

        <table className='table data' id='custom_datatable'>
          <thead>
            <tr>
              {this.state.columns.map((column: any, idx: number) => {
                return (
                  <th
                    onClick={() => {
                      SORT(
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
              }).map((user, idx) => {
                return (
                  <tr
                    onClick={() => {
                      this.props.history.push('/users/' + user.id)
                    }}
                  >
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{this.GetRoleBadge(user.roleName)}</td>
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

export default Users
