// Cópia, em JavaScript, de lib/xlsx.ts do site Águas PB, que monta as
// planilhas para baixar. Mantida igual de propósito: se uma mudar, a outra
// muda junto.
import { crc32, deflateRawSync } from "node:zlib";
/** Índice do estilo em `cellXfs`, na ordem em que aparecem em styles.xml. */
const ESTILO = { cabecalho: 1, data: 2, inteiro: 3, decimal: 4 };
const escapar = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** A, B, …, Z, AA… */
function letra(i) {
    let s = "";
    for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) {
        s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    }
    return s;
}
/** O Excel conta dias desde 30/12/1899. A medição é ancorada em meia-noite, e
 *  o dia sai em UTC pelo mesmo motivo de `dataEpoch`. */
const serialExcel = (ms) => Math.floor(ms / 86_400_000) + 25_569;
function celula(ref, tipo, v) {
    if (v == null || v === "")
        return "";
    if (tipo === "texto" || typeof v === "string") {
        return `<c r="${ref}" t="inlineStr"><is><t>${escapar(String(v))}</t></is></c>`;
    }
    if (!Number.isFinite(v))
        return "";
    if (tipo === "data")
        return `<c r="${ref}" s="${ESTILO.data}"><v>${serialExcel(v)}</v></c>`;
    return `<c r="${ref}" s="${ESTILO[tipo]}"><v>${v}</v></c>`;
}
function planilha(nomeAba, colunas, linhas) {
    const ultima = letra(colunas.length - 1);
    const area = `A1:${ultima}${linhas.length + 1}`;
    const cabecalho = colunas
        .map((c, i) => `<c r="${letra(i)}1" t="inlineStr" s="${ESTILO.cabecalho}"><is><t>${escapar(c.titulo)}</t></is></c>`)
        .join("");
    const corpo = linhas
        .map((l, j) => {
        const r = j + 2;
        return `<row r="${r}">${colunas.map((c, i) => celula(`${letra(i)}${r}`, c.tipo, l[i] ?? null)).join("")}</row>`;
    })
        .join("");
    const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const NS = "http://schemas.openxmlformats.org";
    return {
        "[Content_Types].xml": xml +
            `<Types xmlns="${NS}/package/2006/content-types">` +
            `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
            `<Default Extension="xml" ContentType="application/xml"/>` +
            `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
            `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
            `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
            `</Types>`,
        "_rels/.rels": xml +
            `<Relationships xmlns="${NS}/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
            `</Relationships>`,
        "xl/workbook.xml": xml +
            `<workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships">` +
            `<sheets><sheet name="${escapar(nomeAba)}" sheetId="1" r:id="rId1"/></sheets>` +
            // O filtro precisa deste nome definido; sem ele o Excel abre o arquivo
            // pedindo para "reparar".
            `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">` +
            `'${escapar(nomeAba)}'!$A$1:$${ultima}$${linhas.length + 1}</definedName></definedNames>` +
            `</workbook>`,
        "xl/_rels/workbook.xml.rels": xml +
            `<Relationships xmlns="${NS}/package/2006/relationships">` +
            `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
            `</Relationships>`,
        // Estilos, na ordem de ESTILO: 0 padrão, 1 cabeçalho em negrito, 2 data,
        // 3 inteiro com milhar (formato 3 do Excel), 4 duas casas com milhar (4).
        "xl/styles.xml": xml +
            `<styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
            `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>` +
            `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
            `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
            `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
            `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
            `<cellXfs count="5">` +
            `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
            `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
            `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
            `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
            `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
            `</cellXfs>` +
            `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
            `</styleSheet>`,
        "xl/worksheets/sheet1.xml": xml +
            `<worksheet xmlns="${NS}/spreadsheetml/2006/main">` +
            `<sheetViews><sheetView workbookViewId="0">` +
            `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
            `</sheetView></sheetViews>` +
            `<cols>${colunas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.largura}" customWidth="1"/>`).join("")}</cols>` +
            `<sheetData><row r="1">${cabecalho}</row>${corpo}</sheetData>` +
            `<autoFilter ref="${area}"/>` +
            `</worksheet>`,
    };
}
/** Um zip sem nada além do necessário: entradas comprimidas, diretório
 *  central e o registro de fim. Data dos arquivos fixa em 01/01/1980, a
 *  menor que o formato aceita — o arquivo sai idêntico a cada build. */
function zip(arquivos) {
    const locais = [];
    const centrais = [];
    let deslocamento = 0;
    const DATA_DOS = (0 << 9) | (1 << 5) | 1;
    for (const [nome, conteudo] of Object.entries(arquivos)) {
        const nomeBytes = Buffer.from(nome, "utf8");
        const cru = Buffer.from(conteudo, "utf8");
        const comprimido = deflateRawSync(cru, { level: 9 });
        const crc = crc32(cru);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4); // versão necessária
        local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
        local.writeUInt16LE(8, 8); // deflate
        local.writeUInt16LE(0, 10);
        local.writeUInt16LE(DATA_DOS, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(comprimido.length, 18);
        local.writeUInt32LE(cru.length, 22);
        local.writeUInt16LE(nomeBytes.length, 26);
        local.writeUInt16LE(0, 28);
        locais.push(local, nomeBytes, comprimido);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4); // feito por
        central.writeUInt16LE(20, 6); // versão necessária
        central.writeUInt16LE(0x0800, 8);
        central.writeUInt16LE(8, 10);
        central.writeUInt16LE(0, 12);
        central.writeUInt16LE(DATA_DOS, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(comprimido.length, 20);
        central.writeUInt32LE(cru.length, 24);
        central.writeUInt16LE(nomeBytes.length, 28);
        central.writeUInt32LE(deslocamento, 42);
        centrais.push(central, nomeBytes);
        deslocamento += 30 + nomeBytes.length + comprimido.length;
    }
    const tamanhoCentral = centrais.reduce((n, b) => n + b.length, 0);
    const fim = Buffer.alloc(22);
    fim.writeUInt32LE(0x06054b50, 0);
    const n = Object.keys(arquivos).length;
    fim.writeUInt16LE(n, 8);
    fim.writeUInt16LE(n, 10);
    fim.writeUInt32LE(tamanhoCentral, 12);
    fim.writeUInt32LE(deslocamento, 16);
    return new Uint8Array(Buffer.concat([...locais, ...centrais, fim]));
}
export function xlsx(nomeAba, colunas, linhas) {
    return zip(planilha(nomeAba, colunas, linhas));
}
