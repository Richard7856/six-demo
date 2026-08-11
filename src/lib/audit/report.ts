import data from "./report.json";
import type { AuditReport } from "./checks";

/**
 * INFORME DE AUDITORÍA — los datos están en report.json, grabados con
 * POST /api/dev/audit. No los edites a mano.
 *
 * La pantalla /auditoria lee esto y nada más: mirar las imágenes con el modelo
 * cuesta dinero, así que se paga una vez al añadir fotos y todos los pases de
 * la demo salen gratis, instantáneos e idénticos.
 */
export const REPORT = data as unknown as AuditReport;

export const HAS_REPORT = REPORT.images.length > 0;
