import { useState, type ChangeEvent } from "react";

const RELATORIO_INSCRICOES_URL = "https://suap.ifba.edu.br/ae/relatorio_alunos_inscritos/";
const TEMPLATE_URL = "./modelo-planilha-complementar.csv";
const REQUIRED_COLUMNS = ["Nome completo do estudante", "Auxílios solicitados"];
const CSV_DELIMITER = ";";

function parseCsv(text: string): string[][] {
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

  if (quoted) throw new Error("Há um campo entre aspas que não foi fechado.");

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

type ValidationResult = {
  validCount: number;
  issues: string[];
};

function validateComplementaryCsv(text: string): ValidationResult {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("O arquivo está vazio.");

  const headers = rows[0];
  const nonemptyHeaders = headers.filter((header) => header !== "");
  const duplicateHeaders = nonemptyHeaders.filter(
    (header, index) => nonemptyHeaders.indexOf(header) !== index,
  );
  if (duplicateHeaders.length > 0) {
    throw new Error("Há cabeçalhos repetidos. Use o modelo baixado na extensão.");
  }

  const missingHeaders = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingHeaders.length > 0) {
    throw new Error(
      `Cabeçalho obrigatório ausente: ${missingHeaders.join(", ")}. Baixe e use o modelo da extensão.`,
    );
  }

  const requiredIndexes = REQUIRED_COLUMNS.map((column) => headers.indexOf(column));
  let validCount = 0;
  const issues: string[] = [];

  rows.slice(1).forEach((record, index) => {
    if (record.every((value) => value.trim() === "")) return;

    const missingValues = requiredIndexes
      .filter((columnIndex) => !(record[columnIndex] ?? "").trim())
      .map((columnIndex) => headers[columnIndex]);

    if (missingValues.length > 0) {
      issues.push(`Registro ${index + 2}: preencha ${missingValues.join(" e ")}.`);
    } else {
      validCount += 1;
    }
  });

  if (validCount === 0 && issues.length === 0) {
    throw new Error("A planilha tem o cabeçalho, mas ainda não tem estudantes preenchidos.");
  }

  return { validCount, issues };
}

export default function App() {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [fileError, setFileError] = useState("");
  const [isReading, setIsReading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setValidation(null);
    setFileError("");
    if (!file) return;

    setIsReading(true);
    try {
      setValidation(validateComplementaryCsv(await file.text()));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
    } finally {
      setIsReading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__symbol" aria-hidden="true">SUAP</div>
        <div>
          <h1>Assistência Estudantil</h1>
          <p className="app__subtitle">Atalhos e planilhas para o SUAP</p>
        </div>
      </header>

      <section className="feature" aria-labelledby="reports-title">
        <h2 id="reports-title">Planilhas oficiais de edital</h2>
        <p>
          Acesse a página do SUAP para consultar e baixar a planilha oficial
          de inscritos em um edital de assistência estudantil.
        </p>
        <a
          className="feature__button"
          href={RELATORIO_INSCRICOES_URL}
          target="_blank"
          rel="noreferrer"
        >
          Acessar inscrições do edital
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="feature feature--template" aria-labelledby="template-title">
        <h2 id="template-title">Planilha complementar</h2>
        <p>
          Baixe o modelo, preencha uma linha por estudante e selecione o arquivo
          preenchido para conferir o formato.
        </p>
        <a className="feature__button feature__button--secondary" href={TEMPLATE_URL} download>
          Baixar modelo (.csv)
          <span aria-hidden="true">↓</span>
        </a>
        <p className="feature__note">
          Não altere os cabeçalhos. Nome completo e auxílios solicitados são obrigatórios.
          Se houver mais de um auxílio, informe todos na mesma célula. Colunas extras serão ignoradas.
        </p>

        <label className="upload">
          <span>{isReading ? "Lendo arquivo…" : "Selecionar planilha preenchida"}</span>
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} disabled={isReading} />
        </label>

        {fileError && <p className="validation validation--error" role="alert">{fileError}</p>}
        {validation && (
          <div
            className={validation.issues.length ? "validation validation--warning" : "validation"}
            role="status"
          >
            <p>
              {validation.validCount} registro(s) válido(s) conferido(s) localmente.
              Nenhum dado foi enviado ao SUAP.
            </p>
            {validation.issues.length > 0 && (
              <ul>
                {validation.issues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}
                {validation.issues.length > 5 && (
                  <li>Há outros registros com campos obrigatórios vazios.</li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>

      <footer className="app__footer">
        <p>
          A validação acontece neste dispositivo. O arquivo original não é alterado
          nem armazenado pela extensão.
        </p>
      </footer>
    </main>
  );
}
