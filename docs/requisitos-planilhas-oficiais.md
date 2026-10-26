# Requisitos para planilhas oficiais de editais

## Amostras examinadas

As amostras originais fornecidas para análise, `n10.xls` e `n11.xls`, são arquivos Excel no formato legado `.xls`. Cada arquivo contém uma aba chamada `Planilha1`. As duas amostras apresentam a mesma estrutura de colunas e registros de inscrições; não são planilhas complementares.

Cabeçalhos observados, na ordem da planilha (a grafia abaixo apenas recompõe acentos perdidos pela leitura técnica do arquivo):

1. Nome
2. Campus do Curso
3. Número da Inscrição
4. Situação da Inscrição
5. Auxílios solicitados
6. Detalhamento
7. Motivo
8. Auxílios/Bolsas de Assistência Estudantil do IFBA ao qual foi contemplado no último ano
9. Situação do Resultado

A ordem e os rótulos acima descrevem as amostras observadas. A implementação deve tratar cada edição de edital como potencialmente distinta e não deve pressupor que todas as versões futuras terão exatamente os mesmos cabeçalhos ou a mesma estrutura.

## Invariância dos arquivos de origem

As planilhas oficiais de edital são fontes originais e imutáveis. A aplicação e qualquer ferramenta auxiliar devem:

- Abrir e processar os arquivos em modo somente leitura.
- Preservar os bytes, o formato, o nome, as abas, a ordem das colunas, os cabeçalhos, os valores e a formatação da fonte.
- Nunca editar, normalizar no próprio arquivo, renomear colunas, sobrescrever ou salvar alterações sobre a planilha original.
- Não converter e salvar uma versão convertida no lugar do arquivo de origem.
- Se houver falha ou dúvida de interpretação, manter a fonte intacta e comunicar o problema; não corrigir a planilha automaticamente.

## Dados derivados

Quando um fluxo futuro precisar de um esquema padronizado, a transformação deverá ocorrer apenas em memória ou em uma cópia derivada separada. Todo resultado derivado deverá ser salvo em arquivo distinto, com nome e formato próprios, deixando claro que não é a planilha oficial. A fonte original deve continuar disponível sem alterações.

Transformações, aliases de cabeçalho, validações e critérios de associação entre dados deverão ser documentados separadamente. A padronização não autoriza alterar os cabeçalhos ou conteúdo do arquivo oficial.

## Limite de escopo atual

Este documento define requisitos para trabalho futuro. Não implementa leitura, extração, busca, associação, normalização ou exportação de dados das planilhas.
