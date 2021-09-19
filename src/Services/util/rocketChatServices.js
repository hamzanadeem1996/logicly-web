import moment from "moment";
import { RunConfig, ValueFromUserData } from "../utility";
import sha256 from "sha256";

export let rocketChatSocket = new WebSocket(
  "wss://" + RunConfig.rcBaseURL.replace("https://", "") + "websocket"
);
// console.log("rocketChatSocekt", rocketChatSocket);
export const initChat = async () => {
  console.log(rocketChatSocket, "state");
  if (rocketChatSocket.readyState == 3) {
    rocketChatSocket = new WebSocket(
      "wss://" + RunConfig.rcBaseURL.replace("https://", "") + "websocket"
    );
  }
  await connect();
  await login();
};
export const openSocket = () => {
  return rocketChatSocket.readyState == rocketChatSocket.OPEN;
};

export const sendRequest = obj => {
  if (openSocket() == 1) {
    rocketChatSocket.send(obj);
  } else {
    initChat();
  }
};

export const connect = async () => {
  await openSocket();

  let connectObject = {
    msg: "connect",
    version: "1",
    support: ["1", "pre2", "pre1"]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(connectObject));
  }, 5000);
};
export const login = () => {
  let obj = {
    msg: "method",
    method: "login",
    id: "42",
    params: [
      {
        user: { username: ValueFromUserData("rcUserName") },
        password: {
          digest: sha256(ValueFromUserData("rcPassword")),
          //   digest: sha256(readFromLocalStorage("studentId")),
          algorithm: "sha-256"
        }
      }
    ]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 5000);
};

export const unstreamRoomMessages = rid => {
  let obj = {
    msg: "unsub",
    id: ValueFromUserData("rcUserId"),
    name: "stream-room-messages",
    params: [rid, false]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 1000);
};

export const createDirectMessage = chatUsername => {
  let obj = {
    msg: "method",
    method: "createDirectMessage",
    id: "421",
    params: [chatUsername]
  };
  // setTimeout(() => {
   return sendRequest(JSON.stringify(obj));
  // }, 1000);
};

export const loadHistory = (rid, ts) => {
  let historySince = ts ? { $date: ts } : null;
  let obj = {
    msg: "method",
    method: "loadHistory",
    id: "33",
    params: [rid, historySince, 50, { $date: moment().unix() }]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 1000);
};

export const readMessages = rid => {
  let obj = { msg: "method", method: "readMessages", params: [rid], id: "2" };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 1000);
};

export const streamRoomMessages = rid => {
  let obj = {
    msg: "sub",
    id: ValueFromUserData("rcUserId"),
    name: "stream-room-messages",
    params: [rid, false]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 1000);
};

export const streamNotifyRoom = rid => {
  let objTyping = {
    msg: "sub",
    id: "MksNnkatHs",
    name: "stream-notify-room",
    params: [rid + "/typing", { useCollection: false, args: [] }]
  };
  let objDelete = {
    msg: "sub",
    id: "MksNnjatHs",
    name: "stream-notify-room",
    params: [rid + "/deleteMessage", { useCollection: false, args: [] }]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(objTyping));
    sendRequest(JSON.stringify(objDelete));
  }, 1000);
};

export const streamTyping = (rid, flag) => {
  console.log("chat- streamer", rid, flag);
  let flagVal = flag == false ? false : true; //if user has typed message or is typing
  let objTyping = {
    msg: "method",
    id: "nKjb5fGg",
    method: "stream-notify-room",
    params: [rid + "/typing", ValueFromUserData("rcUserName"), flagVal]
  };
  // setTimeout(()=>{
  sendRequest(JSON.stringify(objTyping));
  // },1000)
};

export const sendMessage = (msg, rid) => {
  // let methodName = msgId != 0 ? 'updateMessage':'sendMessage';
  let obj = {
    msg: "method",
    method: "sendMessage",
    id: "42",
    params: [
      {
        _id: undefined,
        rid: rid,
        msg: msg,
        tmid: undefined
      }
    ]
  };
  setTimeout(() => {
    sendRequest(JSON.stringify(obj));
  }, 1000);
};

export const close = () => {
  rocketChatSocket.close();
};
