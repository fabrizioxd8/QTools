import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Tool, Assignment, ToolConditionMap } from '@/contexts/AppDataContext';

// Re-exported so callers don't need to know the internal key maps
export const categoryKeyMap: Record<string, string> = {
  'Electrical': 'electrical',
  'Mechanical': 'mechanical',
  'Safety': 'safety',
  'Measurement': 'measurement',
  'Hand Tools': 'handTools',
  'Power Tools': 'powerTools',
  'Cleaning and Maintenance': 'cleaning',
  'Workstation Equipment': 'workstation',
};

export const statusKeyMap: Record<string, string> = {
  'Available': 'Available',
  'In Use': 'In Use',
  'Damaged': 'Damaged',
  'Lost': 'Lost',
  'Missing': 'Missing',
  'Cal. Due': 'Cal. Due',
};

const standardAttributes = ['Brand', 'Model', 'Serial Number', 'Custom'];
const dedicatedKeys = new Set([
  'Brand', 'Marca', 'brand', 'marca',
  'Model', 'Modelo', 'model', 'modelo',
  'Serial Number', 'Serie', 'serial_number', 'serie',
]);

type InUseEntry = {
  projectName: string;
  qty: number;
  status: 'inUse' | 'missing' | 'damaged' | 'lost';
};

function buildInUseEntries(toolId: number, assignments: Assignment[]): InUseEntry[] {
  const entries: InUseEntry[] = [];
  assignments.forEach(asg => {
    if (asg.status === 'active') {
      asg.tools.forEach(t => {
        if (t.id === toolId && (t.quantity || 1) > 0) {
          entries.push({ projectName: asg.project.name, qty: t.quantity || 1, status: 'inUse' });
        }
      });
    }
    if (asg.status === 'completed' && asg.toolConditions) {
      const cond = asg.toolConditions[toolId];
      if (cond) {
        if (typeof cond === 'object') {
          const missingQty = Number((cond as ToolConditionMap).missing) || 0;
          if (missingQty > 0) entries.push({ projectName: asg.project.name, qty: missingQty, status: 'missing' });
          const damagedQty = Number((cond as ToolConditionMap).damaged) || 0;
          if (damagedQty > 0) entries.push({ projectName: asg.project.name, qty: damagedQty, status: 'damaged' });
          const lostQty = Number((cond as ToolConditionMap).lost) || 0;
          if (lostQty > 0) entries.push({ projectName: asg.project.name, qty: lostQty, status: 'lost' });
        } else {
          const toolInAsg = asg.tools.find(t => t.id === toolId);
          const qty = toolInAsg?.quantity || 1;
          if (cond === 'missing') entries.push({ projectName: asg.project.name, qty, status: 'missing' });
          else if (cond === 'damaged') entries.push({ projectName: asg.project.name, qty, status: 'damaged' });
          else if (cond === 'lost') entries.push({ projectName: asg.project.name, qty, status: 'lost' });
        }
      }
    }
  });
  return entries;
}

function colLetter(n: number): string {
  let s = '';
  let col = n;
  while (col >= 0) {
    s = String.fromCharCode((col % 26) + 65) + s;
    col = Math.floor(col / 26) - 1;
  }
  return s;
}

export interface ExportToolsOptions {
  filteredTools: Tool[];
  assignments: Assignment[];
  statusFilter: string;
  translateCategory: (cat: string) => string;
  translateStatus: (status: string) => string;
  onSuccess: () => void;
  onError: () => void;
}

export function exportToolsToExcel({
  filteredTools,
  assignments,
  statusFilter,
  translateCategory,
  translateStatus,
  onSuccess,
  onError,
}: ExportToolsOptions): void {
  try {
    const data: Record<string, string | number>[] = [];

    filteredTools.forEach(tool => {
      const ext = tool as Tool & {
        availableQuantity?: number;
        inUseQuantity?: number;
        damagedQuantity?: number;
        lostQuantity?: number;
        missingQuantity?: number;
        certificateNumber?: string;
      };

      const {
        availableQuantity = 0,
        inUseQuantity = 0,
        damagedQuantity = 0,
        lostQuantity = 0,
        missingQuantity = 0,
      } = ext;

      const entries = buildInUseEntries(tool.id, assignments);
      const activeAssignments = entries.filter(e => e.status === 'inUse');
      const completedAssignments = entries.filter(e => e.status !== 'inUse');
      const assignedProjectList = Array.from(new Set(activeAssignments.map(e => e.projectName))).join(', ');

      const lastAssignment = [...assignments]
        .filter(asg => asg.tools.some(t => t.id === tool.id))
        .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime())[0];

      const guiaDeRemision = lastAssignment?.guiaNumber || '';

      const lastProjectForStatus = (status: 'damaged' | 'lost' | 'missing'): string => {
        const entry = completedAssignments.find(e => e.status === status);
        return entry ? entry.projectName : (lastAssignment?.project.name || '');
      };

      const standardKeys = standardAttributes.filter(attr => attr !== 'Custom');
      const extraInfo: string[] = [];
      Object.entries(tool.customAttributes).forEach(([key, value]) => {
        if (!standardKeys.includes(key) && !dedicatedKeys.has(key)) {
          extraInfo.push(`${key}: ${value}`);
        }
      });
      const observaciones = extraInfo.join(' | ');

      const buildRow = (
        status: string,
        qty: number,
        projectAssigned: string,
        guia: string,
      ): Record<string, string | number> => ({
        'Instrumento': tool.name,
        'Categoría': translateCategory(tool.category),
        'Marca': tool.customAttributes['Brand'] || tool.customAttributes['Marca'] || '',
        'Modelo': tool.customAttributes['Model'] || tool.customAttributes['Modelo'] || '',
        'Serie': tool.customAttributes['Serial Number'] || tool.customAttributes['Serie'] || '',
        'Estado del Equipo': translateStatus(status),
        'Cantidad': qty,
        'Proyecto Asignado': projectAssigned,
        'Guía de Remisión': guia,
        '¿Requiere Calibración?': tool.isCalibrable ? 'Sí' : 'No',
        'Empresa Certificadora': tool.isCalibrable ? (tool.calibration_company || '') : '',
        'Nº Certificado': ext.certificateNumber || '',
        'Última Calibración': tool.isCalibrable ? (tool.last_calibration_date || '') : '',
        'Frecuencia (Meses)': tool.isCalibrable ? (tool.calibration_frequency_months ?? 12) : '',
        'Próxima Calibración': tool.isCalibrable ? (tool.calibrationDue || '') : '',
        'Observaciones': observaciones,
      });

      if (statusFilter === 'All') {
        let hasExported = false;
        if (availableQuantity > 0) { data.push(buildRow('Available', availableQuantity, '', '')); hasExported = true; }
        if (inUseQuantity > 0) { data.push(buildRow('In Use', inUseQuantity, assignedProjectList, guiaDeRemision)); hasExported = true; }
        if (damagedQuantity > 0) { data.push(buildRow('Damaged', damagedQuantity, lastProjectForStatus('damaged'), guiaDeRemision)); hasExported = true; }
        if (lostQuantity > 0) { data.push(buildRow('Lost', lostQuantity, lastProjectForStatus('lost'), guiaDeRemision)); hasExported = true; }
        if (missingQuantity > 0) { data.push(buildRow('Missing', missingQuantity, lastProjectForStatus('missing'), guiaDeRemision)); hasExported = true; }
        if (!hasExported && tool.quantity) data.push(buildRow(tool.status, tool.quantity, '', ''));
      } else {
        const qty =
          statusFilter === 'Available' ? availableQuantity :
          statusFilter === 'In Use' ? inUseQuantity :
          statusFilter === 'Damaged' ? damagedQuantity :
          statusFilter === 'Lost' ? lostQuantity :
          statusFilter === 'Missing' ? missingQuantity :
          tool.quantity;

        const project =
          statusFilter === 'In Use' ? assignedProjectList :
          ['Damaged', 'Lost', 'Missing'].includes(statusFilter)
            ? lastProjectForStatus(statusFilter.toLowerCase() as 'damaged' | 'lost' | 'missing')
            : '';

        data.push(buildRow(statusFilter, qty || 0, project, guiaDeRemision));
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const numRows = data.length;
    const numCols = data.length > 0 ? Object.keys(data[0]).length : 0;

    if (numRows > 0 && numCols > 0) {
      const lastCol = colLetter(numCols - 1);
      worksheet['!autofilter'] = { ref: `A1:${lastCol}1` };
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

      worksheet['!cols'] = Object.keys(data[0]).map(header => {
        const maxLen = data.reduce((max, row) => {
          const val = row[header];
          return Math.max(max, val != null ? String(val).length : 0);
        }, header.length);
        return { wch: Math.min(maxLen + 2, 50) };
      });

      Object.keys(data[0]).forEach((_, colIdx) => {
        const cellAddr = `${colLetter(colIdx)}1`;
        if (!worksheet[cellAddr]) return;
        worksheet[cellAddr].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F766E' }, patternType: 'solid' },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
          border: { bottom: { style: 'thin', color: { rgb: 'CCCCCC' } } },
        };
      });

      for (let rowIdx = 2; rowIdx <= numRows + 1; rowIdx++) {
        const fillColor = rowIdx % 2 === 0 ? 'E6F4F3' : 'FFFFFF';
        for (let colIdx = 0; colIdx < numCols; colIdx++) {
          const cellAddr = `${colLetter(colIdx)}${rowIdx}`;
          if (!worksheet[cellAddr]) continue;
          worksheet[cellAddr].s = {
            fill: { fgColor: { rgb: fillColor }, patternType: 'solid' },
            alignment: { vertical: 'center' },
            border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } },
          };
        }
      }
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob(
      [excelBuffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' },
    );
    saveAs(blob, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
    onSuccess();
  } catch (error) {
    console.error('Export failed:', error);
    onError();
  }
}
