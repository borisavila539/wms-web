import axios from "axios";
import { WMSDespachoPTUrl } from "../constants/api";

export const WMSDespachoPTApi = axios.create({
    baseURL: WMSDespachoPTUrl,
    headers: {
        'Content-Type': 'application/json'
      }
})