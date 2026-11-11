const WMSurl = 'http://10.100.2.17:8095/api/WMS/' //'http://10.100.2.17:8095/api/WMS/'
const WMSConsultaRolloUrl = 'http://10.100.2.17:8095/api/WMS_UbicacionRollos/';
const WMSDespachoPTUrl = 'http://10.100.2.17:8095/api/IM_WMS_DespachoPT/'
const ConfiguracionPrecioUrl = 'http://10.100.2.17:8095/api/IM_WMS_GeneracionPrecioYCodigos/'
const RecepcionFacturasCDUrl = 'http://10.100.2.17:8095/api/IM_WMS_RecepcionFacturasCD/'
const AuditoriaInternaUrl = 'http://10.100.2.17:8095/api/IM_WMS_AuditoriaInterna/'
// Mott & Bow (comparativo vs AX y liberar cajas). Para probar contra el API local:
// REACT_APP_WMSMB_URL=http://localhost:13274/api/WMSMB/ en el entorno de npm start
const WMSMBUrl = 'http://10.100.2.17:8095/api/WMSMB/'
//const WMSMBUrl = 'http://localhost:13274/api/WMSMB/' //dev
//const ConfiguracionPrecioUrl = 'http://localhost:13274/api/IM_WMS_GeneracionPrecioYCodigos/'//dev
//const WMSDespachoPTUrl = 'http://localhost:13274/api/IM_WMS_DespachoPT/'//dev
//const WMSurl = 'http://localhost:13274/api/WMS/'
//const RecepcionFacturasCDUrl = 'http://10.100.2.17:8095/api/IM_WMS_RecepcionFacturasCD/'
//const RecepcionFacturasCDUrl = 'http://localhost:13274/api/IM_WMS_RecepcionFacturasCD/'//dev
//const AuditoriaInternaUrl = 'http://localhost:13274/api/IM_WMS_AuditoriaInterna/'//dev
export { WMSurl, WMSConsultaRolloUrl,WMSDespachoPTUrl, ConfiguracionPrecioUrl, RecepcionFacturasCDUrl, AuditoriaInternaUrl, WMSMBUrl}
