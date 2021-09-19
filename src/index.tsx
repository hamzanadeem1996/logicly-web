import 'react-app-polyfill/ie11' // For IE 11 support
import 'react-app-polyfill/stable'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { usePromiseTracker } from 'react-promise-tracker'
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
// @ts-ignore: type error
// import AlertTemplate from 'react-alert-template-basic'
// const LoadingIndicator = (props: any) => {
//     const {promiseInProgress} = usePromiseTracker();
//     return(
//         promiseInProgress &&
//         <h1>LOADING </h1>
//     );
// }
const options = {
  // you can also just use 'bottom center'
  position: positions.TOP_RIGHT,
  timeout: 5000,
  offset: '5px',
  // you can also just use 'scale'
  transition: transitions.FADE,
  containerStyle: {
    // background: 'red'
  }
}

const AlertTemplate = ({ style, options, message, close }: any) => (
  <div className={`_alert ${options.type}`} style={style}>
    {message}
    <button onClick={close}><i className='fas fa-times hand'></i></button>
  </div>
)

ReactDOM.render(
  <div>
    <AlertProvider template={AlertTemplate} {...options}>
      <App />
      {/* <LoadingIndicator /> */}
    </AlertProvider>
  </div>,
  document.getElementById('root')
)
