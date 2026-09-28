import axios from 'axios'
import { ConfiguracionPrecioUrl } from '../constants/api'
import { ConfiguracionPrecioImportResponse, ConfiguracionPrecioItem, SingleInsertResponse, SpResponseDTO, ConfirmacionGeneracionPrecioDto } from '../interfaces/GeneracionPrecioCodigos/ConfiguracionPrecioInterface';
import { GeneracionPrecioCodigoInterface, ImpresionEtiquetaPrecio, ImpresionPreciosBusquedaForm, ImpresionPreciosSeleccionRequest, ClientesGeneracionPrecio } from '../interfaces/GeneracionPrecioCodigos/GeneracionPrecioCodigoInterface';
import { RespuestaSP, TallaConfiguracionPrecioDto } from '../interfaces/GeneracionPrecioCodigos/TallaConfiguracionPrecioInterface';
import { CategoriaPorClienteBaseDto } from '../interfaces/GeneracionPrecioCodigos/CategoriaPorClienteBaseInterface';
const api = axios.create({
    baseURL: ConfiguracionPrecioUrl
});

export const ConfiguracionPrecioApi = {
    // GET: Obtener lista completa desde BD
    getConfiguracionPrecio: () =>
        api.get<ConfiguracionPrecioItem[]>('GetConfiguracionPrecio'),

    // POST: Importar y parsear Excel
    importarPlantillaPreciosExcel: (formData: FormData) =>
        api.post<ConfiguracionPrecioImportResponse>('ImportarPlantillaPreciosExcel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // POST: Insertar un solo registro
    insertSingleConfiguracionPrecio: (item: ConfiguracionPrecioItem, userId: number) =>
        api.post<SingleInsertResponse>('InsertSingleConfiguracionPrecio', item, { params: { userId } }),
    
    // POST: Insertar un registro
    insertConfiguracionPrecio: (item: ConfiguracionPrecioItem[], userId: number) =>
        api.post<number>('InsertConfiguracionPrecio', item, { params: { userId } }),

    // PUT: Actualizar un registro existente
    updateSingleConfiguracionPrecio: (item: ConfiguracionPrecioItem, userModified: number) =>
        api.post<number>('UpdateSingleConfiguracionPrecio', item, { params: { userModified } }),

    updateConfiguracionPrecio: (item: ConfiguracionPrecioItem[], userModified: number) =>
        api.post<number>('UpdateConfiguracionPrecio', item, { params: { userModified } }),

    // DELETE: Eliminar un registro
    deleteConfiguracionPrecio: (id: number) =>
        api.post<SpResponseDTO>(`DeleteConfiguracionPrecio/${id}`),

    ObtenerDetalleGeneracionPrecios: (pedidoVenta:string, pais:string) =>
        api.get<GeneracionPrecioCodigoInterface[]>(`ObtenerDetalleGeneracionPrecios/${pedidoVenta}/${pais}`),

    // GET: Buscar un pedido cuyo precio ya fue generado/confirmado previamente
    ObtenerPedidoConPrecioConfigurado: (pedidoVenta: string) =>
        api.get<GeneracionPrecioCodigoInterface[]>(`ObtenerPedidoConPrecioConfigurado/${pedidoVenta}`),

    // POST: Confirmar la generación de precio de una sola línea
    ConfirmarGeneracionPrecioLinea: (id: number, usuario: string) =>
        api.post<ConfirmacionGeneracionPrecioDto>(`ConfirmarGeneracionPrecioLinea/${id}/${usuario}`),

    //imprimir codigos de precio
    GetPrecioCodigos: ( params: ImpresionPreciosBusquedaForm) =>
        api.get<ImpresionEtiquetaPrecio[]>('GetPrecioCodigos', {params:params}),

    // POST: Imprimir únicamente las líneas seleccionadas por el usuario
    ImpresionPrecioCodigosSeleccionados: (request: ImpresionPreciosSeleccionRequest) =>
        api.post<string>('ImpresionPrecioCodigosSeleccionados', request),

    // ── Tallas de configuración de precio (Género / Talla / Tipo) ───────────
    getTallasConfiguracionPrecio: () =>
        api.get<TallaConfiguracionPrecioDto[]>('GetTallasConfiguracionPrecio'),

    insertTallaConfiguracionPrecio: (item: TallaConfiguracionPrecioDto) =>
        api.post<RespuestaSP>('InsertTallaConfiguracionPrecio', item),

    updateTallaConfiguracionPrecio: (item: TallaConfiguracionPrecioDto) =>
        api.post<RespuestaSP>('UpdateTallaConfiguracionPrecio', item),

    deleteTallaConfiguracionPrecio: (id: number) =>
        api.post<RespuestaSP>(`DeleteTallaConfiguracionPrecio/${id}`),

    // GET: Categoría / Subcategoría / Colección históricas por Cliente + Base
    obtenerCategoriaPorClienteBase: (cuentaCliente: string, base: string, empresa?: string) =>
        api.get<CategoriaPorClienteBaseDto[]>(
            `ObtenerCategoriaPorClienteBase/${encodeURIComponent(cuentaCliente)}/${encodeURIComponent(base)}`,
            empresa ? { params: { empresa } } : undefined
        ),

    // GET: Clientes registrados para generación de precios
    getClientesGeneracionPrecio: () =>
        api.get<ClientesGeneracionPrecio[]>('ObtenerClientesGeneracionPrecio'),
};