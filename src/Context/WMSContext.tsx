import { createContext, useReducer } from "react"
import { WMSReducer } from "./WMSReducer"

export interface WMSState {
    usuario: string
}

const USUARIO_STORAGE_KEY = 'wms_usuario'

export const WMSInitialState: WMSState = {
    usuario: (typeof localStorage !== 'undefined' && localStorage.getItem(USUARIO_STORAGE_KEY)) || ''
}

export interface WMSContextProps {
    WMSState: WMSState,
    changeUsuario: (usuario: string) => void
}

export const WMSContext = createContext({} as WMSContextProps)


export const WMSProvider = ({ children }: any) => {
    const [WMSState, dispatch] = useReducer(WMSReducer, WMSInitialState);

    const changeUsuario = (usuario: string) => {
        localStorage.setItem(USUARIO_STORAGE_KEY, usuario)
        dispatch({ type: 'changeUsuario', payload: usuario })
    }

    return (
        <WMSContext.Provider
            value={{
                WMSState,
                changeUsuario
            }}
        >
            {children}
        </WMSContext.Provider>
    )

}