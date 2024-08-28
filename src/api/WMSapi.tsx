import axios from 'axios'
import { WMSurl } from '../constants/api'
export const WmSApi = axios.create({
    baseURL: WMSurl,
    headers: {
        'Content-Type': 'application/json'
      }
})