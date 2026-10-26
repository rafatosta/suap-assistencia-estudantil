const RELATORIO_INSCRICOES_URL = "https://suap.ifba.edu.br/ae/relatorio_alunos_inscritos/";

export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <div className="app__symbol" aria-hidden="true">SUAP</div>
        <div>
          <h1>Assistência Estudantil</h1>
          <p className="app__subtitle">Atalhos para tarefas no SUAP</p>
        </div>
      </header>

      <section className="feature" aria-labelledby="reports-title">
        <h2 id="reports-title">Planilhas de inscrições</h2>
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

      <footer className="app__footer">
        <p>É necessário estar autenticado no SUAP e ter permissão para acessar os relatórios.</p>
      </footer>
    </main>
  );
}
