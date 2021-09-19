import React, { useState } from 'react'
import { CSidebar, CSidebarBrand, CSidebarNav } from '@coreui/react'

// sidebar nav config
import navigation from './_nav'
import { useHistory } from 'react-router'
import { ValueFromUserData } from '../Services/utility'

const TheSidebar = (props: any) => {
  const history = useHistory()

  const [sidebarMinimize, SetShow] = useState(false)

  const IsActive = (url: string) => {
    let temp: string = ''

    if (sidebarMinimize) {
      temp += 'is-mini '
    }

    if (history.location.pathname.includes(url)) {
      temp += 'active'
    }
    return temp
  }

  const IsAllowed = (check: any, currentRole: string) => {
    let roles: any[] = check.split('|')
    return roles.indexOf(currentRole) == -1 ? false : true
  }

  return (
    <CSidebar minimize={sidebarMinimize}>
      <CSidebarBrand className='d-md-down-none'>
        <div className='logo'>
          {!sidebarMinimize ? (
            <p>
              <img src='images/side-nav-logo.png' alt='' />
            </p>
          ) : null}
          <span>
            <i
              className='fas fa-bars hand'
              onClick={() => {
                SetShow(!sidebarMinimize)
              }}
            ></i>
          </span>
        </div>
      </CSidebarBrand>
      <CSidebarNav>
        {navigation.map(nav => {
          return IsAllowed(nav.accessTo, ValueFromUserData('roleName')) ? (
            <li title={nav.name} className={IsActive(nav.to)}>
              <a
                href={'#' + nav.to}
                id={`nav-${nav.name}`}
                className={sidebarMinimize ? 'min-align' : ''}
              >
                <div className='ico'>
                  <i className={nav.icon}></i>
                </div>
                {!sidebarMinimize ? (
                  <div className='ico-text'>{nav.name}</div>
                ) : null}
              </a>
            </li>
          ) : null
        })}
      </CSidebarNav>
      <span className='version'> Version: 0.8.8</span>
    </CSidebar>
  )
}

export default React.memo(TheSidebar)
