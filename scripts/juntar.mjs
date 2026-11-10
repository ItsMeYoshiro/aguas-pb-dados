// Junta os arquivos diários de todos os açudes em dois arquivos para baixar:
//
//   saida/acudes-paraiba-diario.csv   CSV, vírgula e ponto decimal
//   saida/acudes-paraiba-diario.xlsx  Excel, com data e número de verdade
//
// Uma linha por açude e dia, com o cadastro do açude repetido em cada linha:
// é o formato que tabela dinâmica e qualquer programa de análise esperam.
//
// Roda no GitHub a cada atualização (.github/workflows/juntar.yml), que publica
// os dois na versão "dados" do repositório. Não fala com a AESA: só lê o que já
// está aqui.
//
//   node scripts/juntar.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { xlsx } from "./xlsx.mjs";

const SAIDA = "saida";

/** Lê o CSV deste repositório. Aceita aspas, mas não quebra de linha dentro
 *  delas, que nada aqui escreve. */
function lerCsv(texto) {
  const separar = (l) => {
    const saida = [];
    let atual = "";
    let aspas = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (aspas) {
        if (c === '"' && l[i + 1] === '"') {
          atual += '"';
          i++;
        } else if (c === '"') aspas = false;
        else atual += c;
      } else if (c === '"') aspas = true;
      else if (c === ",") {
        saida.push(atual);
        atual = "";
      } else atual += c;
    }
    saida.push(atual);
    return saida;
  };
  const [cabecalho, ...linhas] = texto
    .split(/\r?\n/)
    .filter((l) => l.length)
    .map(separar);
  return { cabecalho, linhas };
}

const celula = (s) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const numero = (s) => (s === "" ? null : Number(s));

const acudes = lerCsv(readFileSync("acudes.csv", "utf8"));
const col = Object.fromEntries(acudes.cabecalho.map((c, i) => [c, i]));

const CADASTRO = ["id", "nome", "municipio", "bacia", "capacidade_m3"];
let cabecalhoDiario = null;
const csv = [];
const linhasXlsx = [];

for (const a of acudes.linhas) {
  const caminho = a[col.arquivo];
  let texto;
  try {
    texto = readFileSync(caminho, "utf8");
  } catch {
    console.log(`sem arquivo: ${caminho}`);
    continue;
  }
  const d = lerCsv(texto);
  cabecalhoDiario ??= d.cabecalho;
  const cadastro = CADASTRO.map((c) => a[col[c]]);
  const cadastroCsv = cadastro.map(celula).join(",");
  for (const l of d.linhas) {
    csv.push(`${cadastroCsv},${l.map(celula).join(",")}`);
    linhasXlsx.push([
      Number(cadastro[0]),
      cadastro[1],
      cadastro[2],
      cadastro[3],
      numero(cadastro[4]),
      Date.parse(`${l[0]}T00:00:00Z`),
      ...l.slice(1).map(numero),
    ]);
  }
}

if (!cabecalhoDiario) {
  console.error("Nenhum arquivo diário encontrado.");
  process.exit(1);
}

/** O Excel abre no máximo 1.048.576 linhas por aba. Se um dia a soma passar
 *  disso, a planilha sai cortada sem aviso nenhum — melhor falhar aqui. */
const LIMITE_EXCEL = 1_048_575;
if (linhasXlsx.length > LIMITE_EXCEL) {
  console.error(`${linhasXlsx.length} linhas, acima do limite do Excel (${LIMITE_EXCEL}).`);
  process.exit(1);
}

mkdirSync(SAIDA, { recursive: true });
writeFileSync(
  `${SAIDA}/acudes-paraiba-diario.csv`,
  [[...CADASTRO, ...cabecalhoDiario].join(","), ...csv].join("\n") + "\n",
);

const colunasXlsx = [
  { titulo: "id", tipo: "inteiro", largura: 6 },
  { titulo: "nome", tipo: "texto", largura: 32 },
  { titulo: "municipio", tipo: "texto", largura: 24 },
  { titulo: "bacia", tipo: "texto", largura: 34 },
  { titulo: "capacidade_m3", tipo: "inteiro", largura: 16 },
  { titulo: "data", tipo: "data", largura: 12 },
  { titulo: "porcentagem", tipo: "decimal", largura: 13 },
  { titulo: "volume_m3", tipo: "inteiro", largura: 15 },
  { titulo: "cota_m", tipo: "decimal", largura: 10 },
  { titulo: "area_m2", tipo: "inteiro", largura: 14 },
  { titulo: "variacao_volume_m3", tipo: "inteiro", largura: 19 },
];
writeFileSync(`${SAIDA}/acudes-paraiba-diario.xlsx`, xlsx("Leituras diárias", colunasXlsx, linhasXlsx));

console.log(`${acudes.linhas.length} açudes, ${csv.length} leituras diárias`);
