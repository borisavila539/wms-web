import { createContext, useReducer } from "react"
import { WMSReducer } from "./WMSReducer"

export interface WMSState {
    usuario: string
}

export const WMSInitialState: WMSState = {
    usuario: ''
}

export interface WMSContextProps {
    WMSState: WMSState,
    changeUsuario: (usuario: string) => void
}

export const WMSContext = createContext({} as WMSContextProps)


export const WMSProvider = ({ children }: any) => {
    const [WMSState, dispatch] = useReducer(WMSReducer, WMSInitialState);

    const changeUsuario = (usuario: string) => {
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