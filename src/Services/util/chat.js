import Axios from "axios";
import { RunConfig, setLocalStorage } from "../utility";

export const me = () => {
  return Axios.get(`${RunConfig.rcBaseURL}api/v1/me`);
};
export const subscriptions = () => {
  return Axios.get(`${RunConfig.rcBaseURL}api/v1/subscriptions.get`);
};
export const login = async (obj, cb) => {
  let resp = await Axios.post(`${RunConfig.rcBaseURL}api/v1/login`, obj);
  console.log("resp", resp);
  if (resp.data.data) {
    setLocalStorage("authToken", resp.data.data.authToken);
    setLocalStorage("rcUserId", resp.data.data.userId);
    setLocalStorage("verifiedOnChat", 1);
    setLocalStorage("rcUserName", resp.data.data.me.username);
    if (cb) cb();
  } else {
    setLocalStorage("verifiedOnChat", 0);
  }
  return resp;
};
