import React, { Component } from 'react'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'

export function LoaderComponent () {
  return (
    <div className='loader align-middle'>
      <div className='loader-inner text-center'>
        <div className='loader'>
          <Loader
            visible={true}
            type='Oval'
            color='#009944'
            height={100}
            width={100}
          />
        </div>
      </div>
    </div>
  )
}
