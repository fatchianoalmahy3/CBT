import * as XLSX from 'xlsx';
import { ModuleSchema } from '../core/types';
import { getVisibleFields } from '../core/formatters';

export interface ParsedImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

export class ExcelService {
  /**
   * Helper untuk membuat ID acak ramah Firestore
   */
  public static generateUniqueId(prefix = 'doc'): string {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const timeStamp = Date.now().toString(36).substring(4);
    return `${prefix}_${timeStamp}${randomSuffix}`;
  }

  /**
   * Export records to .xlsx file based on Module Schema
   */
  public static exportToExcel(schema: ModuleSchema, data: any[], filenamePrefix?: string) {
    // Filter out technical id field via standardized helper
    const visibleFields = getVisibleFields(schema);

    // Map data rows according to schema fields
    const exportRows = data.map((item, index) => {
      const row: Record<string, any> = {
        'No': index + 1
      };

      visibleFields.forEach((field) => {
        const val = item[field.key];
        if (field.type === 'location' && val) {
          row[field.label] = typeof val === 'object' ? (val.name || `${val.lat}, ${val.lng}`) : String(val);
        } else if (field.type === 'richtext' && val) {
          // Strip HTML tags for clean excel output
          row[field.label] = String(val).replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        } else if (field.type === 'number' && val !== undefined && val !== null) {
          row[field.label] = Number(val);
        } else {
          row[field.label] = val !== undefined && val !== null ? String(val) : '';
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto calculate column widths
    const columnWidths = Object.keys(exportRows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...exportRows.map((r) => String(r[key] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, schema.title.slice(0, 31));

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${filenamePrefix || schema.id}_export_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Generate an empty template .xlsx with header columns & sample row for user to fill
   */
  public static downloadTemplate(schema: ModuleSchema) {
    const headerRow: Record<string, any> = {};
    const sampleRow: Record<string, any> = {};

    const importableFields = getVisibleFields(schema);

    importableFields.forEach((field) => {
      headerRow[field.label] = field.label;
      if (field.type === 'number') {
        sampleRow[field.label] = 100000;
      } else if (field.type === 'select' && field.options && field.options.length > 0) {
        sampleRow[field.label] = field.options[0];
      } else if (field.type === 'location') {
        sampleRow[field.label] = 'HQ Jakarta Pusat (Sudirman)';
      } else {
        sampleRow[field.label] = `Contoh ${field.label}`;
      }
    });

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: Object.keys(headerRow) });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');

    XLSX.writeFile(workbook, `template_import_${schema.id}.xlsx`);
  }

  /**
   * Parse uploaded .xlsx file against the Module Schema
   */
  public static async parseExcelFile(file: File, schema: ModuleSchema): Promise<ParsedImportRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawJson || rawJson.length === 0) {
            resolve([]);
            return;
          }

          // Build mapping dictionary from Label or Key to Schema Field
          const labelToFieldMap = new Map<string, typeof schema.fields[0]>();
          schema.fields.forEach((f) => {
            labelToFieldMap.set(f.label.toLowerCase().trim(), f);
            labelToFieldMap.set(f.key.toLowerCase().trim(), f);
          });

          const results: ParsedImportRow[] = rawJson.map((row, idx) => {
            // Auto generate ID
            const parsedData: Record<string, any> = {
              id: ExcelService.generateUniqueId(schema.id.substring(0, 3))
            };
            const errors: string[] = [];

            // Map each row key to schema
            Object.entries(row).forEach(([colHeader, cellValue]) => {
              const matchedField = labelToFieldMap.get(colHeader.toLowerCase().trim());
              if (matchedField && matchedField.key !== 'id') {
                let formattedVal: any = cellValue;
                if (matchedField.type === 'number') {
                  const n = Number(cellValue);
                  formattedVal = isNaN(n) ? cellValue : n;
                } else if (matchedField.type === 'location' && typeof cellValue === 'string') {
                  formattedVal = { lat: -6.2088, lng: 106.8456, name: cellValue };
                }
                parsedData[matchedField.key] = formattedVal;
              }
            });

            // Validate against schema
            schema.fields.forEach((f) => {
              if (f.key === 'id') return;

              const val = parsedData[f.key];
              if (f.validation?.required && (val === undefined || val === null || val === '')) {
                errors.push(`Kolom '${f.label}' wajib diisi.`);
              }
              if (f.type === 'number' && val !== undefined && val !== null && val !== '') {
                if (isNaN(Number(val))) {
                  errors.push(`Kolom '${f.label}' harus berupa angka numerik.`);
                }
              }
            });

            return {
              rowNumber: idx + 2, // Excel row numbering
              data: parsedData,
              errors,
              isValid: errors.length === 0
            };
          });

          resolve(results);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}
