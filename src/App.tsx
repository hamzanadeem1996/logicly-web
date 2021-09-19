import React, { Component } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
import './scss/style.scss'
import ForgotPassword from './views/PublicPages/login/ForgotPassword'
import Signup from './views/PublicPages/Signup/Signup'

const loading = (
  <div className='pt-3 text-center'>
    <div className='sk-spinner sk-spinner-pulse'></div>
  </div>
)

// Containers
const Layout = React.lazy(() => import('./containers/Layout'))

// Pages
const Login = React.lazy(() => import('./views/PublicPages/login/Login'))

class App extends Component {
  render () {
    return (
      <HashRouter>
        <React.Suspense
          fallback={
            <div className='loader'>
              <i className='fa fa-cog fa-spin' />
            </div>
          }
        >
          <Switch>
            <Route exact path='/login' component={Login} />
            <Route exact path='/signup' component={Signup} />
            <Route exact path='/forgot-password' component={ForgotPassword} />
            <Route path='/' render={props => <Layout {...props} />} />
          </Switch>
        </React.Suspense>
      </HashRouter>
    )
  }
}

export default App
