
import { useMemo, useRef, useState, ChangeEvent, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    DiffFiltro,
    ConfiguracionPrecioItem,
    DiffRow,
    DiffStatus,
    Modo,
    FiltrosTexto,
    FiltrosNumericos,
    Spinner,
    IcoUpload,
    IcoSave,
    IcoFile,
    IcoRefresh,
    IcoX,
    IcoCheck,
    IcoAlert,
    IcoDatabase,
    IcoFilter,
    IcoEditar,
    IcoDownload,
    IcoPlus,
}
    from '../../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface';
import { ConfiguracionPrecioApi } from '../../api/ConfiguracionPrecioApi';
// @ts-ignore
import './ConfiguracionPrecioCodigosScreen.css';
import { ModalEdicion } from './ModalEdicionConfiguracionPrecioScreen';
import { GestionTallasModal } from './GestionTallasModal';
import { TallaInfoHover } from './TallaInfoHover';
import { TallaConfiguracionPrecioDto, IcoRuler } from '../../interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface';
import { CategoriaClienteBaseModal } from './CategoriaClienteBaseModal';
import { IcoSearch } from '../../interfaces/GeneracionPrecioCodigos/CategoriaPorClienteBaseInterface';


// ── Helpers ───────────────────────────────────────────────────────────────────
const rowKey = (r: ConfiguracionPrecioItem) =>
    `${r.categoria}|${r.cuenta}|${r.coleccion}|${r.subcategoria}|${r.base}|${r.idColor}|${r.talla}`

function computeDiff(anterior: ConfiguracionPrecioItem[], nuevo: ConfiguracionPrecioItem[]): DiffRow[] {
    // Build map of anterior by key for quick lookup
    const mapAnt = new Map(anterior.map(r => [rowKey(r), r]))
    const rows: DiffRow[] = []

    // Process nuevo in order and include duplicates as separate rows
    const seenKeys = new Set<string>()
    for (const n of nuevo) {
        const k = rowKey(n)
        const a = mapAnt.get(k) ?? null
        if (a) {
            const changed = a.costo !== n.costo || a.precio !== n.precio || a.margen.toFixed(2) !== n.margen.toFixed(2)
            rows.push({ status: changed ? 'modificado' : 'sin-cambios', anterior: a, nuevo: n })
        } else {
            rows.push({ status: 'nuevo', anterior: null, nuevo: n })
        }
        seenKeys.add(k)
    }

    // Solo se marcan como "eliminado" las filas cuya cuenta sí viene incluida en el
    // archivo importado. Si el import es parcial (solo trae algunas cuentas), las filas
    // de cuentas que no aparecen en absoluto en el import no se tocan (no se dan de baja).
    const cuentasNuevo = new Set(nuevo.map(n => n.cuenta))
    for (const a of anterior) {
        const k = rowKey(a)
        if (!seenKeys.has(k) && cuentasNuevo.has(a.cuenta)) {
            rows.push({ status: 'eliminado', anterior: a, nuevo: null })
        }
    }

    const order: DiffStatus[] = ['eliminado', 'modificado', 'nuevo', 'sin-cambios']
    return rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
}


const FILAS_POR_PAGINA = 15

const FILTROS_TEXTO_INI: FiltrosTexto = { categoria: '', cuenta: '', coleccion: '', subcategoria: '', base: '', idColor: '', talla: '' }
const FILTROS_NUM_INI: FiltrosNumericos = { costoMin: '', costoMax: '', precioMin: '', precioMax: '', margenMin: '', margenMax: '' }

const MODO_LABELS: Record<Modo, string> = {
    consultando: 'Consultando BD…',
    vacio: 'Sin datos en BD',
    datos: 'Datos cargados',
    importando: 'Procesando archivo…',
    revision: 'Revisión pendiente',
    guardando: 'Guardando…',
}

const DIFF_LABEL: Record<DiffStatus, string> = {
    nuevo: 'Nuevo', eliminado: 'Eliminado', modificado: 'Modificado', 'sin-cambios': 'Sin cambios',
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConfiguracionPrecioCodigosScreen() {
    const [modo, setModo] = useState<Modo>('consultando')
    const [datosDB, setDatosDB] = useState<ConfiguracionPrecioItem[]>([])
    const [datosImportados, setDatosImp] = useState<ConfiguracionPrecioItem[]>([])
    const [diffRows, setDiffRows] = useState<DiffRow[]>([])

    const [file, setFile] = useState<File | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const fileInputFirstRef = useRef<HTMLInputElement | null>(null)

    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [filtrosTexto, setFiltrosTexto] = useState<FiltrosTexto>(FILTROS_TEXTO_INI)
    const [filtrosNum, setFiltrosNum] = useState<FiltrosNumericos>(FILTROS_NUM_INI)
    const [pagina, setPagina] = useState(1)

    // ── Modal de edición ──────────────────────────────────────────────────────
    const [itemEditando, setItemEditando] = useState<ConfiguracionPrecioItem | null>(null)
    const [idxEditando, setIdxEditando] = useState<number | null>(null)

    const [diffFiltro, setDiffFiltro] = useState<DiffFiltro>('todos')
    const [diffPagina, setDiffPagina] = useState(1)

    const [duplicatesGroups, setDuplicatesGroups] = useState<Array<{ key: string, rows: ConfiguracionPrecioItem[] }>>([])
    const nuevoItemVacio: ConfiguracionPrecioItem = {id: 0, categoria: '', cuenta: '', coleccion: '', subcategoria: '', base: '', idColor: '', talla: '', costo: 0, precio: 0, margen: 0 }

    // ── Tallas configuradas (Género / Talla / Tipo) ──────────────────────────
    const [tallasConfiguradas, setTallasConfiguradas] = useState<TallaConfiguracionPrecioDto[]>([])
    const [mostrarGestionTallas, setMostrarGestionTallas] = useState(false)

    // ── Consulta de Categoría / Subcategoría / Colección por Cliente + Base ──
    const [mostrarBuscadorCategoria, setMostrarBuscadorCategoria] = useState(false)

    const getTallasConfiguradas = async () => {
        try {
            const resp = await ConfiguracionPrecioApi.getTallasConfiguracionPrecio()
            setTallasConfiguradas(resp.data)
        } catch (err) {
            console.log(err)
        }
    }

    // ── Carga inicial de BD ───────────────────────────────────────────────────
    useEffect(() => {
        getDatosDB()
        getTallasConfiguradas()
    }, [])

    const getDatosDB = async () => {
        setModo('consultando')
        setErrorMsg(null)
        try {
            const response = await ConfiguracionPrecioApi.getConfiguracionPrecio()
            if (response.data.length > 0) {
                setDatosDB(response.data)
                setModo('datos')
            } else {
                setModo('vacio')
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al conectar con el servidor'
            setErrorMsg(msg)
            setModo('vacio')
        }
    }

    // ── Importar ──────────────────────────────────────────────────────────────
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
            setErrorMsg(null)
            setSuccessMsg(null)
        }
    }

    const handleImportar = async (fileArg?: File) => {
        const f = fileArg ?? file
        if (!f) { setErrorMsg('Selecciona un archivo Excel antes de continuar.'); return }
        setModo('importando')
        setErrorMsg(null)

        const formData = new FormData();
        formData.append('file', fileArg ?? file as File);

        try {
            const response = await ConfiguracionPrecioApi.importarPlantillaPreciosExcel(formData)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Error al procesar el archivo Excel.');
            }
            const importadosRaw: ConfiguracionPrecioItem[] = response.data.data ?? []

            setDatosImp(importadosRaw);

            // construir grupos donde haya más de una fila con la misma llave (mostrar todas)
            const grpMap = new Map<string, ConfiguracionPrecioItem[]>()
            for (const it of importadosRaw) {
                const k = rowKey(it)
                const arr = grpMap.get(k) ?? []
                arr.push(it)
                grpMap.set(k, arr)
            }
            const groups = Array.from(grpMap.entries()).filter(([, rows]) => rows.length > 1).map(([key, rows]) => ({ key, rows }))
            setDuplicatesGroups(groups)
            const totalDup = groups.reduce((a, g) => a + g.rows.length, 0)
            // setInitialDuplicateCount(totalDup)

            if (groups.length > 0) {
                setErrorMsg(`Se encontraron ${totalDup} filas duplicadas en la importación. Corrige antes de guardar.`)
            }

            setSuccessMsg(
                `Plantilla importada con éxito. Registros importados: ${response.data.registrosImportados ?? importadosRaw.length ?? 0}.`
            );
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            if (datosDB.length === 0) {
                setDiffRows([])
            } else {
                setDiffRows(computeDiff(datosDB, importadosRaw))
            }

            setModo('revision')
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            if (fileInputFirstRef.current) fileInputFirstRef.current.value = ''
            setDiffFiltro('todos')
            setDiffPagina(1)

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al conectar con el servidor';
            setErrorMsg(msg);
        } finally {
            setModo('revision');
        }

    }

    const handleGuardar = async () => {
        if (duplicatesGroups.length > 0) {
            setErrorMsg('No se puede guardar: existen filas duplicadas en la importación. Corrige la importación antes de guardar.');
            setModo('revision');
            return;
        }

        setModo('guardando');
        setErrorMsg(null);

        const userLogged = 1;

        try {
            if (esPrimeraVez) {
                await ConfiguracionPrecioApi.insertConfiguracionPrecio(datosImportados, userLogged);
            } else {
                // Sincronización basada en los cambios detectados (Diff)
                for (const row of diffRows) {
                    if (row.status === 'nuevo' && row.nuevo) {
                        await ConfiguracionPrecioApi.insertSingleConfiguracionPrecio(row.nuevo, userLogged);
                    } else if (row.status === 'modificado' && row.nuevo) {
                        const itemToUpdate = { ...row.nuevo, id: row.anterior?.id ?? row.nuevo.id };
                        await ConfiguracionPrecioApi.updateSingleConfiguracionPrecio(itemToUpdate, userLogged);
                    } else if (row.status === 'eliminado' && row.anterior?.id) {
                        await ConfiguracionPrecioApi.deleteConfiguracionPrecio(row.anterior.id);
                    }
                }
            }

            // Recargar datos actualizados desde BD
            await getDatosDB();

            setDatosImp([]);
            setDiffRows([]);
            setDuplicatesGroups([]);
            // setInitialDuplicateCount(0);
            setSuccessMsg('Configuración de precios guardada exitosamente en la base de datos.');
            setPagina(1);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Ocurrió un error al guardar los registros en la base de datos.';
            setErrorMsg(msg);
            setModo('revision');
        }
    };

    const handleCancelar = () => {
        setDatosImp([])
        setDiffRows([])
        setModo(datosDB.length > 0 ? 'datos' : 'vacio')
        setErrorMsg(null)
    }

    // ── Edición de fila ───────────────────────────────────────────────────────
    const handleAbrirEdicion = useCallback((item: ConfiguracionPrecioItem, idxEnDB: number) => {
        setItemEditando({ ...item })
        setIdxEditando(idxEnDB)
    }, [])

    const handleGuardarEdicion = useCallback(async (editado: ConfiguracionPrecioItem) => {
        if (idxEditando === null) return;
        const userLogged = 1; // ID del usuario autenticado

        try {
            if (editado.id && editado.id > 0) {
                // Actualización (UPDATE)
                await ConfiguracionPrecioApi.updateSingleConfiguracionPrecio(editado, userLogged);
            } else {
                // Inserción Unitaria (INSERT 1 a 1)
                const response = await ConfiguracionPrecioApi.insertSingleConfiguracionPrecio(editado, userLogged);

                if (response.data.success) {
                    editado.id = response.data.id; // Asignamos el nuevo ID devuelto por la BD
                }
            }

            // Actualizar el estado local
            setDatosDB(prev => {
                const copia = [...prev];
                copia[idxEditando] = editado;
                return copia;
            });

            setSuccessMsg(`Registro guardado exitosamente (ID: ${editado.id})`);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al guardar el registro en el servidor.';
            setErrorMsg(msg);
        } finally {
            setItemEditando(null);
            setIdxEditando(null);
        }
    }, [idxEditando]);

    const handleDeleteItem = useCallback(async (item: ConfiguracionPrecioItem) => {
        setErrorMsg(null);
        const confirmado = window.confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.");
        if (!confirmado) return
        try {
            if (idxEditando === null) return;
            const response = await ConfiguracionPrecioApi.deleteConfiguracionPrecio(item.id ?? 0);
            if (response.data.success) {
                await getDatosDB()
                setSuccessMsg(`Registro eliminado exitosamente (ID: ${item.id})`);
                // Actualizar diffRows después de eliminar la fila importada
               
            } else {
                setErrorMsg(`No se pudo eliminar el registro (ID: ${item.id})`);
            }
            setItemEditando(null)
            setIdxEditando(null)
        } catch (err: any) {
             setItemEditando(null)
        setIdxEditando(null)
            setErrorMsg('Error al eliminar registro')
        }
    }, [idxEditando]);



    const handleCerrarModal = useCallback(() => {
        setItemEditando(null)
        setIdxEditando(null)
    }, [])

    // ── Filtros ───────────────────────────────────────────────────────────────
    const hayFiltros = useMemo(() =>
        [...Object.values(filtrosTexto), ...Object.values(filtrosNum)].some(v => v.trim() !== ''),
        [filtrosTexto, filtrosNum])

    const datosFiltrados = useMemo(() => datosDB.filter(item => {
        const t = filtrosTexto
        const ok =
            item.categoria.toLowerCase().includes(t.categoria.toLowerCase()) &&
            item.cuenta.toLowerCase().includes(t.cuenta.toLowerCase()) &&
            item.coleccion.toLowerCase().includes(t.coleccion.toLowerCase()) &&
            item.subcategoria.toLowerCase().includes(t.subcategoria.toLowerCase()) &&
            item.base.toLowerCase().includes(t.base.toLowerCase()) &&
            item.idColor.toLowerCase().includes(t.idColor.toLowerCase()) &&
            item.talla.toLowerCase().includes(t.talla.toLowerCase())

        const n = filtrosNum
        const costoMin = parseFloat(n.costoMin), costoMax = parseFloat(n.costoMax)
        const precioMin = parseFloat(n.precioMin), precioMax = parseFloat(n.precioMax)
        const margenMin = parseFloat(n.margenMin), margenMax = parseFloat(n.margenMax)

        const okN =
            (isNaN(costoMin) || item.costo >= costoMin) && (isNaN(costoMax) || item.costo <= costoMax) &&
            (isNaN(precioMin) || item.precio >= precioMin) && (isNaN(precioMax) || item.precio <= precioMax) &&
            (isNaN(margenMin) || item.margen >= margenMin) && (isNaN(margenMax) || item.margen <= margenMax)

        return ok && okN
    }), [datosDB, filtrosTexto, filtrosNum])

    const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA))
    const datosPagina = useMemo(() => {
        const i = (pagina - 1) * FILAS_POR_PAGINA
        return datosFiltrados.slice(i, i + FILAS_POR_PAGINA)
    }, [datosFiltrados, pagina])

    const resumen = useMemo(() => {
        const total = datosFiltrados.length
        return {
            total,
            // sumaCosto: datosFiltrados.reduce((a, i) => a + i.costo, 0),
            // sumaPrecio: datosFiltrados.reduce((a, i) => a + i.precio, 0),
            // margenProm: total > 0 ? datosFiltrados.reduce((a, i) => a + i.margen, 0) / total : 0,
        }
    }, [datosFiltrados])

    // Export current dataset or duplicates to Excel (placed after datosFiltrados declaration)
    const handleExportExcel = useCallback((rows?: ConfiguracionPrecioItem[], filename?: string) => {
        try {
            const dataToExport: ConfiguracionPrecioItem[] = rows ?? (modo === 'revision' ? datosImportados : datosFiltrados)
            if (!dataToExport || dataToExport.length === 0) {
                setErrorMsg('No hay datos para exportar.')
                return
            }

            const payload = dataToExport.map(r => ({
                Categoria: r.categoria,
                Cuenta: r.cuenta,
                Coleccion: r.coleccion,
                Subcategoria: r.subcategoria,
                Base: r.base,
                IdColor: r.idColor,
                Talla: r.talla,
                Costo: r.costo,
                Precio: r.precio,
                Margen: r.margen,
            }))

            const wb = XLSX.utils.book_new()
            // origin: 'A2' deja la fila 1 en blanco; el encabezado arranca en la fila 2 y los datos en la 3.
            const ws = XLSX.utils.sheet_add_json({}, payload, { origin: 'A2' })
            XLSX.utils.book_append_sheet(wb, ws, 'Precios')
            const name = filename ?? `export_precios_${Date.now()}.xlsx`
            XLSX.writeFile(wb, name)
            setSuccessMsg(`Exportado ${dataToExport.length} filas a ${name}`)
        } catch (err: any) {
            setErrorMsg('Error al exportar a Excel')
        }
    }, [modo, datosImportados, datosFiltrados])

    // ── Diff ──────────────────────────────────────────────────────────────────
    const diffFiltrados = useMemo(() =>
        diffFiltro === 'todos' ? diffRows : diffRows.filter(r => r.status === diffFiltro),
        [diffRows, diffFiltro])

    const diffTotalPag = Math.max(1, Math.ceil(diffFiltrados.length / FILAS_POR_PAGINA))
    const diffPag_ = Math.min(diffPagina, diffTotalPag)
    const diffVisible = useMemo(() => {
        const i = (diffPag_ - 1) * FILAS_POR_PAGINA
        return diffFiltrados.slice(i, i + FILAS_POR_PAGINA)
    }, [diffFiltrados, diffPag_])

    const diffConteos = useMemo(() => ({
        nuevo: diffRows.filter(r => r.status === 'nuevo').length,
        eliminado: diffRows.filter(r => r.status === 'eliminado').length,
        modificado: diffRows.filter(r => r.status === 'modificado').length,
        'sin-cambios': diffRows.filter(r => r.status === 'sin-cambios').length,
    }), [diffRows])

    const esPrimeraVez = datosDB.length === 0

    // Edición de filas importadas (desde panel de duplicados)
    const [itemEditandoImport, setItemEditandoImport] = useState<ConfiguracionPrecioItem | null>(null)
    const [idxEditandoImport, setIdxEditandoImport] = useState<number | null>(null)

    const handleAbrirEdicionImport = useCallback((item: ConfiguracionPrecioItem, idxEnImport: number) => {
        setItemEditandoImport({ ...item })
        setIdxEditandoImport(idxEnImport)
    }, [])


    const handleGuardarEdicionImport = useCallback((editado: ConfiguracionPrecioItem) => {
        setDatosImp(prev => {
            const copia = [...prev]
            copia[idxEditandoImport!] = editado
            // recompute groups and diff after edit
            const grpMap = new Map<string, ConfiguracionPrecioItem[]>()
            for (const it of copia) {
                const k = rowKey(it)
                const arr = grpMap.get(k) ?? []
                arr.push(it)
                grpMap.set(k, arr)
            }
            const groups = Array.from(grpMap.entries()).filter(([, rows]) => rows.length > 1).map(([key, rows]) => ({ key, rows }))
            setDuplicatesGroups(groups)
            setDiffRows(computeDiff(datosDB, copia))
            return copia
        })
        setSuccessMsg(`Fila importada actualizada.`)
        setItemEditandoImport(null)
        setIdxEditandoImport(null)
    }, [idxEditandoImport, datosDB])

    const handleCerrarModalImport = useCallback(() => {
        setItemEditandoImport(null)
        setIdxEditandoImport(null)
    }, [])

    // ── Render ────────────────────────────────────────────────────────────────
    return (<>
        <div className="page-root">
            <div className="config-precio-container">

                {/* ── Encabezado ── */}
                <header className="config-precio-header">
                    <div className="header-titulo-grupo">
                        <span className="header-icono"><IcoDatabase /></span>
                        <div>
                            <h1>Configuración de Precios por Código</h1>
                            <p>Administración y corrección de precios de productos.</p>
                        </div>
                    </div>

                    <span className={`modo-badge modo-badge--${modo}`}>
                        <span className="modo-badge__dot" />
                        {MODO_LABELS[modo]}
                    </span>
                </header>

                {/* ── Alertas ── */}
                {errorMsg && (
                    <div className="alert-box alert-error fade-in">
                        <IcoAlert /><span>{errorMsg}</span>
                        <button className="alert-close" onClick={() => setErrorMsg(null)}><IcoX /></button>
                    </div>
                )}
                {successMsg && (
                    <div className="alert-box alert-success fade-in">
                        <IcoCheck /><span>{successMsg}</span>
                        <button className="alert-close" onClick={() => setSuccessMsg(null)}><IcoX /></button>
                    </div>
                )}

                {/* ══ CONSULTANDO ══ */}
                {modo === 'consultando' && (
                    <div className="estado-centrado fade-in">
                        <span className="estado-centrado__spinner"><Spinner size={32} /></span>
                        <p className="estado-centrado__titulo">Consultando base de datos…</p>
                    </div>
                )}

                {/* ══ IMPORTANDO ══ */}
                {modo === 'importando' && (
                    <div className="estado-centrado fade-in">
                        <span className="estado-centrado__spinner"><Spinner size={32} /></span>
                        <p className="estado-centrado__titulo">Procesando plantilla Excel…</p>
                        <p className="estado-centrado__sub">Esto puede tomar unos segundos</p>
                    </div>
                )}

                {/* ══ GUARDANDO ══ */}
                {modo === 'guardando' && (
                    <div className="estado-centrado fade-in">
                        <span className="estado-centrado__spinner"><Spinner size={32} /></span>
                        <p className="estado-centrado__titulo">Guardando en base de datos…</p>
                    </div>
                )}

                {/* ══ VACÍO ══ */}
                {modo === 'vacio' && (
                    <div className="estado-vacio fade-in">
                        <div className="estado-vacio__icono">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                                <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            </svg>
                        </div>
                        <div className="estado-vacio__texto">
                            <h2 className="estado-vacio__titulo">Base de datos vacía</h2>
                            <p className="estado-vacio__desc">
                                No hay registros de precios. Importa una plantilla Excel para cargar los datos por primera vez.
                            </p>
                        </div>

                        <div className="import-card">
                            <div className="import-card__icono"><IcoUpload /></div>
                            <div className="import-card__texto">
                                <p className="import-card__titulo">Importar plantilla Excel</p>
                                <p className="import-card__sub">Formato .xlsx o .xls</p>
                            </div>
                            <div className="import-card__acciones">
                                <label className="btn-file-select btn-full" style={{ justifyContent: 'center' }}>
                                    <IcoFile /><span>Seleccionar archivo</span>
                                    <input
                                        ref={fileInputFirstRef}
                                        type="file" accept=".xlsx,.xls"
                                        onChange={e => {
                                            handleFileChange(e)
                                            if (e.target.files?.[0]) setFile(e.target.files[0])
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {file && (
                                    <span className="file-selected-badge">
                                        <IcoFile />{file.name}
                                    </span>
                                )}
                                <button
                                    className="btn-submit btn-full"
                                    onClick={() => handleImportar(file ?? undefined)}
                                    disabled={!file}
                                >
                                    <IcoUpload /><span>Importar y previsualizar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ DATOS ══ */}
                {modo === 'datos' && (
                    <div className="config-precio-body fade-in">

                        {/* Barra de acciones */}
                        <section className="upload-card-header">
                            <div className="header-action-bar">
                                <div className="file-input-group">
                                    <label className="btn-file-select">
                                        <IcoFile /><span>Seleccionar Excel</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file" accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {file && (
                                        <span className="file-selected-badge">
                                            <IcoFile />{file.name}
                                        </span>
                                    )}
                                </div>

                                <button
                                    className="btn-actualizar"
                                    onClick={() => handleImportar()}
                                    disabled={!file}
                                >
                                    <IcoRefresh /><span>Actualizar datos</span>
                                </button>

                                <button
                                    className="btn-submit action-spacer"
                                    disabled={datosFiltrados.length === 0}
                                    onClick={() => handleExportExcel()}
                                >
                                    <IcoDownload /><span>Exportar Excel</span>
                                </button>

                                <button
                                    className="btn-outline"
                                    onClick={() => setMostrarGestionTallas(true)}
                                    title="Ver y administrar las tallas configuradas"
                                >
                                    <IcoRuler /><span>Tallas ({tallasConfiguradas.length})</span>
                                </button>

                                <button
                                    className="btn-outline"
                                    onClick={() => setMostrarBuscadorCategoria(true)}
                                    title="Consultar Categoría / Subcategoría / Colección por Cliente + Base"
                                >
                                    <IcoSearch /><span>Buscar Categoría</span>
                                </button>
                            </div>

                            {file && (
                                <p className="hint-text">
                                    Al importar se comparará la plantilla con los datos actuales antes de guardar.
                                </p>
                            )}
                        </section>

                        {/* Filtros */}
                        <div className="filtros-container">
                            <button
                                className="filtros-toggle-btn"
                                onClick={() => setMostrarFiltros(v => !v)}
                                type="button"
                            >
                                <div className="filtros-toggle-info">
                                    <IcoFilter />
                                    <span className="titulo">Filtros de búsqueda</span>
                                    {hayFiltros && <span className="badge-activo">Activos</span>}
                                </div>
                                <span className={`chevron${mostrarFiltros ? ' chevron--abierto' : ''}`}>▼</span>
                            </button>

                            {mostrarFiltros && (
                                <div className="filtros-bar">
                                    {([
                                        ['Categoría', 'categoria'],
                                        ['Cuenta', 'cuenta'],
                                        ['Colección', 'coleccion'],
                                        ['Subcategoría', 'subcategoria'],
                                        ['Base', 'base'],
                                        ['IdColor', 'idColor'],
                                        ['Talla', 'talla'],
                                    ] as [string, keyof FiltrosTexto][]).map(([label, key]) => (
                                        <div className="filtro-grupo" key={key}>
                                            <label>{label}</label>
                                            <input
                                                type="text" placeholder="Filtrar…" value={filtrosTexto[key]}
                                                onChange={e => { setFiltrosTexto(p => ({ ...p, [key]: e.target.value })); setPagina(1) }}
                                            />
                                        </div>
                                    ))}

                                    {(['costo', 'precio', 'margen'] as const).map(base => (
                                        <div className="filtro-grupo filtro-rango" key={base}>
                                            <label>{base.charAt(0).toUpperCase() + base.slice(1)}</label>
                                            <div className="filtro-rango-inputs">
                                                <input type="number" placeholder="Min"
                                                    value={filtrosNum[`${base}Min` as keyof FiltrosNumericos]}
                                                    onChange={e => { setFiltrosNum(p => ({ ...p, [`${base}Min`]: e.target.value })); setPagina(1) }}
                                                />
                                                <input type="number" placeholder="Max"
                                                    value={filtrosNum[`${base}Max` as keyof FiltrosNumericos]}
                                                    onChange={e => { setFiltrosNum(p => ({ ...p, [`${base}Max`]: e.target.value })); setPagina(1) }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        className="btn-limpiar"
                                        onClick={() => { setFiltrosTexto(FILTROS_TEXTO_INI); setFiltrosNum(FILTROS_NUM_INI); setPagina(1) }}
                                        disabled={!hayFiltros}
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="btn-submit btn-full" 
                        onClick={() => handleAbrirEdicion(nuevoItemVacio, 0) }
                        >
                            <IcoPlus />
                            <span>Nuevo registro</span>
                        </button>

                        {/* Tabla */}
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Categoría</th>
                                        <th>Cuenta</th>
                                        <th>Colección</th>
                                        <th>Subcategoría</th>
                                        <th>Base</th>
                                        <th>IdColor</th>
                                        <th>Talla</th>
                                        <th className="col-num">Costo</th>
                                        <th className="col-num">Precio</th>
                                        <th className="col-num">Margen</th>
                                        <th className="col-acciones"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datosPagina.length > 0 ? datosPagina.map((item, i) => {
                                        const idxGlobal = datosDB.indexOf(item)
                                        return (
                                            <tr key={item.id ?? i}>
                                                <td>{item.categoria}</td>
                                                <td className="td-id">{item.cuenta}</td>
                                                <td>{item.coleccion}</td>
                                                <td>{item.subcategoria}</td>
                                                <td>{item.base}</td>
                                                <td>{item.idColor}</td>
                                                <td><TallaInfoHover talla={item.talla} tallas={tallasConfiguradas} /></td>
                                                <td className="col-num">{item.costo.toFixed(2)}</td>
                                                <td className="col-num">{item.precio.toFixed(2)}</td>
                                                <td className="col-num">{item.margen.toFixed(2)}</td>
                                                <td className="col-acciones">
                                                    <button
                                                        className="btn-editar-fila"
                                                        title="Editar fila"
                                                        onClick={() => handleAbrirEdicion(item, idxGlobal)}
                                                    >
                                                        <IcoEditar />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={11} className="empty-row">
                                                {datosDB.length === 0
                                                    ? 'No hay datos en base de datos.'
                                                    : 'No hay resultados con los filtros aplicados.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <footer className="config-precio-footer">
                            <div className="footer-resumen">
                                {[
                                    ['Registros', resumen.total.toString()],
                                    // ['Suma Costo', resumen.sumaCosto.toFixed(2)],
                                    // ['Suma Precio', resumen.sumaPrecio.toFixed(2)],
                                    // ['Margen Prom.', `${resumen.margenProm.toFixed(2)}%`],
                                ].map(([label, val]) => (
                                    <div className="resumen-item" key={label}>
                                        <span className="resumen-label">{label}</span>
                                        <span className="resumen-valor">{val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="footer-paginacion">
                                <button
                                    className="btn-paginacion"
                                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                                    disabled={pagina === 1}
                                >← Anterior</button>
                                <span className="paginacion-info">Página {pagina} de {totalPaginas}</span>
                                <button
                                    className="btn-paginacion"
                                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                                    disabled={pagina === totalPaginas}
                                >Siguiente →</button>
                            </div>
                        </footer>
                    </div>
                )}

                {/* ══ REVISIÓN ══ */}
                {modo === 'revision' && (
                    <div className="config-precio-body fade-in">

                        {/* Cabecera de revisión */}
                        <div className={`revision-header${esPrimeraVez ? ' revision-header--primera' : ''}`}>
                            <div className="revision-header__top">
                                <div>
                                    <h2 className="revision-header__titulo">
                                        {esPrimeraVez
                                            ? 'Confirmar primera carga de datos'
                                            : 'Revisión de cambios antes de guardar'}
                                    </h2>
                                    <p className="revision-header__desc">
                                        {esPrimeraVez
                                            ? `Se van a guardar ${datosImportados.length} registros por primera vez en la base de datos.`
                                            : 'Revisa las diferencias entre los datos actuales y la plantilla importada. Confirma para aplicar los cambios.'}
                                    </p>
                                </div>
                                <div className="revision-header__acciones">
                                    <button className="btn-cancelar" onClick={handleCancelar}>
                                        <IcoX /><span>Cancelar</span>
                                    </button>
                                    <button className="btn-guardar" onClick={handleGuardar} disabled={duplicatesGroups.length > 0} title={duplicatesGroups.length > 0 ? 'Corrige los duplicados antes de guardar' : undefined}>
                                        <IcoSave /><span>Confirmar y guardar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Chips de filtro (solo en modo actualización) */}
                            {!esPrimeraVez && (
                                <div className="diff-chips">
                                    {(['todos', 'nuevo', 'modificado', 'eliminado', 'sin-cambios'] as const).map(tipo => {
                                        const count = tipo === 'todos' ? diffRows.length : diffConteos[tipo]
                                        const activo = diffFiltro === tipo
                                        return (
                                            <button
                                                key={tipo}
                                                className={`diff-chip diff-chip--${tipo}${activo ? ' diff-chip--activo' : ''}`}
                                                onClick={() => { setDiffFiltro(tipo); setDiffPagina(1) }}
                                            >
                                                {tipo === 'todos' ? 'Todos' : DIFF_LABEL[tipo]}
                                                <span className="diff-chip__count">{count}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Tabla de revisión */}
                        {/* Panel de duplicados detectados */}
                        {duplicatesGroups.length > 0 && (
                            <div className="duplicates-panel">
                                <div className="duplicates-header">
                                    <strong>Se detectaron {duplicatesGroups.reduce((a, g) => a + g.rows.length, 0)} filas duplicadas en {duplicatesGroups.length} grupos</strong>
                                    <div className="duplicates-actions">
                                        <span style={{ color: '#92400e', fontSize: 13 }}>Corrige las filas duplicadas antes de guardar.</span>
                                    </div>
                                </div>
                                <div className="duplicates-list">
                                    {duplicatesGroups.map((g, gi) => (
                                        <div key={g.key} className="duplicate-group">
                                            <div className="duplicate-group__key">Llave: {g.key}</div>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Categoría</th><th>Cuenta</th><th>Colección</th><th>Subcategoría</th>
                                                        <th>Base / Color / Talla</th>
                                                        <th className="col-num">Costo</th>
                                                        <th className="col-num">Precio</th>
                                                        <th className="col-num">Margen</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {g.rows.map((d, ii) => {
                                                        const idxInImport = datosImportados.indexOf(d)
                                                        return (
                                                            <tr key={ii} className="duplicate-row">
                                                                <td>{ii + 1}</td>
                                                                <td>{d.categoria}</td>
                                                                <td className="td-id">{d.cuenta}</td>
                                                                <td>{d.coleccion}</td>
                                                                <td>{d.subcategoria}</td>
                                                                <td className="td-secundario">{d.base} / {d.idColor} / {d.talla}</td>
                                                                <td className="col-num">{d.costo.toFixed(2)}</td>
                                                                <td className="col-num">{d.precio.toFixed(2)}</td>
                                                                <td className="col-num">{d.margen.toFixed(2)}</td>
                                                                <td className="col-acciones">
                                                                    <button className="btn-editar-fila" title="Editar fila importada" onClick={() => handleAbrirEdicionImport(d, idxInImport)}>
                                                                        <IcoEditar />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="table-wrapper">
                            {esPrimeraVez ? (
                                // Primera carga: tabla simple
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Categoría</th><th>Cuenta</th><th>Colección</th>
                                            <th>Subcategoría</th><th>Base</th><th>IdColor</th><th>Talla</th>
                                            <th className="col-num">Costo</th>
                                            <th className="col-num">Precio</th>
                                            <th className="col-num">Margen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datosImportados
                                            .slice((diffPag_ - 1) * FILAS_POR_PAGINA, diffPag_ * FILAS_POR_PAGINA)
                                            .map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.categoria}</td>
                                                    <td className="td-id">{item.cuenta}</td>
                                                    <td>{item.coleccion}</td>
                                                    <td>{item.subcategoria}</td>
                                                    <td>{item.base}</td>
                                                    <td>{item.idColor}</td>
                                                    <td>{item.talla}</td>
                                                    <td className="col-num">{item.costo.toFixed(2)}</td>
                                                    <td className="col-num">{item.precio.toFixed(2)}</td>
                                                    <td className="col-num">{item.margen.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : (
                                // Actualización: tabla de diff
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Estado</th>
                                            <th>Categoría</th><th>Cuenta</th><th>Colección</th>
                                            <th>Subcategoría</th>
                                            <th>Base / Color / Talla</th>
                                            <th className="col-num">Costo</th>
                                            <th className="col-num">Precio</th>
                                            <th className="col-num">Margen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {diffVisible.length === 0 ? (
                                            <tr><td colSpan={9} className="empty-row">No hay filas con este filtro.</td></tr>
                                        ) : diffVisible.map((row, i) => {
                                            const src = row.nuevo ?? row.anterior!
                                            const ant = row.anterior
                                            const nvo = row.nuevo

                                            const NumCell = ({ field }: { field: 'costo' | 'precio' | 'margen' }) => {
                                                if (row.status === 'modificado' && ant && nvo && ant[field] !== nvo[field]) {
                                                    return (
                                                        <div className="val-par">
                                                            <span className="val-anterior">{ant[field].toFixed(2)}</span>
                                                            <span className="val-nuevo">{nvo[field].toFixed(2)}</span>
                                                        </div>
                                                    )
                                                }
                                                return <>{(nvo ?? ant)![field].toFixed(2)}</>
                                            }

                                            return (
                                                <tr key={i} className={`diff-row--${row.status}`}>
                                                    <td>
                                                        <span className={`diff-badge diff-badge--${row.status}`}>
                                                            <span className="diff-badge__dot" />
                                                            {DIFF_LABEL[row.status]}
                                                        </span>
                                                    </td>
                                                    <td>{src.categoria}</td>
                                                    <td className="td-id">{src.cuenta}</td>
                                                    <td>{src.coleccion}</td>
                                                    <td>{src.subcategoria}</td>
                                                    <td className="td-secundario">{src.base} / {src.idColor} / {src.talla}</td>
                                                    <td className="col-num"><NumCell field="costo" /></td>
                                                    <td className="col-num"><NumCell field="precio" /></td>
                                                    <td className="col-num"><NumCell field="margen" /></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}

                            <div className="table-footer-bar">
                                <span>
                                    {esPrimeraVez
                                        ? `${datosImportados.length} registros a guardar`
                                        : `${diffFiltrados.length} filas`}
                                </span>
                                <div className="footer-paginacion">
                                    <button
                                        className="btn-paginacion"
                                        onClick={() => setDiffPagina(p => Math.max(1, p - 1))}
                                        disabled={diffPag_ === 1}
                                    >← Anterior</button>
                                    <span className="paginacion-info">Página {diffPag_} de {diffTotalPag}</span>
                                    <button
                                        className="btn-paginacion"
                                        onClick={() => setDiffPagina(p => Math.min(diffTotalPag, p + 1))}
                                        disabled={diffPag_ === diffTotalPag}
                                    >Siguiente →</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {itemEditando && (
            <ModalEdicion
                item={itemEditando}
                onGuardar={handleGuardarEdicion}
                onCerrar={handleCerrarModal}
                onDelete={handleDeleteItem}
            />
        )}
        {itemEditandoImport && (
            <ModalEdicion
                item={itemEditandoImport}
                onGuardar={handleGuardarEdicionImport}
                onCerrar={handleCerrarModalImport}
                // onDelete={handleDeleteImpoItem}
            />
        )}
        {mostrarGestionTallas && (
            <GestionTallasModal
                tallas={tallasConfiguradas}
                onCerrar={() => setMostrarGestionTallas(false)}
                onCambio={setTallasConfiguradas}
            />
        )}
        {mostrarBuscadorCategoria && (
            <CategoriaClienteBaseModal
                onCerrar={() => setMostrarBuscadorCategoria(false)}
            />
        )}
    </>
    )
}
