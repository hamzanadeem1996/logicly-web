import React, { createRef } from 'react'
import moment from 'moment'
import * as chatSock from '../../../Services/util/rocketChatServices'
interface IState {
  [x: string]: any
  AllMessages: any[]
  CurrentDate: any
  IsLoading: boolean
  IsScrolling: boolean
  message: any
}
let testDate: any = new Date()
export default class ChatInbox extends React.Component<any, IState> {
  refs: any = createRef<HTMLInputElement>()
  constructor (props: any) {
    super(props)
    this.state = {
      AllMessages: [],
      CurrentDate: new Date(),
      message: '',
      IsLoading: false,
      IsScrolling: false
    }
  }
  componentDidMount = () => {
    console.log('chat- inbox props', this.props)
  }
  componentWillReceiveProps = () => {
    console.log('chat- inbox props updated', this.props)
    this.setState({ IsLoading: false })
    if (this.props.GetRoomMessages) {
      let temp = this.props.GetRoomMessages()

      this.setState({
        AllMessages: temp,
        CurrentDate: temp && temp.length != 0 ? temp[0].ts.$date : new Date()
      })
    }
  }
  componentDidUpdate = () => {
    console.log('chat- inbox component did update')
    if (!this.state.IsLoading && !this.state.IsScrolling) {
      console.log('chat- inbox move to first message', this.state)
      var container: any = document.querySelector('#messageBox')
      container.scrollIntoView({ behavior: 'smooth', block: 'center' })
      container.scrollTop = container.scrollHeight
    }
    testDate = Math.random()
  }

  OnScroll = async () => {
    let scrollValue = this.refs.chatContainer.scrollTop
    if (scrollValue < 5 && !this.state.IsLoading) {
      let currentTopMessage = this.state.AllMessages[0]
      if (!currentTopMessage) {
        this.setState({ IsLoading: false })
        return ''
      }
      this.setState({ IsLoading: true, IsScrolling: true })
      // Fetch More Messages
      await chatSock.loadHistory(
        this.props.roomDetails.rid,
        this.state.AllMessages[0].ts.$date
      )
    }
    console.log(
      'chat- inbox scroll value',
      scrollValue,
      this.refs.chatContainer
    )
  }

  RenderDate = (d: any, cd: any) => {
    if (d == cd) {
      return null
    } else {
      testDate = d
      return (
        <div className='sticky-date'>
          <span className='active-message-thread-date'>
            {moment(d).format('MMM DD, YYYY')}
          </span>
        </div>
      )
    }
  }

  SendMessage = () => {
    if (this.state.message != '') {
      chatSock.sendMessage(
        this.state.message,
        this.props.roomDetails.rid
        // this.state.editMsg,
        // this.state.mainThreadId
      )
      this.setState({ editMsg: 0 })
      // clear the textarea when message is sent
      this.setState({ message: '' })
      // this.closeThread()
    }
  }

  KeyPressed = (e: any) => {
    if (e.keyCode === 13) {
      this.SendMessage()
    } else if (this.state.message != '') {
      chatSock.streamTyping(this.props.roomDetails.rid, true)
    } else {
      chatSock.streamTyping(this.props.roomDetails.rid, false)
    }
  }

  HandleChange = (event: any) => {
    this.setState({ message: event.target.value })
  }

  render () {
    return (
      <div className='col-md-8 messages'>
        <h4>{this.props.roomDetails.rname || '?'}</h4>

        <div
          className='chat-block'
          id='messageBox'
          onScroll={this.OnScroll}
          ref='chatContainer'
        >
          {/* <label className="line-divide"></label> */}
          {this.state.IsLoading ? (
            <div className='text-center'>
              {' '}
              <i className='fa fa-spinner' aria-hidden='true'></i>
            </div>
          ) : (
            ''
          )}
          {/*  */}
          {this.state.AllMessages.length == 0 ? (
            <div className='text-center'>Start of conversation</div>
          ) : null}
          {this.state.AllMessages.map((message: any, index: any) => {
            return (
              <>
                {this.RenderDate(
                  moment(message.ts.$date).format('MMM DD, YYYY'),
                  moment(testDate).format('MMM DD, YYYY')
                )}
                <div className='row message'>
                  <div className='col-md-1'>
                    <span className='user-avatar'>
                      {message.u.name
                        ? message.u.name.toUpperCase().charAt(0)
                        : message.u.username
                        ? message.u.username.toUpperCase().charAt(0)
                        : '?'}
                    </span>
                  </div>
                  <div className='col-md-10'>
                    <div className='message-time'>
                      {moment(message.ts.$date).format('hh:mm A')}
                    </div>
                    <div className='message-text'>
                      {message.t == 'uj'
                        ? message.msg + ' has joined the channel.'
                        : message.t == 'uj'
                        ? message.msg + ' has been added to the channel.'
                        : message.t == 'ru'
                        ? message.msg + ' has been removed.'
                        : message.msg}
                    </div>
                  </div>
                </div>
              </>
            )
          })}
          {/*  */}
        </div>
        <div className='input-container'>
          {/* {this.props.typingMessage != '' ? (
            <sub className='typingNotification'>
              <strong>{this.props.typingMessage}</strong> is typing...
            </sub>
          ) : null} */}
          <textarea
            className='form-control'
            onKeyUp={e => this.KeyPressed(e)}
            value={this.state.message}
            onChange={this.HandleChange}
            cols={5}
            placeholder='Type a Message'
          />
          <i className='fas fa-paper-plane hand' onClick={this.SendMessage}></i>
        </div>
      </div>
    )
  }
}
