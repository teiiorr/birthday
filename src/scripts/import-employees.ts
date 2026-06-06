/* eslint-disable no-console -- CLI utility; console output is intended */
/**
 * Bulk-import employees from a CSV file.
 *
 * Expected columns (header row required):
 *   id, full_name, birth_date, birth_month, birth_day, birth_year,
 *   month_name_uz, department_position
 *
 * Uzbek names are "Surname Given Patronymic[ o'g'li/qizi]", so:
 *   lastName  = first token  (surname)
 *   firstName = second token (given name)        -> used in wish prompts
 *   position  = department_position
 * Apostrophes are normalized to correct Uzbek orthography (oʻ/gʻ, tutuq belgisi).
 *
 * The import is idempotent: a person with the same first+last name and birthday
 * is skipped rather than duplicated.
 *
 * Run (production image already contains the compiled output):
 *   node dist/scripts/import-employees.js /path/to/birthdays.csv
 * Or via npm:
 *   npm run import:employees -- /path/to/birthdays.csv
 * For local development without a build:
 *   npx tsx src/scripts/import-employees.ts ./birthdays.csv
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { normalizeUzbekApostrophes } from '../utils/format.util';

const prisma = new PrismaClient();

/** Minimal RFC-4180 CSV parser (handles quoted fields containing commas). */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

interface ParsedRow {
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthMonth: number;
  birthDay: number;
  position: string | null;
}

function toRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    record[header.trim()] = (cells[index] ?? '').trim();
  });
  return record;
}

function parseRow(record: Record<string, string>): ParsedRow | null {
  const fullName = record.full_name;
  const birthDateStr = record.birth_date;
  if (!fullName || !birthDateStr) return null;

  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  const lastName = normalizeUzbekApostrophes(tokens[0] ?? fullName.trim());
  const firstName = normalizeUzbekApostrophes(tokens[1] ?? lastName);

  const dt = DateTime.fromISO(birthDateStr, { zone: 'utc' });
  if (!dt.isValid) {
    console.warn(`[import] Skipping "${fullName}" — invalid birth_date "${birthDateStr}"`);
    return null;
  }

  const position = record.department_position?.trim();

  return {
    firstName,
    lastName,
    birthDate: dt.toJSDate(),
    birthMonth: dt.month,
    birthDay: dt.day,
    position: position ? normalizeUzbekApostrophes(position) : null,
  };
}

async function main(): Promise<void> {
  const path = process.argv[2] ?? './employees.csv';
  console.log(`[import] Reading ${path}`);

  const content = readFileSync(path, 'utf8');
  const rows = parseCsv(content);
  if (rows.length < 2) {
    console.error('[import] No data rows found.');
    process.exitCode = 1;
    return;
  }

  const headers = rows[0];
  let created = 0;
  let skipped = 0;

  for (const cells of rows.slice(1)) {
    const parsed = parseRow(toRecord(headers, cells));
    if (!parsed) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.employee.findFirst({
      where: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        birthMonth: parsed.birthMonth,
        birthDay: parsed.birthDay,
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.employee.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        birthDate: parsed.birthDate,
        birthMonth: parsed.birthMonth,
        birthDay: parsed.birthDay,
        position: parsed.position,
      },
    });
    created += 1;
    console.log(
      `[import] + ${parsed.firstName} ${parsed.lastName} (${parsed.birthDay}.${parsed.birthMonth})`,
    );
  }

  console.log(`\n[import] Done. Created: ${created}, skipped (existing/invalid): ${skipped}.`);
}

main()
  .catch((error) => {
    console.error('[import] Failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
