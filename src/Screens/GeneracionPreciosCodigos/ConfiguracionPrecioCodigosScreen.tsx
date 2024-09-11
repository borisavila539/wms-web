import React, { useEffect, useMemo, useState } from 'react'
import { WmSApi } from '../../api/WMSapi'
import { useTable, Column } from 'react-table';
import { ConfiguracionPrecioCodigosinterface } from '../../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';

const ConfiguracionPrecioCodigosScreen = () => {
    const [data, setData] = useState<ConfiguracionPrecioCodigosinterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [insertUpdate, setinsertUpdate] = useState<boolean>(false)
    const [cuentaCliente, setCuentaCliente] = useState<string>('')
    const [base, setBase] = useState<string>('')
    const [idColor, setIdColor] = useState<string>('')
    const [Costo, setCosto] = useState<string>('')
    const [precio, setPrecio] = useState<string>('')
    const [modificando, setModificando] = useState<boolean>(false)
    const [file, setFile] = useState<File | null>(null);
    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<ConfiguracionPrecioCodigosinterface[]>(`ObtenerPreciosCodigos/${cuentaCliente != '' ? cuentaCliente : '-'}`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    useEffect(() => {
        getData()
    }, [])

    // Aquí puedes agregar la función de modificar o actualizar
    const handleModificar = (row: ConfiguracionPrecioCodigosinterface) => {
        setModificando(true)
        setCuentaCliente(row.cuentaCliente)
        setBase(row.base)
        setIdColor(row.idColor)
        setCosto(row.costo + '')
        setPrecio(row.precio + '')

    };

    const Limpiar = () => {
        setModificando(false)
        setCuentaCliente('')
        setBase('')
        setIdColor('')
        setCosto('')
        setPrecio('')
    }

    const insertUpdateLine = async () => {
        setinsertUpdate(true)
        let data: ConfiguracionPrecioCodigosinterface = {
            id: 0,
            cuentaCliente,
            base,
            idColor,
            costo: parseFloat(Costo),
            precio: parseFloat(precio)
        }
        try {
            await WmSApi.post<ConfiguracionPrecioCodigosinterface>('ObtenerPreciosCodigos', data).then(resp => {
                if (resp.data.precio.toString() == precio) {
                    getData()
                    Limpiar()
                }
            })
        } catch (err) {

        }
        setinsertUpdate(false)
    }

    const columns: Column<ConfiguracionPrecioCodigosinterface>[] = useMemo(
        () => [
            {
                Header: 'Cuenta Cliente',
                accessor: 'cuentaCliente',
            },
            {
                Header: 'Base',
                accessor: 'base',
            },
            {
                Header: 'IDColor',
                accessor: 'idColor',
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
                Header: 'Acciones',
                Cell: ({ row }: { row: { original: ConfiguracionPrecioCodigosinterface } }) => (
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
                                marginRight: '8px'
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

    const handleFileUpload = async () => {
        if (!file) {
            alert('Por favor selecciona un archivo');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            await WmSApi.post<string>('UploadExcelPreciosCodigos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(resp => {
                if (resp.data == "OK") {
                    alert('Archivo subido exitosamente');
                } else {
                    alert(resp.data);
                }
            })
        } catch (error) {
            console.error('Error al subir el archivo:', error);
        }
        getData()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Configuracion Precios Codigos</h2>
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
                        disabled={modificando}
                    />
                </div>
                <div>
                    <label htmlFor="base" style={{ marginRight: '10px' }}>Base:</label>
                    <input
                        type="text"
                        id="base"
                        value={base}
                        onChange={(e) => setBase(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                        disabled={modificando}
                    />
                </div>
                <div>
                    <label htmlFor="IDColor" style={{ marginRight: '10px' }}>IDColor:</label>
                    <input
                        type="text"
                        id="IDColor"
                        value={idColor}
                        onChange={(e) => setIdColor(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                        disabled={modificando}
                    />
                </div>

                <div>
                    <label htmlFor="costo" style={{ marginRight: '10px' }}>Costo:</label>
                    <input
                        type="text"
                        id="costo"
                        value={Costo}
                        onChange={(e) => setCosto(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="precio" style={{ marginRight: '10px' }}>Precio:</label>
                    <input
                        type="text"
                        id="precio"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100px',
                        }}
                    />
                </div>
                {
                    cuentaCliente && base && idColor && Costo && precio &&
                    <button
                        onClick={() => {
                            insertUpdateLine()

                        }}
                        disabled={insertUpdate}
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
                        {modificando ? 'Actualizar' : 'Agregar'}
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
                    Buscar
                </button>
                <button
                    onClick={() => {

                        Limpiar()
                    }}
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
                    Limpiar
                </button>
                <button
                    onClick={handleFileUpload}
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
                    Subir
                </button>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ marginLeft: '10px' }}
                />

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

export default ConfiguracionPrecioCodigosScreen;
