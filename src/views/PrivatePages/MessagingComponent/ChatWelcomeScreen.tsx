import React from 'react'

export default class ChatWelcomeScreen extends React.Component<any> {
  constructor (props: any) {
    super(props)
  }
  render () {
    return (
      <div className='col-md-8 messages welcomeScreen'>
        <h3>HOME</h3>
        <p>Welcome {this.props.me.name} To Logicly Chat!</p>
        <p>Please select a room from the left.</p>
      </div>
    )
  }
}
