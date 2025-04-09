import { useTable, Column } from 'react-table';
import { Impresoras, ListTelasFilter, ParmsFilter, PickingDefecto, TelasFilterByReference } from './ReceptionTela.types';
import { useEffect, useMemo, useState } from 'react';
import { WmSApi } from '../../api/WMSapi';
import styles from './styles.module.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReceptionTela = () => {

    const [data, setData] = useState<ListTelasFilter[]>([]);
    const [detailByReference, setDetailByReference] = useState<TelasFilterByReference | null>(null);
    const [listDefecto, setListDefecto] = useState<PickingDefecto[]>([]);
    const [listImpresoras, setListImpresoras] = useState<Impresoras[]>([]);
    const [ipPrinter, setIpPrinter] = useState<string>('');
    const [isPrinter, setIsPrinter] = useState(false);

    const [paramsFiler, setParamsFiler] = useState<ParmsFilter>({
        "journalId": "REC-",
        "color": null,
        "inventBatchId": null,
        "inventSerialId": null,
        "isScanning": null,
        "telaPickingDefectoId": null,
        "reference": null,
        "ubicacion": null,
        "vendRoll": null,
        "configId": null,
        "pageNumber": 1,
        "pageSize": 30
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isDowloadExcel, setIsDowloadExcel] = useState(false);
    const [totalPages, setTotalPages] = useState<number>(0);

    const columns: Column<ListTelasFilter>[] = useMemo(
        () => [
            { Header: 'Diario', accessor: 'journalid' },
            { Header: 'Importación', accessor: 'inventBatchId' },
            { Header: 'Artículo', accessor: 'itemId' },
            { Header: 'Referencia', accessor: 'reference' },
            { Header: 'Color', accessor: 'nameColor' },
            { Header: 'Número de rollo', accessor: 'inventserialid' },
            { Header: 'Número de rollo proveedor', accessor: 'vendroll' },
            { Header: 'Configuracion', accessor: 'configid' },
            { Header: 'Cantidad', accessor: 'qty', Cell: ({ value }) => (<>{value.toFixed(2)}</>) },
            { Header: 'Ubicación', accessor: 'location' },
            { Header: 'Descripción del Defecto', accessor: 'descriptionDefecto' },
            {
                Header: 'Escaneando',
                accessor: 'is_scanning',
                Cell: ({ value }) => (
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: value ? 'green' : 'orange',
                            display: 'inline-block'
                        }}
                    ></div>
                )
            },
            { Header: 'Fecha de Actualización', accessor: 'update_date' },
            { Header: 'Escaneado por', accessor: 'user' },
        ], []
    );

    const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows, } = useTable(
        { columns, data }
    );

    const getListTelasFilter = async (pageNumber?: number, customFiler?: ParmsFilter) => {
        try {
            const params = customFiler ? customFiler : paramsFiler;
            if (pageNumber) {
                params.pageNumber = pageNumber;
            }
            const response = await WmSApi.post<ListTelasFilter[]>('MWMS_RecTela/GetListTelasFilter', { ...params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    const postPrintEtiquetas = async (ipPrinter:string, rollosToPrint: ListTelasFilter[]) =>{
        try {
            const response = await WmSApi.post(`MWMS_RecTela/PostPrintEtiquetasTela/${ipPrinter}`, rollosToPrint);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    const getDataList = async () => {
        try {
            const pickingDefecto = (await WmSApi.get<PickingDefecto[]>('MWMS_RecTela/GetTelaPickingDefecto')).data;
            const impresoras = (await WmSApi.get<Impresoras[]>('Impresoras')).data;
            return { pickingDefecto, impresoras };
        } catch (error) {
            throw error;
        }
    }

    const getListTelasFilterByReference = async () => {
        try {
            const response = await WmSApi.post<TelasFilterByReference>('MWMS_RecTela/GetListTelasFilterByReference', { ...paramsFiler });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    const updateParam = (key: keyof ParmsFilter, value: number | string | boolean | null) => {
        setParamsFiler(prevState => {
            switch (key) {
                case "journalId":
                case "color":
                case "vendRoll":
                case "ubicacion":
                case "color":
                case "inventBatchId":
                case "inventSerialId":
                case "configId":
                case "telaPickingDefectoId":
                case "reference":
                    return { ...prevState, [key]: value };
                case "isScanning":
                    return { ...prevState, isScanning: Boolean(value) };
                case "pageNumber":
                case "pageSize":
                    return { ...prevState, [key]: Number(value) };
                default:
                    console.warn(`Clave no reconocida: ${key}`);
                    return prevState;
            }
        });
    };

    const getData = (pageNumber?: number) => {

        setIsLoading(true);

        getListTelasFilter(pageNumber)
            .then((response => {
                setData(response);
                setTotalPages(response.length >= 1 ? response[0].totalRecords : 0);
                setIsLoading(false);

                if (paramsFiler.reference) {
                    getListTelasFilterByReference()
                        .then((data) => {
                            setDetailByReference(data);
                        })
                        .catch(() => {
                            setDetailByReference(null);
                        })

                } else {
                    setDetailByReference(null);
                }

            }))
            .catch(() => {
                setIsLoading(false);
            })


    }

    useEffect(() => {
        setIsLoading(true);
        getDataList()
            .then((data) => {
                setListDefecto(data.pickingDefecto);
                setListImpresoras(data.impresoras);
                getData();
            })
            .catch(() => {
                getData();
            })
    }, [])

    const setPage = (nextPage: number | null) => {

        setParamsFiler({ ...paramsFiler, pageNumber: nextPage });
        getData(nextPage ?? 1);
    }

    const dowloadExcel = () => {
        setIsDowloadExcel(true);

        let customFilter = { ...paramsFiler };
        customFilter.pageSize = totalPages;

        getListTelasFilter(1, customFilter)
            .then(response => {
                const columnsToExclude: (keyof ListTelasFilter)[] = ['rowNum', 'totalRecords', 'telaPickingDefectoId'];

                const columnMappings: Record<string, string> = {
                    "journalid": "Diario",
                    "inventBatchId": "Importación",
                    "itemId": "Artículo",
                    "reference": "Referencia",
                    "nameColor": "Color",
                    "inventserialid": "Número de rollo",
                    "vendroll": "Número de rollo proveedor",
                    "qty": "Cantidad",
                    "location": "Ubicación",
                    "descriptionDefecto": "Descripción del Defecto",
                    "is_scanning": "Escaneando",
                    "update_date": "Fecha de Actualización",
                    "user": "Escaneando por"
                };

                const filteredData = response.map(item => {
                    let newItem: Record<string, any> = {};

                    (Object.keys(item) as (keyof ListTelasFilter)[]).forEach(key => {
                        if (!columnsToExclude.includes(key)) {
                            const newKey = columnMappings[key] || key;
                            newItem[newKey] = item[key];
                        }
                    });

                    return newItem;
                });


                const worksheet = XLSX.utils.json_to_sheet(filteredData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

                saveAs(blob, `RecepcionTelas-${new Date().getTime()}.xlsx`);
                setIsDowloadExcel(false);
            })
            .catch(() => {
                setIsDowloadExcel(false);
            })
    }

    const printRollos = () => {
        setIsPrinter(true);
        let customFilter = { ...paramsFiler,  };
        customFilter.pageSize = totalPages;
        customFilter.isScanning = true;

        getListTelasFilter(1, customFilter)
        .then(data=>{
            postPrintEtiquetas(ipPrinter, data)
            .then((data)=>{
                setIsPrinter(false);
            })
            .catch(()=>{
                setIsPrinter(false);
                alert('No se pudo imprimir la etiqueta. Si el problema persiste, contacte con soporte. ');
            })
        })
        .catch(()=>{
            setIsPrinter(false);
        })
    }

    return <div style={{ paddingBottom: '1rem' }}>
        <h2 style={{ textAlign: 'center' }}>Recepción de Telas</h2>


        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '1rem', }}  >

            {/** Inputs*/}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'start', flex: '1', flexDirection: 'row' }} >

                <div style={{ display: 'grid' }}>
                    <label htmlFor="journalId" style={{ marginRight: '10px' }}>Diario:</label>
                    <input
                        type="text"
                        id="journalId"
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('journalId', value);
                        }}
                        className={styles.input}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="inventBatchId" style={{ marginRight: '10px' }}>Importación:</label>
                    <input
                        type="text"
                        id="inventBatchId"
                        className={styles.input}
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('inventBatchId', value);
                        }}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="reference" style={{ marginRight: '10px' }}>Referencia:</label>
                    <input
                        type="text"
                        id="reference"
                        className={styles.input}
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('reference', value);
                        }}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="color" style={{ marginRight: '10px' }}>Color:</label>
                    <input
                        type="text"
                        id="color"
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('color', value);
                        }}
                        className={styles.input}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="inventSerialId" style={{ marginRight: '10px' }}>Número de rollo:</label>
                    <input
                        type="text"
                        id="inventSerialId"
                        className={styles.input}
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('inventSerialId', value);
                        }}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="vendRoll" style={{ marginRight: '10px', }}>Numero de rollo proveedor:</label>
                    <input
                        type="text"
                        id="vendRoll"
                        onChange={(e) => {
                            const value = e.target.value;
                            console.log({ value })
                            updateParam('vendRoll', value);
                        }}
                        className={styles.input}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor="configId" style={{ marginRight: '10px' }}>Configuracion:</label>
                    <input
                        type="text"
                        id="configId"
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('configId', value);
                        }}
                        className={styles.input}
                    />
                </div>

                <div style={{ display: 'grid' }}>
                    <label htmlFor='ubicacion' style={{ marginRight: '10px' }}>Ubicacion:</label>
                    <input
                        type="text"
                        id='ubicacion'
                        onChange={(e) => {
                            const value = e.target.value;
                            updateParam('ubicacion', value);
                        }}
                        className={styles.input}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection:'column' }}>
                    <label htmlFor="telaPickingDefectoId" style={{ marginRight: '10px' }}>Defecto:</label>
                    <select  style={{flex: '1'}} id='telaPickingDefectoId' value={paramsFiler.telaPickingDefectoId ?? ""} onChange={(e) => {
                        updateParam('telaPickingDefectoId', e.target.value);
                    }}>
                        <option value="" disabled>Seleccione un defecto</option>
                        {listDefecto.map(defecto => (
                            <option key={defecto.telaPickingDefectoId} value={defecto.telaPickingDefectoId}>
                                {defecto.descriptionDefecto}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.checkboxw}>
                    <label htmlFor="c1-13">Escaneado:</label>
                    <input id="c1-13" type='checkbox' onChange={(e => {
                        updateParam('isScanning', e.target.checked)
                    })} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', gridColumn: 'span 3 / -1' }} >
                    {/** Paginador*/}
                    <div style={{ display: 'flex', }} >
                        <label htmlFor="page" style={{ marginRight: '10px' }}>Pagina:</label>
                        <input
                            type="number"
                            id="page"
                            value={paramsFiler.pageNumber ?? 0}
                            min={1}
                            max={Math.ceil(totalPages / paramsFiler.pageSize)}
                            step={1}
                            onChange={(e) => setPage(parseInt(e.target.value != '' ? e.target.value : '0'))}
                            style={{
                                height: 'fit-content',
                                padding: '4px 2px 4px 2px',
                                marginRight: '2px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '30px',
                            }}
                        />
                        <div>{`/ ${Math.ceil(totalPages / paramsFiler.pageSize)} `}</div>
                    </div>

                    {/** Actions*/}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} >
                        <button
                            onClick={() => { getData(1) }}
                            disabled={isLoading}
                            className={`${styles.button} ${isLoading ? styles.loading : ''}`}
                        >
                            Actualizar
                        </button>

                        <button
                            onClick={() => { dowloadExcel() }}
                            disabled={isDowloadExcel}
                            className={`${styles.button} ${isDowloadExcel ? styles.loading : ''}`}
                        >
                            Descargar excel
                        </button>
                    </div>
                    <div style={{ borderLeft: '2px solid lightgray', paddingLeft: '8px', display: 'flex', gap: '2px',  }} >

                        <div style={{ display: 'grid' }}>
                            <select id='iM_IPPRINTER'  value={ipPrinter ?? ""} onChange={(e) => {
                                setIpPrinter(e.target.value);
                            }}>
                                <option value="" disabled>Impresora</option>
                                {listImpresoras.map(defecto => (
                                    <option key={defecto.iM_IPPRINTER} value={defecto.iM_IPPRINTER}>
                                        {defecto.iM_DESCRIPTION_PRINTER}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={printRollos}
                            disabled={((ipPrinter?.length < 1 || isPrinter) ? true : false )}
                            className={`${styles.button} ${(ipPrinter?.length < 1 || isPrinter) ? styles.loading : ''}`}
                        >
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>

        </section>

        {detailByReference && (
            <div style={{ display: "flex", gap: "12px", marginBottom: '1rem' }}>
                <div style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "8px", minWidth: "100px" }}>
                    <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>{detailByReference?.totalCantidad.toFixed(2)}</p>
                    <p style={{ fontSize: "12px", color: "#666", margin: "0" }}>yd /  lbs</p>
                </div>
                <div style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "8px", minWidth: "100px" }}>
                    <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>{detailByReference?.totalRollos}</p>
                    <p style={{ fontSize: "12px", color: "#666", margin: "0" }}>Rollos</p>
                </div>
            </div>
        )}

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
                {isLoading ? (
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center' }}> <div className="spinner"></div></td>
                    </tr>
                ) : (
                    rows.map(row => {
                        prepareRow(row);
                        return (
                            <tr  {...row.getRowProps()}>
                                {row.cells.map((cell) => (
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
}

export default ReceptionTela;