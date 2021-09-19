import React from 'react'
import * as chatService from '../../../Services/util/chat'
import * as chatSock from '../../../Services/util/rocketChatServices'
import { IsAdmin } from '../../../Services/utility'
import { GetData, PostData } from '../../../Services/Api'
interface IState {
  [x: string]: any
  Subscriptions: any[]
  MessageFetchInProgress: boolean
  fetching: boolean
}
let CurrentRoomId: any = undefined
let NewRoomId: any = ''
export default class ChatSidebar extends React.Component<any, IState> {
  constructor (props: any) {
    super(props)
    this.state = {
      Subscriptions: [],
      MessageFetchInProgress: true,
      fetching: false
    }
  }

  CreateMissingChats = async () => {
    try {
      this.setState({ fetching: true })
      let result: any = await PostData(
        `/RocketChat/CreateMissingRocketChatAccounts`,
        {}
      )
    } catch (err) {
      console.log('err', err.message)
    } finally {
      this.setState({ fetching: false })
    }
  }

  FetchSubscriptions = async (ShowFetch: boolean = true) => {
    //

    try {
      if (this.state.fetching) return
      this.setState({ fetching: ShowFetch })
      let result: any = await GetData(`/RocketChat/GetRooms`)
      console.log(result, 'chat- subscriptions...')
      if (result.status == 401) {
        if (this.props.ReportUpgradePlan) this.props.ReportUpgradePlan(result)
      }
      if (!result.data) {
        throw { message: result.message || 'error' }
      } else {
        this.setState({ Subscriptions: result.data })
      }
    } catch (err) {
      console.log('chat- err', err)
    } finally {
      this.setState({ fetching: false })
    }

    //
  }

  componentDidMount = () => {
    //
    this.FetchSubscriptions()
    //
    // this.GetSubscriptions()
    if (this.props.NotifyNewRoomCreation) {
      this.props.NotifyNewRoomCreation((rid: any) => {
        NewRoomId = rid
      })
    }

    if (this.props.NotifyMessageFetchComplete)
      this.props.NotifyMessageFetchComplete(() => {
        this.setState({
          MessageFetchInProgress: false
        })
      })

    // fallback
    setTimeout(() => {
      if (this.state.MessageFetchInProgress) {
        this.setState({
          MessageFetchInProgress: false
        })
      }
    }, 10000)
  }
  GetSubscriptions = async () => {
    try {
      let resp = await chatService.subscriptions()
      console.log(resp, 'chat- subscriptions...')
      if (resp.status != 200) {
        throw { message: resp.data.statusText }
      } else {
        this.setState({ Subscriptions: resp.data.update })
      }
    } catch (err) {
      console.log('chat- err', err)
    }
  }

  OpenRoom = async (rid: any, rname: any, chatUsername: any, index: any) => {
    // common.ShowLoader()
    // unstream room messages of previous room before switching the room
    console.log(
      'chat- unstream room messages',
      CurrentRoomId,
      this.props.currentRID
    )
    if (CurrentRoomId || this.props.currentRID != 0)
      await chatSock.unstreamRoomMessages(
        CurrentRoomId || this.props.currentRID
      )

    if (rid == null) {
      this.setState({ MessageFetchInProgress: true })
      await chatSock.createDirectMessage(chatUsername)
      setTimeout(async () => {
        console.log('chat- new room id', NewRoomId)
        await this.goToRoom(NewRoomId || this.props.newRID, rname)
        this.state.Subscriptions[index].roomId = NewRoomId || this.props.newRID
        this.setState({ ...this.state, MessageFetchInProgress: false })
        // this.FetchSubscriptions()
        console.log("chat- room doesn't exist")
      }, 1500)
      //create room
    } else {
      this.setState({
        MessageFetchInProgress: true
      })
      setTimeout(() => {
        if (this.state.MessageFetchInProgress) {
          this.setState({
            MessageFetchInProgress: false
          })
        }
      }, 5000)
      NewRoomId = rid
      await this.goToRoom(rid, rname)
    }
    console.log('refresh subscriptions')
    await this.FetchSubscriptions(false)
  }

  goToRoom = async (rid: any, rname: any) => {
    console.log('chat- room change values', rid, rname)
    await chatSock.loadHistory(rid)
    await chatSock.readMessages(rid)
    await chatSock.streamRoomMessages(rid)
    await chatSock.streamNotifyRoom(rid)
    this.props.RoomChanged(rid, rname)
    CurrentRoomId = rid
  }

  IsActiveRoom = (roomId: any = undefined) => {
    console.log(roomId, NewRoomId, this.props.NewRID, 'room id')
    return `list-item ${NewRoomId == roomId ? 'activeMessage' : ''}`
  }

  render () {
    return (
      <div className='col-md-4 chats'>
        <div className='row'>
          <div className='col-md-6'>
            <span
              className='user-avatar'
              title={this.props.me.name ? this.props.me.name : ''}
            >
              {this.props.me.name
                ? this.props.me.name.toUpperCase().charAt(0)
                : ''}
            </span>
          </div>
          <div className='col-md-6 refresh'>
            {/* {IsAdmin() ? (
              <i
                className='fas fa-plus-square hand'
                onClick={this.CreateMissingChats}
              />
            ) : null} */}

            <i
              className='fas fa-sync hand'
              onClick={() => {
                this.FetchSubscriptions()
              }}
            />
          </div>
          <small>
            {this.state.MessageFetchInProgress ? 'Connecting...' : null}
          </small>
          <small>
            {!this.state.MessageFetchInProgress && this.state.fetching
              ? 'Refreshing...'
              : null}
          </small>
        </div>
        <h4>Users</h4>

        <div className='listing'>
          {this.state.Subscriptions.length == 0 ? (
            <div className='text-center'>No Users</div>
          ) : null}
          {this.state.Subscriptions.map((value: any, index: any) => {
            return (
              <div
                className={this.IsActiveRoom(value.roomId)}
                onClick={() => {
                  if (this.state.MessageFetchInProgress) return
                  this.OpenRoom(
                    value.roomId,
                    value.name,
                    value.chatUsername,
                    index
                  )
                }}
              >
                {value.t == 'c' && false ? (
                  <span className='user-avatar'>#</span>
                ) : (
                  <span className='user-avatar'>
                    {value.name.toUpperCase().charAt(0)}
                  </span>
                )}
                <span className='user-name'>{value.name}</span>
                {value.unreadCount > 0 ? (
                  <span className='dot message-count-dot'>
                    {value.unreadCount}
                  </span>
                ) : null}
                {/*  */}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
