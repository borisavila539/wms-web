import React, { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import RecepcionUbicacionCajas from '../Screens/RecepcionUbicaiconCajas/RecepcionUbicacionCajas';
import DeclaracionEnvio from '../Screens/DeclaracionEnvio/DeclaracionEnvio';
import ControlCajasEtiquetas from '../Screens/ControlCajasEtiquetas/ControlCajasEtiquetas';
import GeneracionCodigosPreciosScreen from '../Screens/GeneracionPreciosCodigos/GeneracionCodigosPreciosScreen';
import ConfiguracionPrecioCodigosScreen from '../Screens/GeneracionPreciosCodigos/ConfiguracionPrecioCodigosScreen';
import ImpresionEtiquetaPreciosScreen from '../Screens/GeneracionPreciosCodigos/ImpresionEtiquetaPreciosScreen';
import ClientesGeneracionPreciosScreen from '../Screens/GeneracionPreciosCodigos/ClientesGeneracionPreciosScreen';
import './Navigation.css';
import TrackingPedidosScreen from '../Screens/TrackingPedidos/TrackingPedidosScreen';

export const Navigation = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSubMenuOpen, setSubMenuOpen] = useState(false); // Estado para el submenú
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const toggleSubMenu = () => {
        setSubMenuOpen(!isSubMenuOpen); // Alternar la visibilidad del submenú
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
                    <li onClick={toggleSubMenu} style={{ cursor: 'pointer' }}>
                        <span>Generacion Precios y Codigos</span>
                    </li>
                    {isSubMenuOpen && ( // Si el submenú está abierto, mostrar los enlaces
                        <ul>
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
                    <Route path="ClientesgeneracionPrecio" element={<ClientesGeneracionPreciosScreen />} />
                    <Route path="TrackingPedidos" element={<TrackingPedidosScreen />} />

                </Routes>
            </div>
        </div>
    );
};
