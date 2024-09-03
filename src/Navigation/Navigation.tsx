import React, { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import RecepcionUbicacionCajas from '../Screens/RecepcionUbicaiconCajas/RecepcionUbicacionCajas'
import './Navigation.css'
import DeclaracionEnvio from '../Screens/DeclaracionEnvio/DeclaracionEnvio'

export const Navigation = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h3 style={{textAlign: 'center'}}>WMS</h3>
        <ul>
          <li><Link to="RecepcionUbicacionCajas" >Recepcion ubicacion cajas</Link></li>
          <li><Link to="DeclaracionEnvio" >Declaracion Envio</Link></li>

          {/* Agrega más enlaces según sea necesario */}
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

          {/* Agrega más rutas según los módulos */}
        </Routes>
      </div>
    </div>
  );
}
