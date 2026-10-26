export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <div className="app__symbol" aria-hidden="true">SUAP</div>
        <div>
          <h1>Assistência Estudantil</h1>
          <p className="app__subtitle">Ferramenta auxiliar para fluxos autorizados no SUAP</p>
        </div>
      </header>

      <section className="status" aria-labelledby="status-title">
        <span className="status__label">Estado do projeto</span>
        <h2 id="status-title">Estrutura inicial</h2>
        <p>
          A base da extensão está preparada. A importação de planilhas,
          a navegação no SUAP e a extração de dados ainda não foram implementadas.
        </p>
      </section>

      <footer className="app__footer">
        <p>O acesso aos dados depende das permissões da sessão autenticada no SUAP.</p>
      </footer>
    </main>
  );
}
