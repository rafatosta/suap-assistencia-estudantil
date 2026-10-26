import * as XLSX from "xlsx";

const COMPLEMENTARY_HEADERS = [
  "Nome completo do estudante",
  "Curso ou turma",
  "Matrícula ou número de inscrição",
  "Auxílios solicitados",
  "Observação",
] as const;
const CSV_DELIMITER = ";";

type ComplementaryRecord = {
  sourceRow: number;
  name: string;
  course: string;
  identifier: string;
  aids: string;
  observation: string;
};

type OfficialRecord = {
  values: string[];
  name: string;
  normalizedName: string;
  extractedEnrollment: string;
  registration: string;
  identifiers: Set<string>;
  course: string;
};

type OfficialTable = {
  headers: string[];
  records: OfficialRecord[];
  nameIndex: number;
  courseIndex: number;
};

export type MatchResult = {
  csv: string;
  errorsCsv: string;
  suapyWorkbook?: ArrayBuffer;
  missingBankWorkbook?: ArrayBuffer;
  missingBankCount?: number;
  matchedCount: number;
  notFoundCount: number;
  ambiguousCount: number;
  errorCount: number;
  outputRowCount: number;
  totalCount: number;
};

type BankDetails = {
  bank: string;
  agency: string;
  account: string;
  operation: string;
};

const BANK_HEADERS = ["Banco", "Agência", "Nº da Conta", "Op"] as const;
const ACADEMIC_HEADERS = ["CPF (SUAP)", "Período de Referência (SUAP)", "Curso (SUAP)"] as const;
const SUAPY_OUTPUT_HEADERS = [
  "Inscrição",
  "Matrícula",
  "Nome",
  "Curso:",
  "Periodo",
  "CPF",
  "Banco",
  "Agência",
  "No da Conta",
  "Tipo de Conta",
  "Op.",
] as const;

const SAVINGS_OPERATIONS: Record<string, string[]> = {
  "CAIXA ECONÔMICA": ["013", "1288"],
  "BANCO DO BRASIL": ["51"],
  BRADESCO: ["013"],
  NUBANK: [],
  INTER: ["51"],
  PICPAY: [],
  C6: [],
  "MERCADO PAGO": [],
  NEXT: [],
  ITAU: ["500"],
};

type AcademicDetails = {
  cpf: string;
  period: string;
  course: string;
};

function bankDetailsFromHtml(html: string): BankDetails {
  const document = new DOMParser().parseFromString(html, "text/html");
  const section = Array.from(document.querySelectorAll("tr")).find((row) =>
    Array.from(row.querySelectorAll(":scope > td")).some((cell) =>
      cell.textContent?.trim().replace(/\s+/g, " ") === "Conta Bancária Escolhida",
    ),
  );
  if (!section) throw new Error('A seção "Conta Bancária Escolhida" não foi encontrada.');

  const values = new Map<string, string>();
  const definitionList = section.querySelector(":scope > td:last-child dl");
  if (!definitionList) throw new Error('A seção "Conta Bancária Escolhida" não contém os dados bancários.');
  const terms = Array.from(definitionList.querySelectorAll("dt"));
  for (const term of terms) {
    const key = (term.textContent ?? "").trim().replace(/:$/, "").toLocaleLowerCase("pt-BR");
    const value = term.nextElementSibling?.textContent?.trim() ?? "";
    values.set(key, value);
  }

  return {
    bank: values.get("banco") ?? "",
    agency: values.get("agência") ?? values.get("agencia") ?? "",
    account: values.get("conta") ?? "",
    operation: values.get("operação") ?? values.get("operacao") ?? "",
  };
}

async function fetchBankDetails(registration: string): Promise<BankDetails> {
  if (!registration) throw new Error("Número de inscrição ausente na planilha oficial.");
  const url = `https://suap.ifba.edu.br/ae/visualizarinscricaoae/${encodeURIComponent(registration)}/`;
  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", cache: "no-store" });
  } catch {
    throw new Error("Não foi possível acessar o SUAP. Verifique sua conexão e se está autenticado.");
  }
  if (!response.ok) throw new Error(`O SUAP respondeu com erro HTTP ${response.status}.`);
  const details = bankDetailsFromHtml(await response.text());
  if (!details.bank && !details.agency && !details.account && !details.operation) {
    throw new Error('A inscrição foi aberta, mas a seção "Conta Bancária Escolhida" está vazia.');
  }
  return details;
}

function normalizeAcademicLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function academicDetailsFromHtml(html: string): AcademicDetails {
  const document = new DOMParser().parseFromString(html, "text/html");
  const table = Array.from(document.querySelectorAll("table.info")).find((candidate) => {
    const labels = Array.from(candidate.querySelectorAll("tr > td:first-child"))
      .map((cell) => normalizeAcademicLabel(cell.textContent ?? ""));
    return labels.includes("cpf") && labels.includes("periodoreferencia") && labels.includes("curso");
  });
  if (!table) throw new Error('A tabela "Dados Gerais" não contém CPF, Período de Referência e Curso.');

  const values = new Map<string, string>();
  for (const row of Array.from(table.querySelectorAll("tr"))) {
    const cells = Array.from(row.querySelectorAll(":scope > td"));
    for (let index = 0; index + 1 < cells.length; index += 1) {
      const label = normalizeAcademicLabel(cells[index].textContent ?? "");
      if (["cpf", "periodoreferencia", "curso"].includes(label)) {
        values.set(label, cells[index + 1].textContent?.trim().replace(/\s+/g, " ") ?? "");
      }
    }
  }

  return {
    cpf: values.get("cpf") ?? "",
    period: values.get("periodoreferencia") ?? "",
    course: values.get("curso") ?? "",
  };
}

async function fetchAcademicDetails(enrollment: string): Promise<AcademicDetails> {
  if (!enrollment) throw new Error("Matrícula ausente no arquivo oficial.");
  const url = `https://suap.ifba.edu.br/edu/aluno/${encodeURIComponent(enrollment)}/`;
  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", cache: "no-store" });
  } catch {
    throw new Error("Não foi possível acessar o perfil do aluno no SUAP. Verifique sua conexão e autenticação.");
  }
  if (!response.ok) throw new Error(`O SUAP respondeu com erro HTTP ${response.status}.`);
  const details = academicDetailsFromHtml(await response.text());
  if (!details.cpf && !details.period && !details.course) {
    throw new Error("O perfil acadêmico foi aberto, mas os dados esperados estão vazios.");
  }
  return details;
}

function accountType(bank: string, operation: string): string {
  const savingsOperations = SAVINGS_OPERATIONS[bank];
  if (!savingsOperations) return "";
  return savingsOperations.includes(operation) ? "Poupança" : "Corrente";
}

function createSuapyWorkbook(rows: string[][]): ArrayBuffer {
  const worksheet = XLSX.utils.aoa_to_sheet([[...SUAPY_OUTPUT_HEADERS], ...rows]);
  worksheet["!cols"] = SUAPY_OUTPUT_HEADERS.map((header, columnIndex) => {
    const longestCell = rows.reduce(
      (longest, row) => Math.max(longest, (row[columnIndex] ?? "").length),
      header.length,
    );
    return { wch: longestCell + 2 };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Planilha");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

function cellText(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function parseDelimitedCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === CSV_DELIMITER) {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && input[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("O CSV tem um campo entre aspas que não foi fechado.");

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function parseComplementaryCsv(text: string): ComplementaryRecord[] {
  const rows = parseDelimitedCsv(text);
  if (rows.length === 0) throw new Error("A planilha complementar está vazia.");

  const headers = rows[0];
  const nameIndex = headers.indexOf(COMPLEMENTARY_HEADERS[0]);
  if (nameIndex < 0) {
    throw new Error('Cabeçalho obrigatório ausente: "Nome completo do estudante". Baixe o modelo da extensão.');
  }

  const indexes = {
    course: headers.indexOf(COMPLEMENTARY_HEADERS[1]),
    identifier: headers.indexOf(COMPLEMENTARY_HEADERS[2]),
    aids: headers.indexOf(COMPLEMENTARY_HEADERS[3]),
    observation: headers.indexOf(COMPLEMENTARY_HEADERS[4]),
  };

  const records = rows.slice(1).flatMap((values, index) => {
    if (values.every((value) => value.trim() === "")) return [];

    return [{
      sourceRow: index + 2,
      name: cellText(values[nameIndex]),
      course: indexes.course < 0 ? "" : cellText(values[indexes.course]),
      identifier: indexes.identifier < 0 ? "" : cellText(values[indexes.identifier]),
      aids: indexes.aids < 0 ? "" : cellText(values[indexes.aids]),
      observation: indexes.observation < 0 ? "" : cellText(values[indexes.observation]),
    }];
  });

  if (records.length === 0) throw new Error("O CSV tem cabeçalho, mas não contém registros de estudantes.");
  return records;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeIdentifier(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function splitNameAndEnrollment(value: string): { name: string; enrollment: string } {
  const fullName = value.trim();
  const match = fullName.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!match || !/\d/.test(match[2])) return { name: fullName, enrollment: "" };
  return { name: match[1].trim(), enrollment: match[2].trim() };
}

function findHeaderRow(rows: unknown[][]): { rowIndex: number; headers: string[]; nameIndex: number; courseIndex: number } | null {
  const scanLimit = Math.min(rows.length, 40);

  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const headers = rows[rowIndex].map(cellText);
    const normalized = headers.map(normalizeHeader);
    const nameIndex = normalized.findIndex(
      (header) => header === "nome" || header.includes("nomecompleto") || header === "nomedoaluno" || header === "nomedoestudante",
    );
    const aidIndex = normalized.findIndex((header) => header.includes("auxiliossolicitados"));
    const courseIndex = normalized.findIndex((header) => header.includes("curso") || header.includes("turma"));
    const hasIdentifierColumn = normalized.some(
      (header) => header.includes("matricula") || header === "inscricao" || header.includes("numerodainscricao"),
    );

    if (nameIndex >= 0 && aidIndex >= 0 && (courseIndex >= 0 || hasIdentifierColumn)) {
      return { rowIndex, headers, nameIndex, courseIndex };
    }
  }

  return null;
}

function readOfficialWorkbook(buffer: ArrayBuffer): OfficialTable {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: false });
  } catch {
    throw new Error("Não foi possível abrir o arquivo oficial. Selecione o XLS ou XLSX original do edital.");
  }

  const tables: OfficialTable[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    const detected = findHeaderRow(rows);
    if (!detected) continue;

    const headers = detected.headers.map((header, index) => header || `Coluna ${index + 1}`);
    const normalizedHeaders = detected.headers.map(normalizeHeader);
    const identifierIndexes = normalizedHeaders
      .map((header, index) => ({ header, index }))
      .filter(({ header }) =>
        header.includes("matricula")
        || header === "inscricao"
        || header.includes("numerodainscricao"),
      )
      .map(({ index }) => index);

    const records: OfficialRecord[] = [];
    for (const sourceRow of rows.slice(detected.rowIndex + 1)) {
      const values = headers.map((_, index) => cellText(sourceRow[index]));
      const combinedName = values[detected.nameIndex];
      if (!combinedName) continue;

      const { name, enrollment } = splitNameAndEnrollment(combinedName);
      const identifiers = new Set(
        [enrollment, ...identifierIndexes.map((index) => values[index])]
          .map(normalizeIdentifier)
          .filter(Boolean),
      );
      records.push({
        values,
        name,
        normalizedName: normalizeName(name),
        extractedEnrollment: enrollment,
        registration: identifierIndexes
          .filter((index) => normalizedHeaders[index].includes("numerodainscricao") || normalizedHeaders[index] === "inscricao")
          .map((index) => values[index])
          .find(Boolean) ?? "",
        identifiers,
        course: detected.courseIndex < 0 ? "" : values[detected.courseIndex],
      });
    }

    tables.push({
      headers,
      records,
      nameIndex: detected.nameIndex,
      courseIndex: detected.courseIndex,
    });
  }

  if (tables.length === 0) {
    throw new Error("Não encontrei a tabela completa do edital. Confira se o arquivo tem cabeçalhos como Nome, Número da Inscrição e Auxílios solicitados.");
  }

  const first = tables[0];
  if (tables.some((table) => table.headers.join("\u0000") !== first.headers.join("\u0000"))) {
    throw new Error("O arquivo oficial contém mais de uma tabela com formatos diferentes. Use o arquivo de um único edital.");
  }

  return { ...first, records: tables.flatMap((table) => table.records) };
}

function disambiguateByCourse(records: OfficialRecord[], course: string): OfficialRecord[] {
  if (!course) return records;
  const normalizedCourse = normalizeName(course);
  return records.filter((record) => normalizeName(record.course) === normalizedCourse);
}

type MatchDecision = {
  status: string;
  record: OfficialRecord | null;
  ambiguous: boolean;
  detail: string;
  candidates: OfficialRecord[];
};

function findOfficialRecord(
  complementary: ComplementaryRecord,
  official: OfficialTable,
): MatchDecision {
  if (!complementary.name) {
    return {
      status: "Nome ausente no complementar",
      record: null,
      ambiguous: false,
      detail: "Nome obrigatório ausente; preencha o nome completo.",
      candidates: [],
    };
  }

  const normalizedName = normalizeName(complementary.name);
  let candidates: OfficialRecord[];

  if (complementary.identifier) {
    const identifier = normalizeIdentifier(complementary.identifier);
    candidates = official.records.filter((record) => record.identifiers.has(identifier));
    if (candidates.length === 0) {
      return {
        status: "Identificador não encontrado",
        record: null,
        ambiguous: false,
        detail: "Identificador " + complementary.identifier + " não localizado; confira matrícula/inscrição e o edital.",
        candidates: [],
      };
    }

    const identifierMatches = candidates;
    candidates = candidates.filter((record) => record.normalizedName === normalizedName);
    if (candidates.length === 0) {
      return {
        status: "Identificador encontrado, mas nome divergente",
        record: null,
        ambiguous: false,
        detail: "O identificador está associado a outro nome no edital; confira se nome e identificador pertencem à mesma pessoa.",
        candidates: identifierMatches,
      };
    }
  } else {
    candidates = official.records.filter((record) => record.normalizedName === normalizedName);
    if (candidates.length === 0) {
      return {
        status: "Não encontrado",
        record: null,
        ambiguous: false,
        detail: "Nome não localizado; confira a grafia e se os arquivos são do mesmo edital.",
        candidates: [],
      };
    }
  }

  if (candidates.length > 1) {
    const disambiguated = disambiguateByCourse(candidates, complementary.course);
    if (disambiguated.length === 1) {
      return {
        status: "Encontrado por nome e curso",
        record: disambiguated[0],
        ambiguous: false,
        detail: "",
        candidates: [],
      };
    }

    const possibleRecords = disambiguated.length > 1 ? disambiguated : candidates;
    return {
      status: "Correspondência múltipla: " + possibleRecords.length + " entradas",
      record: null,
      ambiguous: true,
      detail: "Correspondência múltipla; as " + possibleRecords.length + " entradas foram incluídas no resultado.",
      candidates: possibleRecords,
    };
  }

  return {
    status: "Encontrado",
    record: candidates[0],
    ambiguous: false,
    detail: "",
    candidates: [],
  };
}

function describeCandidate(record: OfficialRecord): string {
  const details = [
    record.name,
    record.extractedEnrollment ? "Matrícula: " + record.extractedEnrollment : "",
    record.registration ? "Inscrição: " + record.registration : "",
    record.course ? "Curso/turma: " + record.course : "",
  ].filter(Boolean);
  return details.join(" | ");
}
function csvCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function uniqueOfficialHeaders(headers: string[], reserved: Set<string>): string[] {
  const used = new Set(reserved);
  return headers.map((original, index) => {
    let candidate = original || `Coluna ${index + 1}`;
    if (used.has(candidate)) candidate = `${candidate} (edital)`;
    let suffix = 2;
    const base = candidate;
    while (used.has(candidate)) {
      candidate = `${base} ${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    return candidate;
  });
}

export async function matchComplementaryStudents(
  complementaryCsv: string,
  officialFile: File,
  onSuapLookupProgress?: (completed: number, total: number) => void,
): Promise<MatchResult> {
  const complementary = parseComplementaryCsv(complementaryCsv);
  const official = readOfficialWorkbook(await officialFile.arrayBuffer());
  const reservedHeaders = new Set([
    "Registro complementar",
    ...COMPLEMENTARY_HEADERS,
    "Resultado da busca",
    "Matrícula extraída do campo Nome",
    ...BANK_HEADERS,
    ...ACADEMIC_HEADERS,
  ]);
  const officialHeaders = uniqueOfficialHeaders(official.headers, reservedHeaders);
  const outputHeaders = [
    "Registro complementar",
    ...COMPLEMENTARY_HEADERS,
    "Resultado da busca",
    "Matrícula extraída do campo Nome",
    ...officialHeaders,
    ...BANK_HEADERS,
    ...ACADEMIC_HEADERS,
  ];

  let matchedCount = 0;
  let ambiguousCount = 0;
  let notFoundCount = 0;
  const errorRows: string[][] = [];
  const outputRows: string[][] = [];
  const suapyRows: string[][] = [];
  const missingBankRows: string[][] = [];

  const decisions = complementary.map((entry) => ({ entry, match: findOfficialRecord(entry, official) }));
  const recordsToLookup = decisions.flatMap(({ match }) =>
    match.record ? [match.record] : match.ambiguous ? match.candidates : [],
  );
  const registrations = [...new Set(recordsToLookup.map((record) => record.registration).filter(Boolean))];
  const enrollments = [...new Set(recordsToLookup.map((record) => record.extractedEnrollment).filter(Boolean))];
  const bankDetailsByRegistration = new Map<string, BankDetails>();
  const bankErrorsByRegistration = new Map<string, string>();
  const academicDetailsByEnrollment = new Map<string, AcademicDetails>();
  const academicErrorsByEnrollment = new Map<string, string>();
  const lookupJobs = [
    ...registrations.map((registration) => ({ kind: "bank" as const, value: registration })),
    ...enrollments.map((enrollment) => ({ kind: "academic" as const, value: enrollment })),
  ];
  let completedLookups = 0;
  onSuapLookupProgress?.(0, lookupJobs.length);
  for (let start = 0; start < lookupJobs.length; start += 4) {
    await Promise.all(lookupJobs.slice(start, start + 4).map(async (job) => {
      try {
        if (job.kind === "bank") {
          bankDetailsByRegistration.set(job.value, await fetchBankDetails(job.value));
        } else {
          academicDetailsByEnrollment.set(job.value, await fetchAcademicDetails(job.value));
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Falha ao consultar dados no SUAP.";
        if (job.kind === "bank") bankErrorsByRegistration.set(job.value, detail);
        else academicErrorsByEnrollment.set(job.value, detail);
      } finally {
        completedLookups += 1;
        onSuapLookupProgress?.(completedLookups, lookupJobs.length);
      }
    }));
  }

  for (const { entry, match } of decisions) {
    const foundRecords = match.record
      ? [match.record]
      : match.ambiguous
        ? match.candidates
        : [];

    if (foundRecords.length > 0) matchedCount += 1;
    else notFoundCount += 1;
    if (match.ambiguous) ambiguousCount += 1;

    if (!match.record) {
      errorRows.push([
        String(entry.sourceRow),
        entry.name,
        match.detail || match.status,
        ...match.candidates.map(describeCandidate),
      ]);
    }

    if (foundRecords.length === 0) {
      outputRows.push([
        String(entry.sourceRow),
        entry.name,
        entry.course,
        entry.identifier,
        entry.aids,
        entry.observation,
        match.status,
        "",
        ...official.headers.map(() => ""),
        ...BANK_HEADERS.map(() => ""),
        ...ACADEMIC_HEADERS.map(() => ""),
      ]);
      continue;
    }

    foundRecords.forEach((record, index) => {
      const rowStatus = match.ambiguous
        ? "Correspondência múltipla — entrada " + (index + 1) + " de " + foundRecords.length
        : match.status;
      const bankDetails = bankDetailsByRegistration.get(record.registration);
      const bankError = bankErrorsByRegistration.get(record.registration)
        ?? (!record.registration ? "Número de inscrição ausente na planilha oficial." : "");
      const academicDetails = academicDetailsByEnrollment.get(record.extractedEnrollment);
      const academicError = academicErrorsByEnrollment.get(record.extractedEnrollment)
        ?? (!record.extractedEnrollment ? "Matrícula não localizada no campo Nome da planilha oficial." : "");
      if (bankError) {
        errorRows.push([
          String(entry.sourceRow),
          entry.name,
          "Dados bancários não extraídos: " + bankError,
          record.registration ? "Inscrição: " + record.registration : "",
        ]);
      }
      if (academicError) {
        errorRows.push([
          String(entry.sourceRow),
          entry.name,
          "Dados acadêmicos não extraídos: " + academicError,
          record.extractedEnrollment ? "Matrícula: " + record.extractedEnrollment : "",
        ]);
      }
      const suapyRow = [
        record.registration,
        record.extractedEnrollment,
        record.name,
        academicDetails?.course ?? "",
        academicDetails?.period ?? "",
        academicDetails?.cpf ?? "",
        bankDetails?.bank ?? "",
        bankDetails?.agency ?? "",
        bankDetails?.account ?? "",
        accountType(bankDetails?.bank ?? "", bankDetails?.operation ?? ""),
        bankDetails?.operation ?? "",
      ];
      suapyRows.push(suapyRow);
      if (!(bankDetails?.bank && bankDetails.agency && bankDetails.account && bankDetails.operation)) {
        missingBankRows.push(suapyRow);
      }
      outputRows.push([
        String(entry.sourceRow),
        entry.name,
        entry.course,
        entry.identifier,
        entry.aids,
        entry.observation,
        rowStatus,
        record.extractedEnrollment,
        ...record.values,
        bankDetails?.bank ?? "",
        bankDetails?.agency ?? "",
        bankDetails?.account ?? "",
        bankDetails?.operation ?? "",
        academicDetails?.cpf ?? "",
        academicDetails?.period ?? "",
        academicDetails?.course ?? "",
      ]);
    });
  }

  const toCsv = (rows: string[][]) =>
    rows.map((row) => row.map(csvCell).join(CSV_DELIMITER)).join("\r\n");
  const csv = toCsv([outputHeaders, ...outputRows]);
  const maxCandidates = errorRows.reduce((maximum, row) => Math.max(maximum, row.length - 3), 0);
  const errorHeaders = [
    "Registro complementar",
    "Aluno",
    "Ocorrência",
    ...Array.from({ length: maxCandidates }, (_, index) => "Entrada " + (index + 1)),
  ];
  const errorsCsv = toCsv([errorHeaders, ...errorRows]);
  return {
    csv: `\uFEFF${csv}\r\n`,
    errorsCsv: `\uFEFF${errorsCsv}\r\n`,
    suapyWorkbook: createSuapyWorkbook(suapyRows),
    missingBankWorkbook: createSuapyWorkbook(missingBankRows),
    missingBankCount: missingBankRows.length,
    matchedCount,
    notFoundCount,
    ambiguousCount,
    errorCount: errorRows.length,
    outputRowCount: outputRows.length,
    totalCount: complementary.length,
  };
}
