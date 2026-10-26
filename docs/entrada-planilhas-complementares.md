# Entrada de planilhas complementares

## Modelo oferecido pela extensão

A extensão disponibiliza `public/modelo-planilha-complementar.csv`, um arquivo UTF-8 separado por ponto e vírgula que pode ser aberto em aplicativos de planilha. O modelo contém uma linha de cabeçalho e uma linha por estudante.

**Cada planilha complementar deve corresponder a um único edital. Não misture estudantes ou informações de editais diferentes no mesmo arquivo.** Selecione também a planilha oficial completa do mesmo edital.

Cabeçalhos na ordem do modelo:

1. `Nome completo do estudante` — obrigatório para localizar o estudante.
2. `Curso ou turma` — opcional; ajuda a conferir ou diferenciar homônimos.
3. `Matrícula ou número de inscrição` — opcional; manter como texto para preservar zeros à esquerda. Quando preenchido, o identificador e o nome precisam corresponder ao registro oficial.
4. `Auxílios solicitados` — opcional nesta etapa. Se houver mais de um auxílio, mantenha todos na mesma célula.
5. `Observação` — opcional.

Não incluir dados bancários no modelo. Eles não são necessários para identificar os estudantes nesta etapa. Colunas adicionais no CSV complementar são ignoradas.

## Arquivos de entrada e resultado

A extensão recebe dois arquivos:

- O CSV complementar preenchido.
- A planilha completa do edital baixada do SUAP, em XLS ou XLSX.

A planilha oficial deve corresponder ao mesmo edital do complementar. O processamento é somente leitura: as entradas não são modificadas, normalizadas no próprio arquivo, renomeadas nem sobrescritas. A extensão gera dois arquivos derivados: um CSV de resultado complementar com todos os registros e os campos oficiais encontrados; e, quando houver pendências, um CSV separado apenas com os registros que precisam de correção ou conferência.

## Como a busca funciona

- Se houver matrícula ou número de inscrição no complementar, a extensão exige que esse identificador e o nome correspondam ao mesmo registro oficial.
- Sem identificador, a busca compara o nome completo ignorando diferenças de acentuação, caixa e pontuação.
- Se houver homônimos, um curso/turma igual pode resolver a correspondência. Se permanecer mais de uma possibilidade, o registro é marcado como ambíguo e nenhum dado oficial é atribuído.
- A planilha oficial pode juntar nome e matrícula em uma célula, por exemplo `Nome do estudante (20262EC...)`. A extensão separa a parte entre parênteses quando ela contém números, registra a matrícula extraída e também preserva os valores originais das colunas oficiais no resultado.
- Registros sem correspondência, com identificador não encontrado, com nome divergente, sem nome obrigatório ou com mais de uma correspondência permanecem no resultado completo, com status e campos oficiais vazios.
- Um segundo arquivo, `erros-complementares.csv`, lista somente esses registros e inclui o motivo, uma orientação para correção e, quando aplicável, os possíveis registros oficiais com nome, matrícula, inscrição e curso/turma.
- Corrija a planilha complementar original ou uma cópia e processe novamente. O relatório de erros é apenas uma referência; ele não altera nenhum arquivo de entrada.

## Regras para quem preenche

- Não renomear, apagar ou reordenar os cabeçalhos do modelo.
- Não mesclar células nem inserir títulos, subtítulos ou linhas em branco no meio da tabela.
- Usar uma planilha complementar por edital e uma planilha oficial do mesmo edital.
- Manter uma linha por estudante.
- Informar todos os valores de um campo na mesma célula; não criar uma linha para cada auxílio.
- Guardar os arquivos originais sem alterações. Se precisar corrigir dados, trabalhe em uma cópia.

O processamento acontece localmente no navegador da extensão. Para sobreviver ao fechamento e à reabertura do painel, os dois arquivos selecionados e o resultado ficam armazenados no IndexedDB deste navegador até a pessoa clicar em “Limpar arquivos”. Nenhum conteúdo é enviado a um servidor. O resultado baixado é um arquivo derivado, separado das fontes.
