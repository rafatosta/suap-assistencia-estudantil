# Entrada de planilhas complementares

## Modelo oferecido pela extensão

A extensão disponibiliza `public/modelo-planilha-complementar.csv`, um arquivo UTF-8 separado por ponto e vírgula que pode ser aberto em aplicativos de planilha. O modelo contém uma linha de cabeçalho e uma linha por estudante.

**Cada planilha deve corresponder a um único edital. Não misture estudantes ou informações de editais diferentes no mesmo arquivo.** Baixe e preencha um arquivo separado para cada edital.

Cabeçalhos na ordem do modelo:

1. `Nome completo do estudante` — obrigatório.
2. `Curso ou turma` — opcional; auxilia a conferência da identidade.
3. `Matrícula ou número de inscrição` — opcional; manter como texto para preservar zeros à esquerda.
4. `Auxílios solicitados` — obrigatório. Mais de um auxílio permanece no mesmo campo/célula.
5. `Observação` — opcional para anotações contextuais.

Não incluir dados bancários nesse formulário. Eles não são necessários para identificar os estudantes nesta etapa.

## Uso e validação atual

A interface permite baixar o modelo e selecionar um CSV preenchido. A verificação acontece localmente no navegador da extensão:

- Confere os cabeçalhos obrigatórios exatamente como fornecidos no modelo.
- Confere se cada linha preenchida contém nome e auxílios solicitados.
- Ignora colunas adicionais.
- Preserva os campos com múltiplas informações como uma única célula durante a leitura.
- Apresenta apenas a quantidade de linhas válidas e os números das linhas com pendências; não apresenta nem armazena o conteúdo pessoal.

A extensão não envia o arquivo a um servidor, não o modifica e não armazena os registros. A validação atual não consulta o SUAP nem extrai dados bancários. O arquivo enviado é usado somente para a conferência de formato nesta versão.

## Regras para quem preenche

- Não renomear, apagar ou reordenar os cabeçalhos.
- Não mesclar células nem inserir títulos, subtítulos ou linhas em branco no meio da tabela.
- Usar uma planilha por edital; nunca combinar dois editais no mesmo arquivo.
- Manter uma linha por estudante.
- Informar todos os auxílios de um estudante no mesmo campo `Auxílios solicitados`; não criar uma linha para cada auxílio.
- Informações adicionais devem ficar em colunas próprias; colunas não previstas são ignoradas pela validação atual.
- Guardar o arquivo original recebido sem alterações e trabalhar em uma cópia quando necessário.

A futura conversão de formatos deve ler a fonte sem alterá-la e criar qualquer dado padronizado como resultado separado.
