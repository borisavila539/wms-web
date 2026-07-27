import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { DespachoResponse } from '../../interfaces/GeneracionDespachoPorPantilla/DespachoImoportInterface';
import { WMSDespachoPTApi } from '../../api/WMSDespachoPTApi';
// @ts-ignore
import './DespachoImport.css';


export const DespachoImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cabecera' | 'detalle' | 'estatus'>('cabecera');
  const [data, setData] = useState<DespachoResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setErrorMsg('Selecciona un archivo Excel antes de continuar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
   
      const response = await WMSDespachoPTApi.post<DespachoResponse>(
        'importar-excel',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setData(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al conectar con el servidor';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="despacho-container">
      <div className="despacho-header">
        <h1>Importación de Despacho</h1>
        <p>Genera el despacho en sistema WMS para poder procesar la liquidación automatica.</p>
      </div>

      {/* Card Principal de Subida */}
      <div className="upload-card">
        <div className="upload-action-bar">
          <div className="file-input-group">
            <label className="btn-file-select">
              {/* SVG Ícono Upload */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Seleccionar Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            {file && (
              <span className="file-selected-badge">
                {/* SVG Ícono Documento */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {file.name}
              </span>
            )}
          </div>

          <button className="btn-submit" onClick={handleProcessFile} disabled={!file || loading}>
            {loading ? (
              <>
                {/* SVG Ícono Loading Spinner */}
                <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                </svg>
                <span>Procesando en C#...</span>
              </>
            ) : (
              <span>Subir y Guardar</span>
            )}
          </button>
        </div>

        {/* Notificaciones */}
        {errorMsg && (
          <div className="alert-box alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {data?.success && (
          <div className="alert-box alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>
              <strong>¡Despacho creado con éxito!</strong> ID Asignado en Base de Datos: <strong>#{data.despachoID}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Navegación por Pestañas */}
      <div className="tabs-navigation">
        <button
          className={`tab-button ${activeTab === 'cabecera' ? 'active' : ''}`}
          onClick={() => setActiveTab('cabecera')}
        >
          Cabecera 
        </button>
        <button
          className={`tab-button ${activeTab === 'detalle' ? 'active' : ''}`}
          onClick={() => setActiveTab('detalle')}
        >
          Detalle ({data?.detalle?.length || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'estatus' ? 'active' : ''}`}
          onClick={() => setActiveTab('estatus')}
        >
          Estatus Unidades ({data?.estatusOP?.length || 0})
        </button>
      </div>

      {/* Renderizado de Tablas */}
      <div className="table-wrapper">
        {activeTab === 'cabecera' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID SQL</th>
                <th>Driver</th>
                <th>Truck</th>
                <th>EstadoID</th>
                <th>UserCreated</th>
                <th>CreatedDateTime</th>
                <th>Almacén</th>
                <th>Caja Segundas</th>
                <th>Cajas Terceras</th>
              </tr>
            </thead>
            <tbody>
              {data?.cabecera ? (
                <tr>
                  <td className="td-id">#{data.cabecera.id || data.despachoID}</td>
                  <td>{data.cabecera.driver}</td>
                  <td>{data.cabecera.truck}</td>
                  <td>{data.cabecera.estadoID}</td>
                  <td>{data.cabecera.userCreated}</td>
                  <td>{data.cabecera.createdDateTime}</td>
                  <td>{data.cabecera.almacen}</td>
                  <td>{data.cabecera.cajaSegundas}</td>
                  <td>{data.cabecera.cajasTerceras}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="empty-row">No hay datos importados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'detalle' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ProdCutSheetID</th>
                <th>Box</th>
                <th>Size</th>
                <th>Color</th>
                <th>ItemID</th>
                <th>ProdID</th>
                <th>QTY</th>
              </tr>
            </thead>
            <tbody>
              {data?.detalle && data.detalle.length > 0 ? (
                data.detalle.map((item, i) => (
                  <tr key={i}>
                    <td>{item.prodCutSheetID}</td>
                    <td>{item.box}</td>
                    <td>{item.size}</td>
                    <td>{item.color}</td>
                    <td>{item.itemID}</td>
                    <td>{item.prodID}</td>
                    <td className="td-id">{item.qty}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-row">No hay filas en el detalle.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'estatus' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ProdID</th>
                <th>Size</th>
                <th>Costura 1</th>
                <th>Textil 1</th>
                <th>Costura 2</th>
                <th>Textil 2</th>
              </tr>
            </thead>
            <tbody>
              {data?.estatusOP && data.estatusOP.length > 0 ? (
                data.estatusOP.map((item, i) => (
                  <tr key={i}>
                    <td>{item.prodID}</td>
                    <td>{item.size}</td>
                    <td>{item.costura1}</td>
                    <td>{item.textil1}</td>
                    <td>{item.costura2}</td>
                    <td>{item.textil2}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-row">No hay estatus cargados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};