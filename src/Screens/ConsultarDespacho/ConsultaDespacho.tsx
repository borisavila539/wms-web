import React, { useState, useMemo } from 'react';
import { DespachoResponse } from '../../interfaces/GeneracionDespachoPorPantilla/DespachoImoportInterface';
import { WMSDespachoPTApi } from '../../api/WMSDespachoPTApi';

// @ts-ignore
import './ConsultaDespacho.css';

interface ResumenTallaColor {
  parentOp: string;
  op: string;
  articulo: string;
  color: string;
  talla: string;
  totalCajas: number;
  totalPiezas: number;
}

const ConsultaDespacho: React.FC = () => {
  const [despachoId, setDespachoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DespachoResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'resumenOP' | 'detalle' | 'estatus'>('resumenOP');

  // ESTADOS PARA FILTROS (OP Padre, Artículo, Color, Talla)
  const [selectedParentOp, setSelectedParentOp] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despachoId.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    
    // Limpiar filtros al realizar nueva búsqueda
    setSelectedParentOp('');
    setSelectedItem('');
    setSelectedColor('');
    setSelectedSize('');

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

  // LISTAS DESPLEGABLES DE FILTROS (OP PADRE, ARTÍCULO, COLOR Y TALLA)
  const availableParentOps = useMemo(() => {
    if (!data) return [];
    const setParent = new Set<string>();
    data.detalle?.forEach((item) => {
      const parent = item.prodCutSheetID || item.prodID;
      if (parent) setParent.add(parent);
    });
    return Array.from(setParent).sort();
  }, [data]);

  const availableItems = useMemo(() => {
    if (!data) return [];
    const setItems = new Set<string>();
    data.detalle?.forEach((item) => item.itemID && setItems.add(item.itemID));
    return Array.from(setItems).sort();
  }, [data]);

  const availableColors = useMemo(() => {
    if (!data) return [];
    const setColors = new Set<string>();
    data.detalle?.forEach((item) => item.color && setColors.add(item.color));
    return Array.from(setColors).sort();
  }, [data]);

  const availableSizes = useMemo(() => {
    if (!data) return [];
    const setSizes = new Set<string>();
    data.detalle?.forEach((item) => item.size && setSizes.add(item.size));
    data.estatusOP?.forEach((item) => item.size && setSizes.add(item.size));
    return Array.from(setSizes).sort();
  }, [data]);

  // CÁLCULOS Y MÉTRICAS FILTRADAS
  const reportMetrics = useMemo(() => {
    if (!data) return null;

    // 1. Filtrar Detalle (Incluyendo el nuevo filtro de Color)
    const filteredDetalle = (data.detalle || []).filter((item) => {
      const parent = item.prodCutSheetID || item.prodID;
      const matchParent = !selectedParentOp || parent === selectedParentOp;
      const matchItem = !selectedItem || item.itemID === selectedItem;
      const matchColor = !selectedColor || item.color === selectedColor;
      const matchSize = !selectedSize || item.size === selectedSize;
      return matchParent && matchItem && matchColor && matchSize;
    });

    const validOpSet = new Set(filteredDetalle.map((i) => i.prodID));

    // 2. Filtrar EstatusOP
    const filteredEstatusOP = (data.estatusOP || []).filter((item) => {
      const matchOp = validOpSet.size === 0 ? true : validOpSet.has(item.prodID);
      const matchSize = !selectedSize || item.size === selectedSize;
      return matchOp && matchSize;
    });

    // 3. Unidades de 1ra Calidad
    const piezasPrimera = filteredDetalle.reduce((acc, item) => acc + (item.qty || 0), 0);
    const cajasUnicas = new Set(filteredDetalle.map((item) => item.box)).size;

    // 4. Unidades Irregulares desde EstatusOP
    let unidadesSegundas = 0;
    let unidadesTerceras = 0;

    filteredEstatusOP.forEach((item) => {
      const c1 = Number(item.costura1) || 0;
      const t1 = Number(item.textil1) || 0;
      const c2 = Number(item.costura2) || 0;
      const t2 = Number(item.textil2) || 0;

      unidadesSegundas += (c1 + t1);
      unidadesTerceras += (c2 + t2);
    });

    const totalIrregulares = unidadesSegundas + unidadesTerceras;
    const granTotalPiezas = piezasPrimera + totalIrregulares;

    // 5. Agrupación por OP Padre + OP + Artículo + Color + Talla
    const agrupadoMap = new Map<string, ResumenTallaColor>();

    filteredDetalle.forEach((item) => {
      const parent = item.prodCutSheetID || item.prodID || 'N/A';
      const key = `${parent}-${item.prodID}-${item.itemID}-${item.color}-${item.size}`;
      
      if (!agrupadoMap.has(key)) {
        agrupadoMap.set(key, {
          parentOp: parent,
          op: item.prodID,
          articulo: item.itemID || 'N/A',
          color: item.color,
          talla: item.size,
          totalCajas: 0,
          totalPiezas: 0,
        });
      }
      const entry = agrupadoMap.get(key)!;
      entry.totalPiezas += item.qty || 0;
      entry.totalCajas += 1;
    });

    const resumenAgrupado = Array.from(agrupadoMap.values());

    return {
      filteredDetalle,
      filteredEstatusOP,
      piezasPrimera,
      totalCajasDetalle: cajasUnicas,
      unidadesSegundas,
      unidadesTerceras,
      totalIrregulares,
      granTotalPiezas,
      resumenAgrupado,
      // Conteos de filas
      cantFilasResumen: resumenAgrupado.length,
      cantFilasDetalle: filteredDetalle.length,
      cantFilasEstatus: filteredEstatusOP.length,
    };
  }, [data, selectedParentOp, selectedItem, selectedColor, selectedSize]);

  return (
    <div className="consulta-container">
      {/* HEADER PRINCIPAL */}
      <div className="despacho-header">
        <h1>Reporte y Consulta de Despacho</h1>
        <p>Consolidado general de unidades de 1ra calidad e irregulares filtrado por OP Padre, Artículo, Color y Talla.</p>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            {loading ? <span>Generando Reporte...</span> : <span>Consultar</span>}
          </button>
        </form>

        {/* CONTROLES DE FILTROS DENTRO DEL DESPACHO */}
        {data && (
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="select-parent-op" className="filter-label">OP Padre :</label>
              <select
                id="select-parent-op"
                className="filter-select"
                value={selectedParentOp}
                onChange={(e) => setSelectedParentOp(e.target.value)}
              >
                <option value="">Todas ({availableParentOps.length})</option>
                {availableParentOps.map((pOp) => (
                  <option key={pOp} value={pOp}>{pOp}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="select-item" className="filter-label">Código Artículo:</label>
              <select
                id="select-item"
                className="filter-select"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
              >
                <option value="">Todos ({availableItems.length})</option>
                {availableItems.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="select-color" className="filter-label">Color:</label>
              <select
                id="select-color"
                className="filter-select"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                <option value="">Todos ({availableColors.length})</option>
                {availableColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="select-size" className="filter-label">Talla:</label>
              <select
                id="select-size"
                className="filter-select"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Todas ({availableSizes.length})</option>
                {availableSizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {(selectedParentOp || selectedItem || selectedColor || selectedSize) && (
              <button
                className="btn-clear-filters"
                onClick={() => {
                  setSelectedParentOp('');
                  setSelectedItem('');
                  setSelectedColor('');
                  setSelectedSize('');
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="alert-box alert-error">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RESULTADOS Y PANEL DE REPORTERÍA */}
      {data && reportMetrics && (
        <>
          {/* TARJETAS DE KPIs RECALCULADOS EN TIEMPO REAL */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-title">Unidades 1ra Calidad</span>
              <span className="kpi-value text-primary">{reportMetrics.piezasPrimera.toLocaleString()}</span>
              <span className="kpi-subtext">{reportMetrics.totalCajasDetalle} Cajas registradas</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Unidades 2da Calidad</span>
              <span className="kpi-value text-warning">{reportMetrics.unidadesSegundas.toLocaleString()}</span>
              <span className="kpi-subtext">Textil 1 + Costura 1</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Unidades 3ra Calidad</span>
              <span className="kpi-value text-danger">{reportMetrics.unidadesTerceras.toLocaleString()}</span>
              <span className="kpi-subtext">Textil 2 + Costura 2</span>
            </div>

            <div className="kpi-card highlight-kpi">
              <span className="kpi-title">GRAN TOTAL UNIDADES</span>
              <span className="kpi-value text-success">{reportMetrics.granTotalPiezas.toLocaleString()}</span>
              <span className="kpi-subtext">
                {reportMetrics.piezasPrimera.toLocaleString()} 1ra + {reportMetrics.totalIrregulares.toLocaleString()} Irregulares
              </span>
            </div>
          </div>

          {/* CABECERA RESUMIDA */}
          <div className="cabecera-card">
            <h2 className="cabecera-title">Datos de Cabecera - Despacho #{despachoId}</h2>
            <div className="cabecera-grid">
              <div className="info-box">
                <span className="info-label">Almacén:</span>
                <span className="info-value">{data.cabecera?.almacen || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Motorista / Transporte:</span>
                <span className="info-value">{data.cabecera?.driver || 'N/A'} - {data.cabecera?.truck || 'N/A'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Cajas 2da / 3ra (Cabecera):</span>
                <span className="info-value">{data.cabecera?.cajaSegundas ?? 0} / {data.cabecera?.cajasTerceras ?? 0}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Usuario Creador:</span>
                <span className="info-value">{data.cabecera?.userCreated || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* NAV DE PESTAÑAS CON CONTEO DE FILAS */}
          <div className="tabs-navigation">
            <button
              className={`tab-button ${activeTab === 'resumenOP' ? 'active' : ''}`}
              onClick={() => setActiveTab('resumenOP')}
            >
              Resumen por OP Padre / Artículo / Color / Talla ({reportMetrics.cantFilasResumen} filas)
            </button>
            <button
              className={`tab-button ${activeTab === 'detalle' ? 'active' : ''}`}
              onClick={() => setActiveTab('detalle')}
            >
              Detalle por Cajas ({reportMetrics.cantFilasDetalle} filas)
            </button>
            <button
              className={`tab-button ${activeTab === 'estatus' ? 'active' : ''}`}
              onClick={() => setActiveTab('estatus')}
            >
              Estatus Unidades OP ({reportMetrics.cantFilasEstatus} filas)
            </button>
          </div>

          {/* TABLAS CON SCROLL Y CONTEO DE FILAS EN FOOTER */}
          <div className="table-wrapper">
            {/* TAB 1: RESUMEN REPORTERÍA */}
            {activeTab === 'resumenOP' && (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>OP Padre (CutSheet)</th>
                      <th>OP Producción</th>
                      <th>Código Artículo</th>
                      <th>Color</th>
                      <th>Talla</th>
                      <th className="text-right">Cajas</th>
                      <th className="text-right">Unidades 1ra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportMetrics.resumenAgrupado.length > 0 ? (
                      reportMetrics.resumenAgrupado.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: '#1e293b' }}>{row.parentOp}</td>
                          <td>{row.op}</td>
                          <td>{row.articulo}</td>
                          <td>{row.color}</td>
                          <td>{row.talla}</td>
                          <td className="text-right">{row.totalCajas}</td>
                          <td className="text-right bold-qty">{row.totalPiezas.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="empty-row">No hay datos coincidentes con los filtros.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="subtotal-row">
                      <td colSpan={5}>
                        SUBTOTAL UNIDADES 1RA CALIDAD 
                        <span className="row-count-badge">({reportMetrics.cantFilasResumen} filas)</span>
                      </td>
                      <td className="text-right">{reportMetrics.totalCajasDetalle} Cajas</td>
                      <td className="text-right bold-qty">{reportMetrics.piezasPrimera.toLocaleString()} Pzs</td>
                    </tr>
                    <tr className="subtotal-row warning-row">
                      <td colSpan={6}>TOTAL UNIDADES IRREGULARES (2DAS Y 3RAS)</td>
                      <td className="text-right bold-qty">{reportMetrics.totalIrregulares.toLocaleString()} Pzs</td>
                    </tr>
                    <tr className="total-row gran-total-row">
                      <td colSpan={6}>GRAN TOTAL GENERAL DESPACHO (1RA + IRREGULARES)</td>
                      <td className="text-right bold-qty">{reportMetrics.granTotalPiezas.toLocaleString()} Pzs</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 2: DETALLE INDIVIDUAL */}
            {activeTab === 'detalle' && (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Caja</th>
                      <th>OP Padre (CutSheet)</th>
                      <th>Código Artículo</th>
                      <th>OP Producción</th>
                      <th>Color</th>
                      <th>Talla</th>
                      <th className="text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportMetrics.filteredDetalle.length > 0 ? (
                      reportMetrics.filteredDetalle.map((item, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 600 }}>{item.box}</td>
                          <td style={{ fontWeight: 700, color: '#1e293b' }}>{item.prodCutSheetID || 'N/A'}</td>
                          <td>{item.itemID}</td>
                          <td>{item.prodID}</td>
                          <td>{item.color}</td>
                          <td>{item.size}</td>
                          <td className="text-right bold-qty">{item.qty}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="empty-row">No hay cajas correspondientes a estos filtros.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="subtotal-row">
                      <td colSpan={6}>
                        TOTAL UNIDADES 1RA CALIDAD 
                        <span className="row-count-badge">({reportMetrics.cantFilasDetalle} filas)</span>
                      </td>
                      <td className="text-right bold-qty">{reportMetrics.piezasPrimera.toLocaleString()} Pzs</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 3: ESTATUS DE UNIDADES */}
            {activeTab === 'estatus' && (
              <div className="table-scroll-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número de OP</th>
                      <th>Talla</th>
                      <th className="text-center bg-col1">Costura 1 (2da)</th>
                      <th className="text-center bg-col1">Textil 1 (2da)</th>
                      <th className="text-center bg-col2">Costura 2 (3ra)</th>
                      <th className="text-center bg-col2">Textil 2 (3ra)</th>
                      <th className="text-right">Total Irregulares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportMetrics.filteredEstatusOP.length > 0 ? (
                      reportMetrics.filteredEstatusOP.map((item, index) => {
                        const totalFila = (Number(item.costura1) || 0) + 
                                          (Number(item.textil1) || 0) + 
                                          (Number(item.costura2) || 0) + 
                                          (Number(item.textil2) || 0);
                        return (
                          <tr key={index}>
                            <td style={{ fontWeight: 600, color: '#111827' }}>{item.prodID}</td>
                            <td>{item.size}</td>
                            <td className="text-center bg-col1">{item.costura1}</td>
                            <td className="text-center bg-col1">{item.textil1}</td>
                            <td className="text-center bg-col2">{item.costura2}</td>
                            <td className="text-center bg-col2">{item.textil2}</td>
                            <td className="text-right bold-qty">{totalFila}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="empty-row">No hay registros de estatus para los filtros seleccionados.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="subtotal-row">
                      <td colSpan={2}>
                        TOTALES POR CATEGORÍA 
                        <span className="row-count-badge">({reportMetrics.cantFilasEstatus} filas)</span>
                      </td>
                      <td className="text-center bg-col1 font-bold">{reportMetrics.filteredEstatusOP.reduce((a, b) => a + (Number(b.costura1) || 0), 0)}</td>
                      <td className="text-center bg-col1 font-bold">{reportMetrics.filteredEstatusOP.reduce((a, b) => a + (Number(b.textil1) || 0), 0)}</td>
                      <td className="text-center bg-col2 font-bold">{reportMetrics.filteredEstatusOP.reduce((a, b) => a + (Number(b.costura2) || 0), 0)}</td>
                      <td className="text-center bg-col2 font-bold">{reportMetrics.filteredEstatusOP.reduce((a, b) => a + (Number(b.textil2) || 0), 0)}</td>
                      <td className="text-right bold-qty">{reportMetrics.totalIrregulares.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultaDespacho;