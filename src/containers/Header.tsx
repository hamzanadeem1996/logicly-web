import React from 'react'
import { CHeader, CSubheader, CBreadcrumbRouter } from '@coreui/react'

import routes from '../routes'
import { ValueFromUserData, IsClinician } from '../Services/utility'
import { useHistory } from 'react-router'

const TheHeader: any = () => {
  const history = useHistory()

  const LogoutUser = () => {
    console.log('logout')
    localStorage.removeItem('userData_Apex')
    history.push('/login')
  }

  const OpenProfile = () => {
    history.push('/my-profile')
  }

  return (
    <CHeader withSubheader>
      <div className='header'>
        <div className='row'>
          <div className='col-md-10'></div>
          <div className='col-md-2 text-right'>
            <div className='header-inner'>
              <div className='admin-img'>
                <div className='dropdown'>
                  <button
                    className='btn'
                    id='menu1'
                    type='button'
                    data-toggle='dropdown'
                  >
                    <div className='header-admin'>
                      <label>
                        {ValueFromUserData('firstName')}
                        {/* <small className='agency-name'>
                          {ValueFromUserData('agencyName')}
                        </small> */}
                      </label>
                      <span>{ValueFromUserData('roleName')}</span>
                    </div>
                  </button>
                  <ul
                    className='dropdown-menu'
                    role='menu'
                    aria-labelledby='menu1'
                  >
                    {IsClinician() ? (
                      <li className='hand' role='presentation'>
                        <a onClick={OpenProfile}>
                        <i className="fas fa-user-circle"/>
                          Profile</a>
                      </li>
                    ) : null}
                    <li className='hand' role='presentation'>
                      <a id='logout-btn' onClick={LogoutUser}>
                        <i className='fas fa-sign-out-alt' />
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CSubheader className='px-3 justify-content-between'>
        <CBreadcrumbRouter
          className='border-0 c-subheader-nav m-0 px-0 px-md-3'
          routes={routes}
        />
      </CSubheader>
    </CHeader>
  )
}

export default TheHeader
