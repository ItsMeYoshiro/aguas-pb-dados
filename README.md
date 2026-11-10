# Açudes da Paraíba: leituras diárias

As leituras diárias dos açudes da Paraíba monitorados pela **AESA**, a Agência Executiva de Gestão das Águas do Estado da Paraíba: porcentagem da capacidade, volume, cota e espelho d'água, uma linha por dia, desde a primeira medição de cada açude.

Estes arquivos são mantidos pelo [Águas PB](https://aguaspb.ykbsoft.io), que mostra os mesmos números em gráficos e mapas, e são atualizados todo dia, entre 10h e 11h (horário de Brasília).

> Este repositório **não é oficial** e não tem ligação com a AESA nem com o Governo da Paraíba. Os números são os que a agência publica, sem nenhum recálculo. Para o dado oficial, use o [painel da AESA](https://seira.aesa.pb.gov.br).

## Baixar

**Todos os açudes num arquivo só**, uma linha por açude e dia:

- [acudes-paraiba-diario.xlsx](https://github.com/ItsMeYoshiro/aguas-pb-dados/releases/download/dados/acudes-paraiba-diario.xlsx): Excel, com data e número já formatados
- [acudes-paraiba-diario.csv](https://github.com/ItsMeYoshiro/aguas-pb-dados/releases/download/dados/acudes-paraiba-diario.csv): CSV

Os dois endereços são fixos e sempre apontam para a versão mais recente.

**Um açude só:** o arquivo dele está na pasta [`diario/`](diario), com o id e o nome, por exemplo `diario/76-coremas.csv`. Na página de cada açude no [Águas PB](https://aguaspb.ykbsoft.io), o mesmo histórico também sai em Excel, no formato do Excel em português.

## Arquivos

### `acudes.csv`: os açudes

| coluna | o que é |
|---|---|
| `id` | identificador do açude na AESA; é o que liga esta tabela aos arquivos diários |
| `nome` | nome do açude, como a AESA o registra |
| `municipio` | município onde fica |
| `bacia` | bacia hidrográfica, na divisão da AESA |
| `capacidade_m3` | capacidade total, em metros cúbicos |
| `latitude`, `longitude` | localização, em graus decimais |
| `estrategico` | `sim` para os açudes que a AESA marca como estratégicos |
| `arquivo` | caminho do arquivo diário deste açude |

### `diario/<id>-<nome>.csv`: as leituras de cada açude

| coluna | o que é |
|---|---|
| `data` | dia da leitura, AAAA-MM-DD |
| `porcentagem` | volume como porcentagem da capacidade; passa de 100 quando o açude está vertendo |
| `volume_m3` | volume armazenado, em metros cúbicos |
| `cota_m` | nível da água, em metros acima do nível do mar |
| `area_m2` | área do espelho d'água, em metros quadrados |
| `variacao_volume_m3` | volume desta leitura menos o da leitura anterior; vazio na primeira |

Os arquivos juntos têm as colunas `id`, `nome`, `municipio`, `bacia` e `capacidade_m3` antes destas.

## O que é bom saber antes de usar

- **Nem todo açude é lido todo dia.** Fins de semana, feriados e falhas de coleta deixam buracos, e alguns açudes passam semanas sem leitura. Os dias sem leitura simplesmente não aparecem: não há linha com zero. Por isso a `variacao_volume_m3` pode cobrir mais de um dia; confira a data da linha anterior.
- **A variação não é a água que entrou.** A AESA chama essa coluna de "afluência", mas ela é sempre o volume menos o da leitura anterior, conferido em todas as leituras do Coremas. Ou seja, é o saldo, já descontadas evaporação e retirada. O nome aqui diz o que o número é.
- **Os registros antigos são esparsos.** A leitura diária só se torna regular por volta de 2012. Antes disso há anos com poucas dezenas de medições.
- **Precisão:** os números foram arredondados em duas casas decimais, a mesma precisão em que a AESA publica porcentagem e cota. Volume e área vêm da agência com um resíduo de arredondamento do computador, como `63732.00000000013`, que foi limpo.
- **Formato do CSV:** vírgula entre colunas, ponto decimal, UTF-8. Se o Excel em português abrir tudo numa coluna só, use o arquivo `.xlsx` ou baixe pela página do açude no Águas PB.

## Como é atualizado

O histórico de cada açude foi carregado da AESA uma vez, em novembro de 2026. Desde então, todo dia o Águas PB consulta a agência e acrescenta a leitura nova de cada açude que foi medido, num único commit. A cada atualização, os arquivos com todos os açudes são gerados de novo e publicados nos endereços acima.

Se uma leitura antiga for corrigida pela AESA depois de publicada, a correção não chega aqui sozinha: só leituras novas são acrescentadas.

## Uso dos dados

São dados públicos, medidos e publicados pela AESA, que não publica nenhuma licença com condições de uso. Este repositório também não acrescenta condição nenhuma. Só pedimos que a fonte citada seja a **AESA**, que é quem mede. Se esta compilação ajudou, mencionar o Águas PB é bem-vindo, mas não é obrigatório.
