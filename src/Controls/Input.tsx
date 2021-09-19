import React, { Component } from 'react'
import { Controller } from 'react-hook-form'
import { InputProps } from '../Services/Models/Interfaces'

export default class InputCtrl extends Component<InputProps> {
  render () {
    let id = ''

    if (this.props.ID != undefined) {
      id = this.props.ID
    }

    let name = this.props.name
    let rules: any = {
      required: this.props.required,
      pattern: {
        value: /[A-Za-z0-9]{1,20}/,
        message: "Field can't be empty!"
      },
      maxLength: { value: 30, message: 'Can use max be 30 chars' },
      minLength: { value: 3, message: 'Must be 3 chars long' }
    }

    if (this.props.componentName != undefined) {
      if (this.props.componentName == 'login') {
        rules.minLength.value = 4
        rules.minLength.message = 'Must be 4 chars long'
      }
    }

    if (this.props.type == 'email') {
      // MinLength
      // rules.minLength.value = 4
      // rules.minLength.message = 'Must be 4 chars long'
      //
      // Pattern Check
      rules.pattern.value = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
      rules.pattern.message = 'Invalid email address'
      //
    }

    if (this.props.type == 'tel') {
      // MinLength
      rules.minLength.value = 10
      rules.minLength.message = 'Must be 10 digits long!'
      //
      // MaxLength
      rules.maxLength.value = 14
      rules.maxLength.message = 'Can use max 14 digits!'
      //
      // Pattern Check
      // delete rules.minLength
      // delete rules.maxLength
      // rules.pattern.value = /^\+((?:9[679]|8[035789]|6[789]|5[90]|42|3[578]|2[1-689])|9[0-58]|8[1246]|6[0-6]|5[1-8]|4[013-9]|3[0-469]|2[70]|7|1)(?:\W*\d){0,13}\d$/
      rules.pattern.value = /[0-9]{10,14}/
      rules.pattern.message = 'Invalid mobile number'
      //
    }

    if (
      this.props.type == 'date' ||
      this.props.type == 'number' ||
      this.props.type == 'text' ||
      this.props.type == 'password' ||
      this.props.type == 'email'
    ) {
      delete rules.minLength
      delete rules.maxLength
    }

    return (
      <div className='input-controller'>
        <Controller
          render={({ onChange, onBlur, value }) => (
            <input
              id={id}
              onBlur={onBlur}
              name={this.props.name}
              onChange={onChange}
              value={value}
              type={this.props.type}
              placeholder={this.props.placeholder}
              className={this.props.className}
              // maxLength={10}
              onKeyPress={(evt:any) => {
                if(this.props.type=='tel'){
                  let keycode = evt.which || evt.keyCode;
                  console.log(evt.which, evt.keyCode, "test");
                  if (keycode == 43) {
                    return;
                  }
                  if (keycode < 48 || keycode > 57) {
                    evt.preventDefault();
                  }
                }
              }}
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
