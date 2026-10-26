import { useState, type ChangeEvent } from "react";
import { matchComplementaryStudents, type MatchResult } from "./complementary";

const RELATORIO_INSCRICOES_URL = "https://suap.ifba.edu.br/ae/relatorio_alunos_inscritos/";
const TEMPLATE_URL = "./modelo-planilha-complementar.csv";

export default function App() {
  const [complementaryFile, setComplementaryFile] = useState<File | null>(null);
  const [officialFile, setOfficialFile] = useState<File | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function handleComplementaryChange(event: ChangeEvent<HTMLInputElement>) {
    setComplementaryFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError("");
  }

  function handleOfficialChange(event: ChangeEvent<HTMLInputElement>) {
    setOfficialFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError("");
  }

  async function handleProcess() {
    if (!complementaryFile || !officialFile) return;
    setIsProcessing(true);
    setResult(null);
    setError("");
    try {
      const match = await matchComplementaryStudents(
        await complementaryFile.text(),
        officialFile,
      );
      setResult(match);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível processar as planilhas.");
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "resultado-complementar.csv";
    link.click();
    URL.revokeObjectURL(url);
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
        <p>Acesse o SUAP para baixar a planilha completa de inscritos do edital.</p>
        <a className="feature__button" href={RELATORIO_INSCRICOES_URL} target="_blank" rel="noreferrer">
          Acessar inscrições do edital <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="feature feature--template" aria-labelledby="template-title">
        <h2 id="template-title">Completar dados do edital</h2>
        <p>
          Para cada processamento, são necessários dois arquivos do mesmo edital:
          a planilha completa do edital e a planilha complementar preenchida. A extensão
          procura cada estudante do complementar na planilha do edital e gera um resultado separado.
        </p>
        <a className="feature__button feature__button--secondary" href={TEMPLATE_URL} download>
          Baixar modelo complementar (.csv) <span aria-hidden="true">↓</span>
        </a>
        <p className="feature__note">
          O nome do estudante é obrigatório. Curso, matrícula/inscrição, auxílios e observação
          ajudam a conferir os registros e podem ser preenchidos quando disponíveis.
          Colunas adicionais do complementar são ignoradas.
        </p>
        <p className="feature__notice" role="note">
          Use uma planilha complementar por edital e selecione a planilha oficial do mesmo edital.
          Não misture informações de editais diferentes.
        </p>

        <label className="upload">
          <span>1. Planilha do edital completa (.xls ou .xlsx)</span>
          <small className="upload__help">Arquivo oficial baixado do SUAP, com os dados completos dos estudantes.</small>
          <input type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleOfficialChange} />
        </label>
        {officialFile && <p className="file-name">Arquivo do edital: {officialFile.name}</p>}

        <label className="upload">
          <span>2. Planilha complementar preenchida (.csv)</span>
          <small className="upload__help">Arquivo preenchido com os estudantes que precisam ter os dados completados.</small>
          <input type="file" accept=".csv,text/csv" onChange={handleComplementaryChange} />
        </label>
        {complementaryFile && <p className="file-name">Arquivo complementar: {complementaryFile.name}</p>}

        <button
          className="feature__button process-button"
          type="button"
          onClick={handleProcess}
          disabled={!complementaryFile || !officialFile || isProcessing}
        >
          {isProcessing ? "Conferindo estudantes…" : "Buscar dados no edital"}
        </button>

        {error && <p className="validation validation--error" role="alert">{error}</p>}
        {result && (
          <div className="validation" role="status">
            <p>
              {result.matchedCount} de {result.totalCount} estudante(s) encontrado(s).
              {result.ambiguousCount > 0 && ` ${result.ambiguousCount} correspondência(s) ambígua(s) precisam de conferência.`}
            </p>
            {result.notFoundCount > 0 && (
              <p className="validation__detail">
                {result.notFoundCount} registro(s) sem correspondência única. Confira a coluna
                “Resultado da busca” no arquivo gerado.
              </p>
            )}
            <button className="feature__button feature__button--secondary download-button" type="button" onClick={downloadResult}>
              Baixar resultado separado (.csv) <span aria-hidden="true">↓</span>
            </button>
          </div>
        )}
      </section>

      <footer className="app__footer">
        <p>
          O processamento ocorre neste dispositivo. As planilhas selecionadas são lidas sem
          alteração nem envio a servidores. Os dados encontrados são gravados somente no novo
          arquivo de resultado.
        </p>
      </footer>
    </main>
  );
}
