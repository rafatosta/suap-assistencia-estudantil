# SUAP Assistência Estudantil

Extensão para Google Chrome destinada a apoiar atividades administrativas relacionadas aos editais da assistência estudantil no SUAP.

## Objetivo

A extensão ajuda a complementar dados de estudantes a partir de dois arquivos do mesmo edital: a planilha complementar preenchida e a planilha oficial completa baixada do SUAP. Ela procura cada estudante na fonte oficial e cria um resultado separado com os dados encontrados.

## Estado atual

O painel lateral persistente da extensão oferece:

- Atalho para o relatório oficial de inscritos no SUAP.
- Modelo CSV baixável para a entrada complementar, com um registro por estudante e um arquivo por edital.
- Leitura local de CSV complementar e arquivo oficial XLS/XLSX.
- Correspondência por identificador e nome, quando o identificador complementar foi informado; caso contrário, por nome exato normalizado. O curso pode ajudar a desambiguar nomes repetidos.
- Resultado CSV separado com os campos da entrada, todos os campos encontrados no edital oficial, matrícula extraída do campo combinado de nome quando houver, e status por registro.
- Relatório CSV de erros separado, com motivo/orientação para cada pendência e os candidatos detalhados quando a busca for ambígua.

Nomes sem correspondência, identificadores divergentes e correspondências ambíguas são sinalizados no resultado completo e reunidos também em um segundo CSV de erros. Esse relatório explica o motivo e, quando existem homônimos, lista nome, matrícula, inscrição e curso/turma dos possíveis registros. A extensão não escolhe automaticamente entre vários estudantes possíveis.

## Regras das planilhas

A planilha complementar deve ser de **um único edital**. Não misture dados de editais diferentes. O nome completo é o único campo obrigatório para a busca; curso/turma e matrícula/número de inscrição são opcionais e ajudam na conferência. Auxílios solicitados e observação também são opcionais. Campos com vários valores devem permanecer em uma única célula. Colunas adicionais da planilha complementar são ignoradas.

Na planilha oficial, o campo Nome pode conter o nome do estudante e a matrícula entre parênteses. A extensão usa essa matrícula como identificador extraído, mantendo também os valores das colunas oficiais no resultado.

## Proteção das fontes e privacidade

As duas planilhas selecionadas são lidas localmente e não são alteradas, renomeadas, normalizadas no próprio arquivo ou sobrescritas. Para sobreviver ao fechamento e à reabertura do painel, os arquivos e o resultado ficam guardados no IndexedDB deste navegador até a pessoa clicar em limpar. O resultado é baixado como um novo arquivo CSV, sem substituir nenhuma entrada. Nenhum conteúdo é enviado a servidores pela extensão.

As amostras oficiais n10.xls e n11.xls analisadas têm uma aba (Planilha1) e colunas como Nome, Campus do Curso, Número da Inscrição, Situação da Inscrição, Auxílios solicitados, Detalhamento, Motivo, histórico de auxílios/bolsas e Situação do Resultado. O arquivo de outros editais pode ter pequenas diferenças; a extensão procura a tabela pelos cabeçalhos e interrompe o processamento quando não reconhece o formato.

O modelo e as instruções estão em [docs/entrada-planilhas-complementares.md](docs/entrada-planilhas-complementares.md). As regras sobre fontes oficiais estão em [docs/requisitos-planilhas-oficiais.md](docs/requisitos-planilhas-oficiais.md).

## Tecnologias

- [Chrome Extensions — Manifest V3](https://developer.chrome.com/docs/extensions/develop/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [SheetJS](https://docs.sheetjs.com/) para leitura dos formatos XLS e XLSX no navegador.

## Requisitos

- Node.js em versão LTS compatível com a versão instalada do Vite.
- npm.
- Google Chrome 114 ou posterior (necessário para o painel lateral) ou navegador Chromium compatível.

## Desenvolvimento

Instale as dependências:

```bash
npm install
```

Execute o servidor de desenvolvimento da interface:

```bash
npm run dev
```

Verifique os tipos e gere a compilação:

```bash
npm run typecheck
npm run build
```

## Carregar a extensão no Chrome

1. Execute `npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `dist` gerada pelo Vite.

Depois de alterar o código, gere novamente a compilação e recarregue a extensão.

## Segurança

Os dados tratados podem incluir informações pessoais e bancárias de estudantes. Use os arquivos apenas para a finalidade institucional autorizada e armazene/compartilhe o resultado com segurança. A extensão processa os arquivos localmente; isso não substitui as autorizações institucionais necessárias.
