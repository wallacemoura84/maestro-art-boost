/*
 * Utilidades de GABC: cabeçalho (name:, office-part:, mode:, annotation:),
 * corpo da partitura e configuração visual do exsurge.
 */
import type { ExsurgeContext } from "@/lib/canto-midi";

export interface CabecalhoGabc {
  nome?: string;
  parte?: string;
  modo?: string;
  anotacao?: string;
}

// Lê o cabeçalho antes do "%%". Ignora linhas que não são "campo: valor;".
export function lerCabecalho(texto: string): CabecalhoGabc {
  const fim = texto.indexOf("%%");
  if (fim < 0) return {};
  const campos = new Map<string, string>();
  for (const linha of texto.slice(0, fim).split(/\r?\n/)) {
    const m = linha.match(/^\s*([\w-]+)\s*:\s*(.*?)\s*;?\s*$/);
    if (m && m[2]) campos.set(m[1]!.toLowerCase(), m[2]);
  }
  const cab: CabecalhoGabc = {};
  const nome = campos.get("name");
  const parte = campos.get("office-part");
  const modo = campos.get("mode");
  const anotacao = campos.get("annotation");
  if (nome) cab.nome = nome;
  if (parte) cab.parte = parte;
  if (modo) cab.modo = modo;
  if (anotacao) cab.anotacao = anotacao;
  return cab;
}

// Aceita GABC com cabeçalho ou só o corpo.
export function corpoGabc(texto: string) {
  const i = texto.indexOf("%%");
  return i >= 0 ? texto.slice(i + 2) : texto;
}

const ESPECIAIS: Record<string, string> = {
  "V/": "℣",
  "R/": "℟",
  "A/": "Ⱥ",
  "*": "*",
  "+": "†",
  ae: "æ",
  oe: "œ",
  "'ae": "ǽ",
  "'oe": "œ́",
};

/*
 * O exsurge entende só parte do GABC do Gregorio (o formato do GregoBase).
 * Nas sílabas, converte as tags de estilo para as marcações do exsurge
 * (_itálico_, *negrito*, %versalete%) e tira o que ele mostraria como texto.
 * As notas, entre parênteses, ficam como estão.
 */
export function prepararParaExsurge(corpo: string) {
  return corpo
    .split(/(\([^)]*\))/)
    .map((trecho, i) => {
      if (i % 2 === 1) return trecho; // notas
      return trecho
        .replace(/<sp>([^<]*)<\/sp>/g, (_, s: string) => ESPECIAIS[s] ?? s)
        .replace(/<(alt|v)>[\s\S]*?<\/\1>/g, "")
        .replace(/<i>([\s\S]*?)<\/i>/g, "_$1_")
        .replace(/<b>([\s\S]*?)<\/b>/g, "*$1*")
        .replace(/<sc>([\s\S]*?)<\/sc>/g, "%$1%")
        .replace(/<\/?[a-z]+>/g, "")
        .replace(/~/g, "");
    })
    .join("");
}

const ROMANOS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function romano(n: number) {
  let r = "";
  for (const [v, s] of ROMANOS)
    while (n >= v) {
      r += s;
      n -= v;
    }
  return r;
}

// "8" vira "VIII"; modos como "per" ou "2*" ficam como vieram.
export function modoRomano(modo: string) {
  const n = Number(modo);
  return Number.isInteger(n) && n >= 1 && n <= 8 ? romano(n) : modo;
}

const PARTES: Record<string, string> = {
  alleluia: "Aleluia",
  antiphona: "Antífona",
  canticum: "Cântico",
  communio: "Comunhão",
  graduale: "Gradual",
  hymnus: "Hino",
  introitus: "Intróito",
  kyriale: "Kyriale",
  kyrie: "Kyrie",
  gloria: "Gloria",
  credo: "Credo",
  sanctus: "Sanctus",
  "agnus dei": "Agnus Dei",
  offertorium: "Ofertório",
  psalmus: "Salmo",
  responsorium: "Responsório",
  "responsorium breve": "Responsório breve",
  sequentia: "Sequência",
  tractus: "Trato",
  varia: "Canto",
};

export function nomeDaParte(parte: string) {
  return PARTES[parte.trim().toLowerCase()] ?? parte;
}

export const COR_TINTA = "#1a2233";
export const COR_RUBRICA = "#a33a2c";

// Mesmas fontes e cores do site; tamanho da letra ajustável (partitura x guia).
export function configurarContexto(ctxt: ExsurgeContext, tamanhoLetra = 22) {
  ctxt.lyricTextFont = "'Cormorant Garamond', Georgia, serif";
  ctxt.lyricTextSize = tamanhoLetra;
  ctxt.lyricTextColor = COR_TINTA;
  ctxt.dropCapTextFont = ctxt.lyricTextFont;
  ctxt.dropCapTextSize = Math.round(tamanhoLetra * 3.3);
  ctxt.dropCapTextColor = COR_RUBRICA;
  ctxt.annotationTextFont = "'Manrope', system-ui, sans-serif";
  ctxt.annotationTextSize = 12;
  ctxt.annotationTextColor = COR_RUBRICA;
  ctxt.neumeLineColor = COR_TINTA;
  ctxt.staffLineColor = COR_RUBRICA;
  ctxt.dividerLineColor = COR_TINTA;
}
