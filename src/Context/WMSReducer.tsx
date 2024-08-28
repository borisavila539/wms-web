import { WMSState } from "./WMSContext"

type WMSAction =
    | { type: 'changeUsuario', payload: string }

export const WMSReducer = (state: WMSState, action: WMSAction): WMSState => {
    switch (action.type) {
        case 'changeUsuario':
            return {
                ...state,
                usuario: action.payload
            }
        default:
            return state;
    }

}