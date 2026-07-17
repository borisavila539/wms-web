import axios from "axios";
import { WMSConsultaRolloUrl } from "../constants/api";

export const WMSConsultaRolloApi = axios.create({
    baseURL: WMSConsultaRolloUrl,
    headers: {
        'Content-Type': 'application/json'
      }
})