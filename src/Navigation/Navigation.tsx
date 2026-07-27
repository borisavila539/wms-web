
import React, { useState, useRef, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import RecepcionUbicacionCajas from '../Screens/RecepcionUbicaiconCajas/RecepcionUbicacionCajas';
import DeclaracionEnvio from '../Screens/DeclaracionEnvio/DeclaracionEnvio';
import ControlCajasEtiquetas from '../Screens/ControlCajasEtiquetas/ControlCajasEtiquetas';
import GeneracionCodigosPreciosScreen from '../Screens/GeneracionPreciosCodigos/GeneracionCodigosPreciosScreen';
import ConfiguracionPrecioCodigosScreen from '../Screens/GeneracionPreciosCodigos/ConfiguracionPrecioCodigosScreen';
import ImpresionEtiquetaPreciosScreen from '../Screens/GeneracionPreciosCodigos/ImpresionEtiquetaPreciosScreen';
import ClientesGeneracionPreciosScreen from '../Screens/GeneracionPreciosCodigos/ClientesGeneracionPreciosScreen';
import TrackingPedidosScreen from '../Screens/TrackingPedidos/TrackingPedidosScreen';
import ReceptionTela from '../Screens/ReceptionTela/ReceptionTela';
import { ConsultaRollosPorAlmacen } from '../Screens/ConsultaRollosPorAlmacen/ConsultaRollosPorAlmacen';

// TypeScript may not have type declarations for CSS imports in this project setup.
// Ignore the missing module error for this side-effect import.
// @ts-ignore
import '../Navigation/Navigation.css';
import { DespachoImport } from '../Screens/GenerarDespachoPorPantilla/DespachoImport';
import ConsultaDespacho from '../Screens/ConsultarDespacho/ConsultaDespacho';

export const Navigation = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSubMenuOpen, setSubMenuOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        if (isSidebarOpen) {
            const sidebarElement = document.querySelector('.sidebar');
            if (sidebarElement) {
                sidebarElement.classList.add('closing');
            }
            setTimeout(() => {
                setSidebarOpen(false);
                const sidebarElement = document.querySelector('.sidebar');
                if (sidebarElement) {
                    sidebarElement.classList.remove('closing');
                }
            }, 50);
        } else {
            setSidebarOpen(true);
        }
    };

    const toggleSubMenu = () => {
        setSubMenuOpen(!isSubMenuOpen);
    };

    return (
        <div className="dashboard-container">
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <h3>WMS</h3>
                <ul>
                    <li>
                        <Link
                            to="ConsultaRollosPorAlmacen"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/ConsultaRollosPorAlmacen' ? 'active' : ''}
                        >
                            Consulta Rollos Por Almacen
                        </Link>
                    </li>
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

                    {/* Submenú */}
                    <li onClick={toggleSubMenu} className="submenu-toggle">
                        <span>Generacion Precios y Codigos</span>
                        <span className={`arrow ${isSubMenuOpen ? 'open' : ''}`}>&#9662;</span>
                    </li>
                    {isSubMenuOpen && (
                        <ul className="submenu">
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
                            <li>
                                <Link
                                    to="ClientesgeneracionPrecio"
                                    onClick={toggleSidebar}
                                    className={location.pathname === '/Menu/ClientesgeneracionPrecio' ? 'active' : ''}
                                >
                                    Clientes Generacion Precio
                                </Link>
                            </li>
                        </ul>
                    )}

                    <li>
                        <Link
                            to="TrackingPedidos"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/TrackingPedidos' ? 'active' : ''}
                        >
                            Tracking Pedidos
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="ReceptionTela"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/ReceptionTela' ? 'active' : ''}
                        >
                            Recepción de Telas
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="DespachoImport"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/DespachoImpot' ? 'active' : ''}
                        >
                            Generacion de Despachos PT
                        </Link>
                    </li>
                                        <li>
                        <Link
                            to="ConsultaDespacho"
                            onClick={toggleSidebar}
                            className={location.pathname === '/Menu/ConsultaDespacho' ? 'active' : ''}
                        >
                            Consultar Despacho PT
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
                    <Route path="Menu" element={<ConsultaRollosPorAlmacen />} />
                    <Route path="" element={<RecepcionUbicacionCajas />} />
                    <Route path="RecepcionUbicacionCajas" element={<RecepcionUbicacionCajas />} />
                    <Route path="DeclaracionEnvio" element={<DeclaracionEnvio />} />
                    <Route path="ControlCajasEtiquetado" element={<ControlCajasEtiquetas />} />
                    <Route path="GeneracionCodigoPrecio" element={<GeneracionCodigosPreciosScreen />} />
                    <Route path="ConfiguracionPrecioCodigos" element={<ConfiguracionPrecioCodigosScreen />} />
                    <Route path="EtiquetaPrecio" element={<ImpresionEtiquetaPreciosScreen />} />
                    <Route path="ClientesgeneracionPrecio" element={<ClientesGeneracionPreciosScreen />} />
                    <Route path="TrackingPedidos" element={<TrackingPedidosScreen />} />
                    <Route path="ReceptionTela" element={<ReceptionTela />} />
                    <Route path="ConsultaRollosPorAlmacen" element={<ConsultaRollosPorAlmacen />} />
                    <Route path='DespachoImport' element = {<DespachoImport/>}/>
                    <Route path='ConsultaDespacho' element = {<ConsultaDespacho/>}/>
                </Routes>
            </div>
        </div>
    );
};

