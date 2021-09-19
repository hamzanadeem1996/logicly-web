import React from 'react'

import Select from 'react-select'
import { GetData } from '../../../Services/Api'

let initialValues = {
  list: [],
  value: '',
  query: '',
  skipReq: false,
  InitVal: '',
  CallBack: '',
  Placeholder: '',
  name: '',
  required: true
}
interface IState {
  [x: string]: any
}
const customStyles = {
  control: (base: any) => ({
    ...base,
    'font-size': '14px'
  })
}
class AutoComplete extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      ...initialValues
    }
  }

  componentDidMount () {
    this.FetchData('')
    this.props.InitVal((obj: any) => {
      let temp = null
      console.log('auto-complete component mounted', obj)
      // if (obj.value || obj.value == 0) {
      //   temp = { ...obj }
      // }
      temp = {
        value: obj.value || 0,
        label: obj.label || 'None'
      }

      // caseload || patient schedule //
      if (this.props.NoPreSelect) {
        temp = null
      }
      // - //

      this.setState({
        value: temp
      })
    })
  }

  IsLatest: any = undefined
  FetchData = async (query: any) => {
    let temp = Math.random()
    this.IsLatest = temp

    //
    let _query =
      this.props.endpoint +
      '?includeNone=' +
      (this.props.IncludeNone != false) +
      '&includeAdmin=true' +
      (this.props.roleName ? '&roleName=' + this.props.roleName : '') +
      '&query=' +
      query

    if (this.props.AssignedAutoCompelte) {
      _query =
        this.props.endpoint +
        '?patientId=' +
        this.props.PatientId +
        '&query=' +
        query
    }
    //

    let res: any = await GetData(_query)
    console.log(res, 'RES')
    if (temp != this.IsLatest) {
      return
    }
    if (res.data != null) {
      if (this.props.AssignedAutoCompelte) {
        res = res.data
      } else {
        res = res.data.items
      }
      res = res.map((ele: any) => {
        return {
          value: ele.id,
          label: ele.fullName
        }
      })
      this.setState({
        list: res
      })
      console.log(res, 'ok options')
    }
  }

  Reset = () => {
    if (this.props.CallBack != undefined) {
      this.props.CallBack(this.state.value, this.props.name)
    }
    console.log(this.state, 'call back')
  }

  //
  searchOnInput = (text: any) => {
    console.log('text enter fetch', text)
    if (text == null) {
      text = ''
    }
    if (text) {
      this.FetchData(text)
    }
  }

  handleChange = (e: any) => {
    console.log('change')
    this.setState({ ...this.state, value: e }, () => {
      this.Reset()
    })
    console.log(e, 'VAL')
  }

  render () {
    return (
      <div
        onBlur={() => {
          setTimeout(() => {
            if (!this.props.NoBlurCB) {
              this.Reset()
            }
          }, 400)
        }}
      >
        <div>
          <Select
            placeholder={this.props.Placeholder}
            name={this.props.name}
            onChange={this.handleChange}
            onInputChange={this.searchOnInput}
            onFocus={() => {
              console.log('focus fetch')
              this.FetchData('')
            }}
            autoComplete='off'
            value={this.state.value}
            required={this.props.required}
            styles={customStyles}
            className='basic-single'
            options={this.state.list}
            isSearchable
            isClearable={!this.props.AssignedAutoCompelte}
            isDisabled={this.props.Disabled}
          />
        </div>
      </div>
    )
  }
}

export default AutoComplete
