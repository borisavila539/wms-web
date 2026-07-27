import React, { useState } from 'react';
import { DespachoResponse } from '../../interfaces/GeneracionDespachoPorPantilla/DespachoImoportInterface';
import { WMSDespachoPTApi } from '../../api/WMSDespachoPTApi';

// @ts-ignore
import './ConsultaDespacho.css';

const ConsultaDespacho: React.FC = () => {
  const [despachoId, setDespachoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DespachoResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'detalle' | 'estatus'>('detalle');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despachoId.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await WMSDespachoPTApi.get(`ObtenerPorId/${despachoId}`);
      
      if (response.data && response.data.success !== false) {
        setData(response.data);
      } else {
        setError(response.data.message || 'No se encontró el despacho especificado.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al conectar con el servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consulta-container">
      {/* HEADER HOMOLOGADO CON LA PRIMERA PANTALLA */}
      <div className="despacho-header">
        <h1>Consulta de Despacho</h1>
        <p>Busca un número de despacho registrado para revisar el estado de su cabecera y detalles.</p>
      </div>

      {/* CARD DE BÚSQUEDA */}
      <div className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="number"
              placeholder="Ingresa # de Despacho (ej. 1024)"
              value={despachoId}
              onChange={(e) => setDespachoId(e.target.value)}
              className="search-input"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? (
              <>
                <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                </svg>
                <span>Buscando...</span>
              </>
            ) : (
              <span>Buscar</span>
            )}
          </button>
        </form>

        {/* NOTIFICACIÓN DE ERROR */}
        {error && (
          <div className="alert-box alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      {data && (
        <>
          {/* CABECERA */}
          <div className="cabecera-card">
            <h2 className="cabecera-title">
              Información de la Cabecera (Despacho #{despachoId})
            </h2>
            <div className="cabecera-grid">
              <div className="info-box">
                <span className="info-label">Almacén</span>
                <span className="info-value">{data.cabecera?.almacen || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Motorista / Driver</span>
                <span className="info-value">{data.cabecera?.driver || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Contenedor / Truck</span>
                <span className="info-value">{data.cabecera?.truck || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Estado</span>
                <div>
                  <span className="badge-estado">ID: {data.cabecera?.estadoID}</span>
                </div>
              </div>
              <div className="info-box">
                <span className="info-label">Cajas Segundas</span>
                <span className="info-value">{data.cabecera?.cajaSegundas ?? 0}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Cajas Terceras</span>
                <span className="info-value">{data.cabecera?.cajasTerceras ?? 0}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Usuario Creador</span>
                <span className="info-value">{data.cabecera?.userCreated || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Fecha Creación</span>
                <span className="info-value">{data.cabecera?.createdDateTime || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* NAV DE PESTAÑAS */}
          <div className="tabs-navigation">
            <button
              className={`tab-button ${activeTab === 'detalle' ? 'active' : ''}`}
              onClick={() => setActiveTab('detalle')}
            >
              Detalle de Artículos ({data.detalle?.length || 0})
            </button>
            <button
              className={`tab-button ${activeTab === 'estatus' ? 'active' : ''}`}
              onClick={() => setActiveTab('estatus')}
            >
              Estatus de Unidades ({data.estatusOP?.length || 0})
            </button>
          </div>

          {/* TABLAS */}
          <div className="table-wrapper">
            {/* TABLA DETALLE */}
            {activeTab === 'detalle' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Caja</th>
                    <th>Código Artículo</th>
                    <th>Número de OP</th>
                    <th>CutSheet ID</th>
                    <th>Color</th>
                    <th>Talla</th>
                    <th className="text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detalle && data.detalle.length > 0 ? (
                    data.detalle.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{item.box}</td>
                        <td>{item.itemID}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{item.prodID}</td>
                        <td>{item.prodCutSheetID}</td>
                        <td>{item.color}</td>
                        <td>{item.size}</td>
                        <td className="text-right bold-qty">{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        No hay detalles registrados para este despacho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* TABLA ESTATUS DE UNIDADES */}
            {activeTab === 'estatus' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número de OP</th>
                    <th>Talla</th>
                    <th className="text-center bg-col1">Costura 1</th>
                    <th className="text-center bg-col1">Textil 1</th>
                    <th className="text-center bg-col2">Costura 2</th>
                    <th className="text-center bg-col2">Textil 2</th>
                  </tr>
                </thead>
                <tbody>
                  {data.estatusOP && data.estatusOP.length > 0 ? (
                    data.estatusOP.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{item.prodID}</td>
                        <td>{item.size}</td>
                        <td className="text-center bg-col1">{item.costura1}</td>
                        <td className="text-center bg-col1">{item.textil1}</td>
                        <td className="text-center bg-col2">{item.costura2}</td>
                        <td className="text-center bg-col2">{item.textil2}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No hay registros de estatus de unidades para este despacho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultaDespacho;