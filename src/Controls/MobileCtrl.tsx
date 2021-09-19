import React, { Component } from 'react'
import { Controller } from 'react-hook-form'
import { InputProps } from '../Services/Models/Interfaces'
import InputMask from 'react-input-mask'

export default class MobileCtrl extends Component<InputProps> {
  render () {
    let name = this.props.name
    let rules: any = {}

    if (this.props.type == 'tel') {
      rules = {
        required: this.props.required,
        pattern: {
          value: /[A-Za-z0-9]{1,20}/,
          message: "Field can't be empty!"
        }
      }
    }

    return (
      <div>
        <Controller
          render={({ onChange, onBlur, value }) => (
            <InputMask
              className='form-control'
              name={this.props.name}
              mask='(999)999-9999'
              type={this.props.type}
              alwaysShowMask={true}
              value={value}
              onChange={onChange}
              disabled={this.props.disabled}
            />
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
