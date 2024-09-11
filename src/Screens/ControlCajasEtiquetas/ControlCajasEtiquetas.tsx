
import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ControlCajaEtiquetadoFiltro, ControlCajasEtiquetadoDetalleInterface, ControlCajasEtiquetadoDetalleInterfaceS } from '../../interfaces/ControlCajasFiltro/ControlCajasFiltro';

const ControlCajasEtiquetas = () => {
    const [data, setData] = useState<ControlCajasEtiquetadoDetalleInterfaceS[]>([])

    const [cargando, setCargando] = useState<boolean>(false)
    const [descargando, setDescargando] = useState<boolean>(false)
    const [page, setPage] = useState<number>(0)
    const [pedido, setPedido] = useState<string>('')
    const [ruta, setRuta] = useState<string>('')
    const [BoxNum, setBoxNum] = useState<string>('')
    const [Lote, setlote] = useState<string>('')
    const [Empleado, setEmpleado] = useState<string>('')
    const [totalPages, setTotalPages] = useState<number>(1)

    const getData = async () => {
        setCargando(true)
        try {
            let filtro: ControlCajaEtiquetadoFiltro = {
                pedido: pedido,
                ruta: ruta,
                boxNum: BoxNum,
                lote: Lote,
                empleado: Empleado,
                page,
                size: 50
            }
            await WmSApi.post<ControlCajasEtiquetadoDetalleInterface[]>('ControlCajasEtiquetado', filtro).then(resp => {
                //setData(resp.data)
                setTotalPages(resp.data[0].paginas)
                let datos: ControlCajasEtiquetadoDetalleInterfaceS[] = []
                resp.data.map(x => {
                    let dato: ControlCajasEtiquetadoDetalleInterfaceS = {
                        ...x,
                        tiempo: x.tiempo.toString().slice(11,19)
                    }
                    datos.push(dato)
                })
                setData(datos)
            })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const handleDownload = async () => {
        setDescargando(true)
        let datos: ControlCajasEtiquetadoDetalleInterface[] = []
        try {
            let filtro: ControlCajaEtiquetadoFiltro = {
                pedido: pedido,
                ruta: ruta,
                boxNum: BoxNum,
                lote: Lote,
                empleado: Empleado,
                page,
                size: 200000
            }
            await WmSApi.post<ControlCajasEtiquetadoDetalleInterface[]>('ControlCajasEtiquetado', filtro).then(resp => {
                datos = resp.data
            })
            // Convertir el JSON en una hoja de cálculo
            const worksheet = XLSX.utils.json_to_sheet(datos);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

            // Generar el archivo de Excel y crear un Blob
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

            // Usar file-saver para descargar el archivo
            saveAs(blob, 'ControlCajasEtiquetas.xlsx');
        } catch (err) {

        }


        setDescargando(false)
    };

    const columns: Column<ControlCajasEtiquetadoDetalleInterfaceS>[] = useMemo(
        () => [
            {
                Header: 'Pedido',
                accessor: 'pedido',
            },
            {
                Header: 'Ruta',
                accessor: 'ruta',
            },
            {
                Header: 'Codigo Caja',
                accessor: 'codigoCaja',
            },
            {
                Header: 'Numero Caja',
                accessor: 'numeroCaja',
            },
            {
                Header: 'Unidades',
                accessor: 'unidades',
            },
            {
                Header: 'Linea',
                accessor: 'bfplineid',
            },
            {
                Header: 'Temporada',
                accessor: 'temporada',
            },
            {
                Header: 'Inicio',
                accessor: 'inicio',
            },
            {
                Header: 'Fin',
                accessor: 'fin',
            },
            {
                Header: 'Tiempo',
                accessor: 'tiempo',
            },
            {
                Header: 'Empleado',
                accessor: 'empleado',
            }
        ], []
    )

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        rows,
    } = useTable(
        {
            columns,
            data
        }
    );

    useEffect(() => {
        getData()
    }, [page])
    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Control Cajas etiquetado</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
                <div>
                    <label htmlFor="pedido" style={{ marginRight: '10px' }}>Pedido:</label>
                    <input
                        type="text"
                        id="pedido"
                        value={pedido}
                        onChange={(e) => setPedido(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="ruta" style={{ marginRight: '10px' }}>Ruta:</label>
                    <input
                        type="text"
                        id="ruta"
                        value={ruta}
                        onChange={(e) => setRuta(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="boxNum" style={{ marginRight: '10px' }}>Codigo Caja:</label>
                    <input
                        type="text"
                        id="boxNum"
                        value={BoxNum}
                        onChange={(e) => setBoxNum(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="lote" style={{ marginRight: '10px' }}>Lote:</label>
                    <input
                        type="text"
                        id="lote"
                        value={Lote}
                        onChange={(e) => setlote(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="empleado" style={{ marginRight: '10px' }}>Empleado:</label>
                    <input
                        type="text"
                        id="empleado"
                        value={Empleado}
                        onChange={(e) => setEmpleado(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="page" style={{ marginRight: '10px' }}>Pagina:</label>
                    <input
                        type="number"
                        id="page"
                        value={page + 1}
                        min={1}
                        max={totalPages + 1}
                        step={1}
                        onChange={(e) => setPage(parseInt(e.target.value != '' ? e.target.value : '0') - 1)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '30px',
                        }}
                    />
                    <span>/{totalPages + 1}</span>
                </div>
                <button
                    onClick={() => {
                        getData()
                        setPage(0)
                    }
                    }
                    disabled={cargando}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: cargando ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Actualizar
                </button>
                <button
                    onClick={handleDownload}
                    disabled={descargando}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: descargando ? '#ccc' : '#007bff',
                        color: 'white',
                        cursor: descargando ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Descargar
                </button>
            </div>

            <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th
                                    {...column.getHeaderProps()}
                                    style={{ borderBottom: 'solid 3px red', background: 'aliceblue', padding: '10px' }}
                                >
                                    {column.render('Header')}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {cargando ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center' }}> <div className="spinner"></div></td>
                        </tr>
                    ) : (
                        rows.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => (
                                        <td
                                            {...cell.getCellProps()}
                                            style={{ padding: '10px', border: 'solid 1px gray' }}
                                        >
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default ControlCajasEtiquetas

