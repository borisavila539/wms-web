import React, { FormEvent, useContext, useState } from "react"
import { WmSApi } from "../../api/WMSapi"
import { LoginInterface } from "../../interfaces/LoginInterface"
import { WMSContext } from "../../Context/WMSContext"
import { useNavigate } from "react-router-dom"
import './Login.css'

const Login = () => {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const { changeUsuario } = useContext(WMSContext)
    const navigate = useNavigate()

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        console.log('login')
        try {
            let datos: LoginInterface = {
                user: username,
                pass: password,
                logeado: false,
                almacen: 0
            }
            await WmSApi.post<LoginInterface>('Login', datos)
                .then(resp => {
                    if (resp.data.logeado) {
                        changeUsuario(username)
                        navigate('/Menu')
                    } else {
                        alert('Usuario o contraseña incorrectos');
                    }
                })
        } catch (err) {
            console.log('error')
        }
    }
    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <div>
                        <input
                            type="text"
                            placeholder="usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Contrasena"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>

            </div>
        </div>

    )
}

export default Login