# SUAP Assistência Estudantil

Extensão para Google Chrome destinada a apoiar atividades administrativas relacionadas aos editais da assistência estudantil no SUAP.

O objetivo inicial é estabelecer uma base simples e auditável para a extensão. A coleta de dados de alunos e inscrições **ainda não está implementada**.

## Objetivo do projeto

Atualmente, informações de inscrições em editais precisam ser consultadas individualmente no SUAP e transferidas manualmente para planilhas. A proposta é futuramente automatizar esse fluxo para usuários que já tenham sessão autenticada e autorização para acessar as páginas correspondentes no SUAP.

A extensão deverá operar dentro dos limites de acesso definidos pelo próprio sistema institucional. Ela não deve solicitar nem armazenar a senha do usuário, contornar controles de acesso ou coletar informações além das necessárias à finalidade autorizada.

## Escopo planejado

- Importar uma lista de inscrições ou matrículas a partir de arquivo CSV ou XLSX.
- Consultar, de forma sequencial, as páginas do SUAP necessárias ao edital.
- Extrair apenas os campos definidos para o fluxo autorizado.
- Apresentar os resultados e permitir sua exportação para CSV ou XLSX.
- Informar registros não encontrados ou que não puderam ser processados.

Esses itens descrevem objetivos futuros; não indicam funcionalidades já disponíveis.

## Estado atual

Este repositório contém somente o esqueleto inicial de uma extensão Chrome com React, TypeScript e Vite:

- Manifest V3 mínimo.
- Aplicação popup de exemplo.
- Configuração de desenvolvimento e compilação.

**Nenhuma navegação no SUAP, importação de planilhas ou extração de dados foi implementada.**

## Planilhas oficiais de edital

As amostras oficiais `n10.xls` e `n11.xls` fornecidas para análise possuem uma aba (`Planilha1`) e a mesma estrutura de colunas. Esses arquivos devem ser tratados como fontes originais imutáveis: processamento somente leitura; nunca modificar, normalizar no próprio arquivo, renomear colunas ou sobrescrever a planilha original.

Qualquer dado padronizado ou exportado no futuro deve ser salvo separadamente, em um arquivo derivado com nome próprio. A estrutura observada e os requisitos completos estão em [docs/requisitos-planilhas-oficiais.md](docs/requisitos-planilhas-oficiais.md). A importação e extração ainda não estão implementadas.

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
