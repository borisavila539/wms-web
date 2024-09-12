
import React, { useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';

import { GeneracionPrecioCodigoInterface } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';

const GeneracionCodigosPreciosScreen = () => {
    const [data, setData] = useState<GeneracionPrecioCodigoInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [descargando, setDescargando] = useState<boolean>(false)
    const [pais, setPais] = useState<string>('')
    const [pedidoVenta, setPedidoVenta] = useState<string>('')

    const getData = async () => {
        setCargando(true)
        try {

            await WmSApi.get<GeneracionPrecioCodigoInterface[]>(`ObtenerDetalleGeneracionPrecios/${pedidoVenta}/${pais}`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const handleDownload = async (tipo: string) => {
        setDescargando(true)

        try {
            console.log(tipo)
            let url: string = (tipo == 'Detalle' ? 'DescargarDetalleGeneracionPrecios' : 'DescargarConfiguracionGeneracionPrecios')
            await WmSApi.get(`${url}/${pedidoVenta}/${pais}`, {
                responseType: 'blob'
            }).then(resp => {
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', tipo == 'Detalle' ? 'Plantilla.xlsx' : 'ConfiguracionPrecio.xlsx');
                link.click();
                document.body.removeChild(link);
            })
        } catch (err) {

        }
        setDescargando(false)
    };

    const columns: Column<GeneracionPrecioCodigoInterface>[] = useMemo(
        () => [
            {
                Header: 'Cuenta Cliente',
                accessor: 'cuentaCliente',
            },
            {
                Header: 'Pedido Venta',
                accessor: 'pedido',
            },
            {
                Header: 'Codigo barra',
                accessor: 'codigoBarra',
            },
            {
                Header: 'Articulo',
                accessor: 'articulo',
            },
            {
                Header: 'Base',
                accessor: 'base',
            },
            {
                Header: 'Estilo',
                accessor: 'estilo',
            },
            {
                Header: 'IdColor',
                accessor: 'idColor',
            },
            {
                Header: 'Referencia',
                accessor: 'referencia',
            },
            {
                Header: 'Descripcion',
                accessor: 'descripcion',
            },
            {
                Header: 'Color Descripcion',
                accessor: 'colorDescripcion',
            },
            {
                Header: 'Talla',
                accessor: 'talla',
            },
            {
                Header: 'Descripcion2',
                accessor: 'descripcion2',
            },
            {
                Header: 'Categoria',
                accessor: 'categoria',
            },
            {
                Header: 'Cantidad',
                accessor: 'cantidad',
            },
            {
                Header: 'Costo',
                accessor: 'costo',
            },
            {
                Header: 'Precio',
                accessor: 'precio',
            },
            {
                Header: 'Departamento',
                accessor: 'departamento',
            },
            {
                Header: 'SubCategoria',
                accessor: 'subCategoria',
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

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Plantilla Creacion Articulo</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
                <div>
                    <label htmlFor="pedido" style={{ marginRight: '10px' }}>Pedido:</label>
                    <input
                        type="text"
                        id="pedido"
                        value={pedidoVenta}
                        onChange={(e) => setPedidoVenta(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '450px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="pais" style={{ marginRight: '10px' }}>Pais:</label>
                    <input
                        type="text"
                        id="pais"
                        value={pais}
                        onChange={(e) => setPais(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>

                <button
                    onClick={() => {
                        getData()
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
                    onClick={() => handleDownload("Detalle")}
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
                    Descargar Detalle
                </button>
                <button
                    onClick={() => handleDownload("Configuracion")}
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
                    Descargar Config
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
                                <tr {...row.getRowProps()}
                                    style={{
                                        backgroundColor: row.original.precio === 0 ? '#f8d7da' : 'transparent'  // Estilo condicional para la fila
                                    }}>
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

export default GeneracionCodigosPreciosScreen
