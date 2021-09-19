import React from 'react'
import ChatSidebar from './ChatSidebar'
import ChatInbox from './ChatInbox'
import * as chatService from '../../../Services/util/chat'
import * as chatSock from '../../../Services/util/rocketChatServices'
import {
  ChatLogin,
  readFromLocalStorage,
  IsAdmin,
  ValueFromUserData
} from '../../../Services/utility'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import _ from 'lodash'
import { PostData, GetData } from '../../../Services/Api'
import UpgradePlanBanner from '../../../Controls/UpgradePlanBanner'
interface IState {
  // [x: string]: any
  me: any
  roomDetails: any
  newRID: any
  allMessages: any[]
  typingMessage: any
  ValidChatCredentials: boolean
  ShowBanner: boolean
  BannerMessage: string
}
let NotifyCB: any = undefined
let NotifyNewRoomIdCB: any = undefined
export default class Messaging extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      me: {},
      roomDetails: 0,
      newRID: 0,
      allMessages: [],
      typingMessage: '',
      ValidChatCredentials: true,
      ShowBanner: false,
      BannerMessage: ''
    }
  }

  componentDidMount = async () => {
    if (ValueFromUserData('rcUserName') && ValueFromUserData('rcPassword')) {
      chatSock.initChat()
      console.log('chat is initialized')
      ChatLogin()
      console.log('chat- Logging in to chat...')
      this.GetMyDetails()
      await this.OnMessage()
    } else {
      console.log("Chat credentials don't exist!")
      this.setState({ ValidChatCredentials: false })
    }
  }

  componentWillUnmount = () => {
    console.log('chat- closing...')
    chatSock.close()
  }

  // socket messages are listened here
  OnMessage = async () => {
    chatSock.rocketChatSocket.onmessage = async e => {
      let response = JSON.parse(e.data)
      console.log(response, 'chat- listener')
      // console.log(response,'response')
      //response.msg=="result" denotes success in socket response
      //response of loadHistory i.e messages
      if (response.msg == 'connected') {
        if (NotifyCB) NotifyCB()
      }
      if (response.id == 33 && response.msg == 'result') {
        // common.HideLoader();
        if (response.result != undefined) {
          let prevMsgs = response.result.messages.concat(this.state.allMessages)
          this.setState({ allMessages: prevMsgs }, () => {
            console.log('chat- main body state', this.state)
          })
          // this.setState({ allMessages: _.uniq(prevMsgs, '_id') })
          if (NotifyCB) NotifyCB()
        }
      }
      // handle ping to keep socket alive
      if (response.msg == 'ping') {
        chatSock.rocketChatSocket.send(JSON.stringify({ msg: 'pong' }))
      }
      // handle replies
      if (response.id == '3315') {
        console.log(response, 'arshima')
        // this.setState({threadReplies:response.result})
      }
      // handle create direct message
      if (response.id == 421 && response.msg == 'result') {
        if (NotifyNewRoomIdCB(response.result.rid))
          this.setState({ newRID: response.result.rid })
      }
      // handle response of send message
      if (response.id == 42 && response.msg == 'result') {
        console.log(response, 'arshima')
        // let prevMsgs = this.state.allMessages;
        // // sometimes 42 is returned for some other case other than send msg
        // if(response.result.msg)
        //   await prevMsgs.unshift(response.result)
      }
      // handle streaming data
      if (
        response.msg == 'changed' &&
        response.collection == 'stream-room-messages'
      ) {
        let prevMsgs = this.state.allMessages
        await prevMsgs.unshift(response.fields.args[0])
        this.setState({ allMessages: _.uniqBy(prevMsgs, '_id') })
      }
      // handle stream notify room (typing or deleted messages are streamed here)
      if (
        response.msg == 'changed' &&
        response.collection == 'stream-notify-room'
      ) {
        console.log('chat- streaming')
        let msgId = response.fields.args[0]['_id']
        let event = response.fields.eventName.split('/')
        if (event[1] == 'typing') {
          let typingMessage
          if (
            response.fields.args[1] == true &&
            response.fields.args[0] != ValueFromUserData('rcUserName')
          )
            typingMessage = response.fields.args[0]
          else typingMessage = ''
          this.setState({ typingMessage: typingMessage })
        } else {
          //delete message
          if (this.state.roomDetails.rid == event[0]) {
            // let prevMsgs = this.state.allMessages;
            let prevMsgs = await this.state.allMessages.filter(
              data => data._id != msgId
            )
            this.setState({ allMessages: prevMsgs })
          }
        }
      }
    }
  }

  GetMyDetails = async () => {
    try {
      let resp = await chatService.me()
      console.log('resp', resp)
      this.setState({ me: resp.data })
    } catch (err) {
      let data = {
        success: false
      }
      // common.showToaster(data)
    }
  }

  RoomChanged = (rid: any, rname: any) => {
    console.log('chat- room changed')
    let obj = {
      rid: rid,
      rname: rname
    }
    this.setState({ roomDetails: obj, allMessages: [], typingMessage: '' })
    setTimeout(() => {
      // common.HideLoader();
    }, 6000)
  }

  render () {
    return (
      <div className='white-container chat-main'>
        <UpgradePlanBanner
          ShowBanner={this.state.ShowBanner}
          BannerMessage={this.state.BannerMessage}
          IsFixed={true}
        />
        <h2>Messaging</h2>
        <div className='chat-body'>
          {this.state.ValidChatCredentials ? (
            <div className='row'>
              <ChatSidebar
                RoomChanged={this.RoomChanged}
                me={this.state.me}
                currentRID={
                  this.state.roomDetails.rid ? 0 : this.state.roomDetails.rid
                }
                newRID={this.state.newRID}
                NotifyMessageFetchComplete={(fn: any) => {
                  NotifyCB = fn
                }}
                NotifyNewRoomCreation={(fn: any) => {
                  NotifyNewRoomIdCB = fn
                }}
                ReportUpgradePlan={(data: any) => {
                  this.setState({
                    ShowBanner: true,
                    BannerMessage: data.message
                  })
                }}
              />
              {this.state.roomDetails == 0 ? (
                <ChatWelcomeScreen me={this.state.me} />
              ) : (
                <ChatInbox
                  me={this.state.me}
                  roomDetails={this.state.roomDetails}
                  // messages={this.state.allMessages}
                  GetRoomMessages={() => {
                    return _.orderBy(
                      this.state.allMessages,
                      ['ts.$date'],
                      ['asc']
                    )
                  }}
                  // key={this.state.roomDetails.rid}
                  typingMessage={this.state.typingMessage}
                  // threadReplies={this.state.threadReplies}
                  // random={Math.random()}
                />
              )}
            </div>
          ) : (
            <div className='text-center'>
              Chat server not provisioned for this instance. Please contact
              administrator for details.
            </div>
          )}
        </div>
      </div>
    )
  }
}
