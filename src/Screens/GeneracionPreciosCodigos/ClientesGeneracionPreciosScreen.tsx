
import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import { ClientesGeneracionPrecio, ImpresionEtiquetaPrecio } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';

const ClientesGeneracionPreciosScreen = () => {
    const [data, setData] = useState<ClientesGeneracionPrecio[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [edit, setEdit] = useState<boolean>(false)
    const [Enviando, setEnviando] = useState<boolean>(false)
    const [cuentaCliente, setCuentaCliente] = useState<string>('')
    const [nombre, setNombre] = useState<string>('')
    const [moneda, setMoneda] = useState<string>('')
    const [decimal, setDecimal] = useState<boolean>(false)



    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<ClientesGeneracionPrecio[]>(`ObtenerClientesGeneracionPrecio`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const getEnviar = async () => {
        setEnviando(true)
        try {
            let tmp: ClientesGeneracionPrecio = {
                cuentaCliente,
                nombre,
                moneda,
                decimal

            }
            await WmSApi.post<ClientesGeneracionPrecio>(`ClientesGeneracionPrecio`, tmp)
                .then(resp => {
                    if (resp.data.cuentaCliente != '') {
                        getData()
                        Limpiar()
                    }
                })
        } catch (err) {
            console.log(err)
        }
        setEnviando(false)
    }

    const Limpiar = () => {
        setCuentaCliente('')
        setNombre('')
        setMoneda('')
        setDecimal(false)
        setEdit(false)
    }

    const handleModificar = (row: ClientesGeneracionPrecio) => {
        setCuentaCliente(row.cuentaCliente)
        setNombre(row.nombre)
        setMoneda(row.moneda)
        setDecimal(row.decimal)
        setEdit(true)

    };
    const columns: Column<ClientesGeneracionPrecio>[] = useMemo(
        () => [
            {
                Header: 'Cuenta Cliente',
                accessor: 'cuentaCliente',
            },
            {
                Header: 'Nombre',
                accessor: 'nombre',
            },
            {
                Header: 'Moneda',
                accessor: 'moneda',
            },
            {
                Header: 'Decimal',
                accessor: 'decimal',
                Cell: ({ row }: { row: { original: ClientesGeneracionPrecio } }) => (
                    <div>
                        <input
                            type="checkbox"
                            checked={row.original.decimal}
                            style={{ marginRight: '10px' }}
                        />
                    </div>
                )
            },
            {
                Header: 'Acciones',
                Cell: ({ row }: { row: { original: ClientesGeneracionPrecio } }) => (
                    <div>
                        <button
                            onClick={() => handleModificar(row.original)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px',

                            }}
                        >
                            Modificar
                        </button>
                    </div>
                )
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
    }, [])
    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Clientes</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>

                <div>
                    <label htmlFor="cuentaCliente" style={{ marginRight: '10px' }}>Cuenta Cliente:</label>
                    <input

                        type="text"
                        id="cuentaCliente"
                        value={cuentaCliente}
                        onChange={(e) => setCuentaCliente(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                        disabled={edit}
                    />
                </div>

                <div>
                    <label htmlFor="Nombre" style={{ marginRight: '10px' }}>Nombre:</label>
                    <input
                        type="text"
                        id="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="Moneda" style={{ marginRight: '10px' }}>Moneda:</label>
                    <input
                        type="text"
                        id="Moneda"
                        value={moneda}
                        onChange={(e) => setMoneda(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div style={{ padding: '10px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={decimal}
                            onChange={() => setDecimal(!decimal)}
                            style={{ marginRight: '10px' }}
                        />
                        Decimal
                    </label>
                </div>
                {
                    cuentaCliente != '' && nombre != '' &&
                    <button
                        onClick={() => {

                            getEnviar()
                        }}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        disabled={Enviando}
                    >
                        Agregar/Modificar
                    </button>
                }

                <button
                    onClick={() => {
                        getData()
                    }}
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
                    onClick={() => {

                        Limpiar()
                    }}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Limpiar
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
                                            style={{ padding: '10px', border: 'solid 1px gray', textAlign: 'center' }}
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

export default ClientesGeneracionPreciosScreen;

