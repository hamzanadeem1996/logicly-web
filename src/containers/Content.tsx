import React, { Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import { CContainer } from '@coreui/react'

// routes config
import routes from '../routes'
import { ValueFromUserData } from '../Services/utility'

interface IAcceptAll {
  [x: string]: any
}

const loading = (
  <div className='pt-3 text-center'>
    <div className='sk-spinner sk-spinner-pulse'></div>
  </div>
)

const IsAllowed = (check: any, currentRole: string) => {
  let roles: any[] = check.split('|')

  return roles.indexOf(currentRole) == -1 ? false : true
}

const Content = () => {
  return (
    <main className='c-main'>
      <CContainer fluid>
        <Suspense fallback={loading}>
          <Switch>
            {routes.map((route: IAcceptAll, idx) => {
              //    console.log('test', routes)
              return IsAllowed(route.accessTo, ValueFromUserData('roleName'))
                ? route.component && (
                    <Route
                      key={idx}
                      path={route.path}
                      exact={route.exact}
                      // name={route.name}
                      render={props => <route.component {...props} />}
                    />
                  )
                : null
            })}
            <Redirect from='/' to='/login' />
          </Switch>
        </Suspense>
      </CContainer>
    </main>
  )
}

export default React.memo(Content)
