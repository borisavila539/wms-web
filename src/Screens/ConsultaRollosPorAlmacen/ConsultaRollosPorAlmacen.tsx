import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { InventarioRolloInterface } from "../../interfaces/ConsultaRollosPorAlmacen/InventarioRolloInterface"
// TypeScript may not have declarations for CSS modules in this project.
// Ignore the missing module/type error for this side-effect import.
// @ts-ignore
import "./inventario-rollos.css"
import { WMSConsultaRolloApi } from "../../api/WMSConsultaRolloApi"

const PAGE_SIZE = 100

type ColumnKey = keyof InventarioRolloInterface

interface ColumnDef {
  key: ColumnKey
  label: string
  numeric?: boolean
  defaultWidth: number
}

const COLUMNS: ColumnDef[] = [
  { key: "articulo", label: "Artículo", defaultWidth: 110 },
  { key: "nombreBusqueda", label: "Nombre", defaultWidth: 180 },
  { key: "color", label: "Color", defaultWidth: 90 },
  { key: "nombreColor", label: "Nombre color", defaultWidth: 150 },
  { key: "ancho", label: "Ancho", defaultWidth: 90 },
  { key: "numeroSerie", label: "N° serie", defaultWidth: 110 },
  { key: "proveedor", label: "Proveedor", defaultWidth: 110 },
  { key: "nombreProveedor", label: "Nombre proveedor", defaultWidth: 180 },
  { key: "lote", label: "Lote", defaultWidth: 100 },
  { key: "ubicacion", label: "Ubicación", defaultWidth: 110 },
  { key: "inventarioFisico", label: "Físico", numeric: true, defaultWidth: 100 },
  { key: "fisicoReservada", label: "Reservada", numeric: true, defaultWidth: 100 },
]

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 4,
})

function formatValue(value: string | number, numeric?: boolean): string {
  if (numeric && typeof value === "number") return numberFormatter.format(value)
  return value === "" || value === null || value === undefined ? "—" : String(value)
}

/* ---------- Iconos SVG inline ---------- */
function IconPackage({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="inv-spin" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconRefresh({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

function IconAlert({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

function IconExcel({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M10 9h2" />
    </svg>
  )
}

export function ConsultaRollosPorAlmacen() {
  const [almacenInput, setAlmacenInput] = useState("21")
  const [almacenCargado, setAlmacenCargado] = useState<string | null>(null)
  const [data, setData] = useState<InventarioRolloInterface[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>({})
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => {
    const initialWidths = {} as Record<ColumnKey, number>
    COLUMNS.forEach((col) => {
      initialWidths[col.key] = col.defaultWidth
    })
    return initialWidths
  })

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const cargarInventario = useCallback(async () => {
    const almacen = almacenInput.trim()
    if (!almacen) {
      setError("Ingresa un número de almacén.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await WMSConsultaRolloApi.get<InventarioRolloInterface[]>(
        `ConsultarInventarioRollosPorAlmacen/${almacen}`,
      )
      setData(Array.isArray(result.data) ? result.data : [])
      setAlmacenCargado(almacen)
      setFilters({})
      setVisibleCount(PAGE_SIZE)
      scrollRef.current?.scrollTo({ top: 0 })
    } catch (err) {
      setData([])
      setAlmacenCargado(null)
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario.")
    } finally {
      setLoading(false)
    }
  }, [almacenInput])

  const setFilter = useCallback((key: ColumnKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setVisibleCount(PAGE_SIZE)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setVisibleCount(PAGE_SIZE)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [])

  const handleMouseDown = (key: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = columnWidths[key]

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      setColumnWidths((prev) => ({
        ...prev,
        [key]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Filtrado en cliente
  const filtered = useMemo(() => {
    const activeEntries = Object.entries(filters).filter(([, v]) => v && v.trim() !== "")
    if (activeEntries.length === 0) return data
    return data.filter((row) =>
      activeEntries.every(([key, value]) => {
        const cell = row[key as ColumnKey]
        return String(cell ?? "")
          .toLowerCase()
          .includes(value.trim().toLowerCase())
      }),
    )
  }, [data, filters])

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = visibleCount < filtered.length

  useEffect(() => {
    if (!hasMore) return
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
        }
      },
      { root: scrollRef.current, rootMargin: "300px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, filtered.length])

  const activeFilterCount = Object.values(filters).filter((v) => v && v.trim() !== "").length

  const totalFisico = useMemo(
    () => filtered.reduce((acc, r) => acc + (r.inventarioFisico || 0), 0),
    [filtered],
  )
  const totalReservada = useMemo(
    () => filtered.reduce((acc, r) => acc + (r.fisicoReservada || 0), 0),
    [filtered],
  )

  // FUNCIÓN PARA EXPORTAR LOS RESULTADOS FILTRADOS A EXCEL (CSV UTF-8)
  const exportarExcel = () => {
    if (filtered.length === 0) return

    // 1. Cabeceras del CSV
    const headers = COLUMNS.map(col => col.label).join(";")

    // 2. Filas de datos
    const rows = filtered.map(row => 
      COLUMNS.map(col => {
        const cellValue = row[col.key];
        
        // Si el valor es nulo o indefinido ponemos cadena vacía
        if (cellValue === null || cellValue === undefined) return "";
        
        // Convertimos a string y escapamos las comillas dobles duplicándolas
        let stringValue = String(cellValue);
        
        // Reemplazamos saltos de línea para que no rompa las celdas de Excel
        stringValue = stringValue.replace(/\r?\n|\r/g, " ");

        // Si el valor contiene punto y coma, comillas o comas, lo envolvemos en comillas dobles
        if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes(",")) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(";")
    )

    // 3. Añadimos el BOM de UTF-8 (\uFEFF) para que Excel reconozca eñes y acentos
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n")

    // 4. Crear el archivo Blob y disparar la descarga en el navegador
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Inventario_Rollos_Almacen_${almacenCargado || "Export"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="inv-root">
      <header className="inv-header">
        <div className="inv-header-bar">
          <div className="inv-title-group">
            <span className="inv-icon-badge">
              <IconPackage />
            </span>
            <div>
              <h1 className="inv-title">Inventario de Rollos</h1>
              <p className="inv-subtitle">Consulta por almacén y filtra los resultados</p>
            </div>
          </div>

          <form
            className="inv-form"
            onSubmit={(e) => {
              e.preventDefault()
              cargarInventario()
            }}
          >
            <div className="inv-field">
              <label htmlFor="almacen" className="inv-label">
                Almacén
              </label>
              <input
                id="almacen"
                inputMode="numeric"
                value={almacenInput}
                onChange={(e) => setAlmacenInput(e.target.value)}
                placeholder="Ej. 21"
                className="inv-input inv-input-almacen"
              />
            </div>
            <button type="submit" disabled={loading} className="inv-btn">
              {loading ? <IconSpinner /> : <IconSearch />}
              {loading ? "Cargando…" : "Cargar"}
            </button>
          </form>

          <div className="inv-meta">
            {almacenCargado && (
              <div className="inv-badge">
                <span>
                  Almacén <span className="inv-strong">{almacenCargado}</span>
                </span>
                <span>
                  Mostrando{" "}
                  <span className="inv-strong">{visibleRows.length.toLocaleString("es-MX")}</span> de{" "}
                  <span className="inv-strong">{filtered.length.toLocaleString("es-MX")}</span>
                  {filtered.length !== data.length && (
                    <span> ({data.length.toLocaleString("es-MX")} totales)</span>
                  )}
                </span>
              </div>
            )}
            
            {/* Botón de Exportar a Excel */}
            {almacenCargado && filtered.length > 0 && (
              <button 
                type="button" 
                onClick={exportarExcel} 
                className="inv-btn inv-btn-success"
                title="Exportar registros actuales a Excel"
              >
                <IconExcel />
                Exportar Excel
              </button>
            )}

            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="inv-btn inv-btn-ghost">
                <IconRefresh />
                Limpiar filtros ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="inv-error" role="alert">
            <IconAlert />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="inv-scroll">
        {!almacenCargado && !loading && !error ? (
          <div className="inv-empty">
            <IconPackage size={40} />
            <p style={{ margin: 0 }}>
              Ingresa un almacén y presiona Cargar para ver el inventario.
            </p>
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr className="inv-thead-labels">
                {COLUMNS.map((col) => (
                  <th 
                    key={col.key} 
                    scope="col" 
                    className={col.numeric ? "inv-th-numeric" : undefined}
                    style={{ width: columnWidths[col.key], minWidth: columnWidths[col.key], maxWidth: columnWidths[col.key] }}
                  >
                    <div className="inv-th-content">
                      <span className="inv-th-text">{col.label}</span>
                      <div 
                        className="inv-resizer" 
                        onMouseDown={(e) => handleMouseDown(col.key, e)}
                      />
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="inv-thead-filters">
                {COLUMNS.map((col) => (
                  <th 
                    key={col.key}
                    style={{ width: columnWidths[col.key], minWidth: columnWidths[col.key], maxWidth: columnWidths[col.key] }}
                  >
                    <input
                      aria-label={`Filtrar por ${col.label}`}
                      value={filters[col.key] ?? ""}
                      onChange={(e) => setFilter(col.key, e.target.value)}
                      placeholder="Filtrar…"
                      className={`inv-filter-input${col.numeric ? " inv-th-numeric" : ""}`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={`${row.articulo}-${row.color}-${row.ubicacion}-${row.lote}-${i}`}>
                  {COLUMNS.map((col) => (
                    <td 
                      key={col.key} 
                      className={col.numeric ? "inv-td-numeric" : undefined}
                      style={{ 
                        width: columnWidths[col.key], 
                        minWidth: columnWidths[col.key], 
                        maxWidth: columnWidths[col.key],
                        textOverflow: "ellipsis",
                        overflow: "hidden"
                      }}
                    >
                      {formatValue(row[col.key], col.numeric)}
                    </td>
                  ))}
                </tr>
              ))}

              {almacenCargado && filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="inv-no-rows">
                    No hay registros que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>

            {filtered.length > 0 && (
              <tfoot className="inv-tfoot">
                <tr>
                  <td 
                    colSpan={COLUMNS.length - 2} 
                    className="inv-tfoot-label"
                  >
                    Totales ({filtered.length.toLocaleString("es-MX")} registros)
                  </td>
                  <td 
                    className="inv-td-numeric"
                    style={{ 
                      width: columnWidths["inventarioFisico"], 
                      minWidth: columnWidths["inventarioFisico"], 
                      maxWidth: columnWidths["inventarioFisico"] 
                    }}
                  >
                    {numberFormatter.format(totalFisico)}
                  </td>
                  <td 
                    className="inv-td-numeric"
                    style={{ 
                      width: columnWidths["fisicoReservada"], 
                      minWidth: columnWidths["fisicoReservada"], 
                      maxWidth: columnWidths["fisicoReservada"] 
                    }}
                  >
                    {numberFormatter.format(totalReservada)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="inv-sentinel">
            <IconSpinner />
            Cargando más registros…
          </div>
        )}
      </div>
    </div>
  )
}