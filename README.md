# SUAP Assistência Estudantil

Extensão para Google Chrome destinada a apoiar atividades administrativas relacionadas aos editais da assistência estudantil no SUAP.

O objetivo inicial é estabelecer uma base simples e auditável para a extensão. A coleta de dados de alunos e inscrições **ainda não está implementada**.

## Objetivo do projeto

Atualmente, informações de inscrições em editais precisam ser consultadas individualmente no SUAP e transferidas manualmente para planilhas. A proposta é futuramente automatizar esse fluxo para usuários que já tenham sessão autenticada e autorização para acessar as páginas correspondentes no SUAP.

A extensão deverá operar dentro dos limites de acesso definidos pelo próprio sistema institucional. Ela não deve solicitar nem armazenar a senha do usuário, contornar controles de acesso ou coletar informações além das necessárias à finalidade autorizada.

## Escopo planejado

- Consultar, de forma sequencial, as páginas do SUAP necessárias ao edital.
- Extrair apenas os campos definidos para o fluxo autorizado.
- Apresentar os resultados e permitir sua exportação para CSV ou XLSX.
- Informar registros não encontrados ou que não puderam ser processados.

Esses itens descrevem objetivos futuros; não indicam funcionalidades já disponíveis.

## Estado atual

Este repositório contém o esqueleto inicial de uma extensão Chrome com React, TypeScript e Vite:

- Manifest V3 mínimo.
- Aplicação popup com atalho para o relatório oficial de inscritos.
- Modelo CSV baixável para planilhas complementares.
- Validação local dos cabeçalhos e campos obrigatórios do CSV selecionado.

**A extensão ainda não consulta o SUAP para buscar ou extrair dados de estudantes.** A validação da planilha não envia nem armazena os dados.

## Planilha complementar

A extensão oferece um modelo CSV com uma linha por estudante e **um arquivo por edital**. Não misture estudantes ou informações de editais diferentes na mesma planilha. Os campos obrigatórios são `Nome completo do estudante` e `Auxílios solicitados`; se houver vários auxílios, eles permanecem juntos em uma única célula. A interface avisa para preservar os cabeçalhos e permite selecionar o arquivo preenchido para uma conferência local. Colunas extras são ignoradas.

O arquivo-modelo e os detalhes da validação estão em [docs/entrada-planilhas-complementares.md](docs/entrada-planilhas-complementares.md). A validação atual aceita CSV separado por ponto e vírgula; não interpreta arquivos XLSX.

## Planilhas oficiais de edital

As amostras oficiais `n10.xls` e `n11.xls` fornecidas para análise possuem uma aba (`Planilha1`) e a mesma estrutura de colunas. Esses arquivos devem ser tratados como fontes originais imutáveis: processamento somente leitura; nunca modificar, normalizar no próprio arquivo, renomear colunas ou sobrescrever a planilha original.

Qualquer dado padronizado ou exportado no futuro deve ser salvo separadamente, em um arquivo derivado com nome próprio. A estrutura observada e os requisitos completos estão em [docs/requisitos-planilhas-oficiais.md](docs/requisitos-planilhas-oficiais.md). A leitura dessas fontes e a extração de dados ainda não estão implementadas.

## Tecnologias

- [Chrome Extensions — Manifest V3](https://developer.chrome.com/docs/extensions/develop/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)

## Requisitos

- Node.js em versão LTS compatível com a versão instalada do Vite.
- npm.
- Google Chrome ou navegador Chromium compatível.

## Desenvolvimento

Instale as dependências:

```bash
npm install
```

Execute o servidor de desenvolvimento da interface:

```bash
npm run dev
```

O servidor do Vite serve apenas para desenvolver a interface; ele não carrega a extensão no Chrome.

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

Depois de alterar o código, execute novamente `npm run build` e recarregue a extensão na página de extensões.

## Privacidade e segurança

Os dados tratados futuramente poderão incluir informações pessoais e bancárias de estudantes. A implementação deverá seguir o princípio da minimização de dados, limitar o processamento à finalidade institucional autorizada e evitar transmitir informações a serviços externos. Os arquivos exportados deverão ser armazenados e compartilhados de forma segura.

A publicação do código-fonte permite inspeção e auditoria, mas não concede acesso ao SUAP nem substitui as autorizações institucionais necessárias.

## Contribuição

Antes de implementar novos recursos, documente o objetivo, os dados estritamente necessários e as permissões técnicas requeridas. Prefira permissões mínimas e alterações pequenas, verificáveis e auditáveis.
