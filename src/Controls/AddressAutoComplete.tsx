import React, { useState, useEffect } from 'react'
import { GOOGLE } from '../Services/utility'

interface IProps {
  address: string
  Data: any
  id: string
  UnsetAddress?: any
  SetAddress?: any
  InProgress?: boolean
}
const AddressAutoComplete: React.FC<IProps> = (props: any) => {
  let autocomplete: any
  useEffect(() => {
    initAutocomplete()
    if (props.SetAddress) {
      props.SetAddress((address: string) => {
        let temp: any = document.getElementById(props.id)
        temp.value = address
      })
    }
  }, [])

  const initAutocomplete = () => {
    let inputField: any = document.getElementById(props.id)
    if (inputField == null) return
    inputField.value = props.address
    console.log(props, inputField.value, 'ADDRESS 1234')
    // Create the autocomplete object, restricting the search predictions to
    // geographical location types.
    autocomplete = new GOOGLE.maps.places.Autocomplete(inputField, {})
    // Avoid paying for data that you don't need by restricting the set of
    // place fields that are returned to just the address components.
    autocomplete.setFields([
      'geometry',
      'place_id',
      'formatted_address',
      'vicinity'
    ])
    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    autocomplete.addListener('place_changed', fillInAddress)
  }

  const fillInAddress = () => {
    // Get the place details from the autocomplete object.
    const place = autocomplete.getPlace()
    console.log(place, 'PLACES')
    console.log(
      place,
      'PLACE',
      place.geometry.location.lat(),
      place.geometry.location.lng()
    )
    if (props.Data != undefined && place !== undefined) {
      props.Data({
        address: place.formatted_address,
        vicinity: place.vicinity,
        lat: place.geometry.location.lat(),
        long: place.geometry.location.lng()
      })
    }
  }

  const geolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        const circle = new GOOGLE.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        })
        if (autocomplete != undefined)
          autocomplete.setBounds(circle.getBounds())
      })
    }
  }

  return (
    <div id='locationField'>
      <input
        id={props.id}
        placeholder='Enter your address'
        onFocus={geolocate}
        type='text'
        className='form-control'
        onChange={props.UnsetAddress}
        autoComplete='off'
        disabled={props.InProgress}
        required
      />
    </div>
  )
}
export default AddressAutoComplete
