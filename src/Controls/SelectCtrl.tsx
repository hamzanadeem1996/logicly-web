import React, { Component } from 'react'
import { Controller } from 'react-hook-form'

export interface ISelectProps {
  control: any
  showError: any
  className?: string
  placeholder: string
  name: string
  required: boolean
  componentName?: string
  options: any[]
  disabled: boolean
  TextKey?: string
  ID?: string
}

export interface ISelectOption {
  id: any
  name: string
}

export default class SelectCtrl1 extends Component<ISelectProps> {
  render () {
    let id = ''
    if (this.props.ID != undefined) {
      id = this.props.ID
    }
    let name = this.props.name
    let rules: any = {
      required: this.props.required,
      pattern: {
        value: /[^0]+/,
        message: 'Please select an option!'
      }
    }

    if (this.props.componentName != undefined) {
      if (this.props.componentName == 'login') {
        rules.minLength.value = 4
        rules.minLength.message = 'Must be 4 chars long'
      }
    }
    let _displayTextKey =
      this.props.TextKey != undefined ? this.props.TextKey : 'firstName'

    return (
      <div className='controller-outer'>
        {/* {console.log(this.props.options)} */}
        <Controller
          render={({ onChange, onBlur, value }) => (
            <>
              {/* {console.log(value, this.props.options)} */}
              <select
                id={id}
                onChange={onChange}
                value={value}
                className="form-control"
                disabled={this.props.disabled}
              >
                <option hidden value=''>
                  {this.props.placeholder}
                </option>
                {this.props.options.map((option, idx) => {
                  return <option value={option.id}>{option.name}</option>
                })}
              </select>
            </>
          )}
          name={this.props.name}
          control={this.props.control}
          rules={rules}
        />
        {this.props.showError(name)}
      </div>
    )
  }
}
