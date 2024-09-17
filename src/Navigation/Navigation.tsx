import React, { useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import RecepcionUbicacionCajas from '../Screens/RecepcionUbicaiconCajas/RecepcionUbicacionCajas'
import './Navigation.css'
import DeclaracionEnvio from '../Screens/DeclaracionEnvio/DeclaracionEnvio'
import ControlCajasEtiquetas from '../Screens/ControlCajasEtiquetas/ControlCajasEtiquetas'
import GeneracionCodigosPreciosScreen from '../Screens/GeneracionPreciosCodigos/GeneracionCodigosPreciosScreen'
import ConfiguracionPrecioCodigosScreen from '../Screens/GeneracionPreciosCodigos/ConfiguracionPrecioCodigosScreen'
import ImpresionEtiquetaPreciosScreen from '../Screens/GeneracionPreciosCodigos/ImpresionEtiquetaPreciosScreen'

export const Navigation = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation(); // Hook para obtener la ruta actual

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="dashboard-container">
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <h3 style={{ textAlign: 'center' }}>WMS</h3>
                <ul>
                    <li>
                        <Link
                            to="RecepcionUbicacionCajas"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/RecepcionUbicacionCajas' ? 'active' : ''}
                        >
                            Recepcion ubicacion cajas
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="DeclaracionEnvio"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/DeclaracionEnvio' ? 'active' : ''}
                        >
                            Declaracion Envio
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="ControlCajasEtiquetado"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/ControlCajasEtiquetado' ? 'active' : ''}
                        >
                            Control Cajas Etiquetado
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="EtiquetaPrecio"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/EtiquetaPrecio' ? 'active' : ''}
                        >
                            Impresion Etiquetas Precio
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="GeneracionCodigoPrecio"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/GeneracionCodigoPrecio' ? 'active' : ''}
                        >
                            Plantilla Creacion Articulo
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="ConfiguracionPrecioCodigos"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/ConfiguracionPrecioCodigos' ? 'active' : ''}
                        >
                            Configuracion Precios Codigos
                        </Link>
                    </li>
                </ul>
            </div>
            <div className={`main-content ${isSidebarOpen ? '' : 'shrink'}`}>
                <div className="hamburger" onClick={toggleSidebar}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <Routes>
                    <Route path="" element={<RecepcionUbicacionCajas />} />
                    <Route path="RecepcionUbicacionCajas" element={<RecepcionUbicacionCajas />} />
                    <Route path="DeclaracionEnvio" element={<DeclaracionEnvio />} />
                    <Route path="ControlCajasEtiquetado" element={<ControlCajasEtiquetas />} />
                    <Route path="GeneracionCodigoPrecio" element={<GeneracionCodigosPreciosScreen />} />
                    <Route path="ConfiguracionPrecioCodigos" element={<ConfiguracionPrecioCodigosScreen />} />
                    <Route path="EtiquetaPrecio" element={<ImpresionEtiquetaPreciosScreen />} />
                </Routes>
            </div>
        </div>
    );
};
