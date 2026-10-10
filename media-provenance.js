// A fast disclosure check, not a forensic classifier or C2PA signature validator.
// IPTC Digital Source Type values are explicit publisher-supplied declarations.
const MAX_SCAN_BYTES = 2_000_000;

export function inspectMediaProvenance(input, mime = '') {
  const type = String(mime).toLowerCase();
  if (!/^(image|video)\//.test(type)) return null;
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const head = bytes.subarray(0, Math.min(bytes.length, MAX_SCAN_BYTES));
  const tail = bytes.length > MAX_SCAN_BYTES
    ? bytes.subarray(Math.max(MAX_SCAN_BYTES, bytes.length - MAX_SCAN_BYTES))
    : new Uint8Array();
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(head) + decoder.decode(tail);
  if (/compositeWithTrainedAlgorithmicMedia/i.test(text)) {
    return {status:'ai_edited_declared',label:'METADATOS DECLARAN EDICIÓN CON IA',detail:'El archivo incluye el valor IPTC de edición con IA. Es una declaración no autenticada; no prueba qué partes se alteraron.'};
  }
  if (/trainedAlgorithmicMedia/i.test(text)) {
    return {status:'ai_generated_declared',label:'METADATOS DECLARAN GENERACIÓN CON IA',detail:'El archivo incluye el valor IPTC de generación con IA. Es una declaración no autenticada; no sustituye la validación de procedencia.'};
  }
  if (/c2pa|jumb|content.credentials/i.test(text)) {
    return {status:'credentials_unverified',label:'CREDENCIALES DE CONTENIDO SIN VALIDAR',detail:'Se detectó una referencia técnica de procedencia, pero este análisis rápido no valida la firma ni confirma uso de IA.'};
  }
  return {status:'unknown',label:'ORIGEN NO CONFIRMADO',detail:'No se encontró una declaración IPTC de IA en el archivo examinado. Las plataformas pueden retirar metadatos; su ausencia no demuestra autenticidad.'};
}
