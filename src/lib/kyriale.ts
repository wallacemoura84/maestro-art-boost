/*
 * Kyriale (Graduale Romanum / Liber Usualis, Solesmes 1961).
 * Transcrições GABC do GregoBase (gregobase.selapa.net), licença CC0,
 * em public/kyriale/. O uso litúrgico segue as rubricas do Liber Usualis.
 */
import { romano } from "@/lib/gabc";

export type ParteOrdinario = "kyrie" | "gloria" | "sanctus" | "agnus";

export const NOMES_PARTES: Record<ParteOrdinario, string> = {
  kyrie: "Kyrie",
  gloria: "Gloria",
  sanctus: "Sanctus",
  agnus: "Agnus Dei",
};

export interface Missa {
  numero: number;
  nome: string;
  uso: string;
}

export const MISSAS: Missa[] = [
  { numero: 1, nome: "Lux et origo", uso: "Tempo Pascal" },
  { numero: 2, nome: "Kyrie fons bonitatis", uso: "Festas de 1ª classe" },
  { numero: 3, nome: "Kyrie Deus sempiterne", uso: "Festas de 1ª classe" },
  { numero: 4, nome: "Cunctipotens Genitor Deus", uso: "Festas de 2ª classe" },
  { numero: 5, nome: "Kyrie magnæ Deus potentiæ", uso: "Festas de 2ª classe" },
  { numero: 6, nome: "Kyrie Rex Genitor", uso: "Festas de 2ª classe" },
  { numero: 7, nome: "Kyrie Rex splendens", uso: "Festas de 2ª classe" },
  { numero: 8, nome: "De Angelis", uso: "Festas de 2ª classe" },
  { numero: 9, nome: "Cum jubilo", uso: "Festas de Nossa Senhora" },
  { numero: 10, nome: "Alme Pater", uso: "Festas de Nossa Senhora" },
  { numero: 11, nome: "Orbis factor", uso: "Domingos do ano" },
  { numero: 12, nome: "Pater cuncta", uso: "Festas de 3ª classe" },
  { numero: 13, nome: "Stelliferi Conditor orbis", uso: "Festas de 3ª classe" },
  { numero: 14, nome: "Jesu Redemptor", uso: "Festas de 3ª classe" },
  { numero: 15, nome: "Dominator Deus", uso: "Memórias" },
  { numero: 16, nome: "Missa XVI", uso: "Dias de semana do ano" },
  { numero: 17, nome: "Missa XVII", uso: "Domingos do Advento e da Quaresma" },
  { numero: 18, nome: "Deus Genitor alme", uso: "Dias de semana do Advento e da Quaresma" },
];

// As Missas XVI a XVIII não têm Gloria (são para dias sem Gloria).
export function partesDaMissa(m: Missa): ParteOrdinario[] {
  return m.numero <= 15 ? ["kyrie", "gloria", "sanctus", "agnus"] : ["kyrie", "sanctus", "agnus"];
}

export const CREDOS = [1, 2, 3, 4, 5, 6];

export interface PecaKyriale {
  id: string;
  arquivo: string;
  titulo: string;
  subtitulo: string;
}

export function pecaDaMissa(m: Missa, parte: ParteOrdinario): PecaKyriale {
  const n = String(m.numero).padStart(2, "0");
  const r = romano(m.numero);
  return {
    id: `missa-${n}-${parte}`,
    arquivo: `/kyriale/missa-${n}-${parte}.gabc`,
    titulo: `${NOMES_PARTES[parte]} ${r}`,
    subtitulo:
      m.numero >= 16 && m.numero <= 17
        ? `Kyriale · Missa ${r}`
        : `Kyriale · Missa ${r} · ${m.nome}`,
  };
}

export function pecaDoCredo(n: number): PecaKyriale {
  return {
    id: `credo-${n}`,
    arquivo: `/kyriale/credo-${n}.gabc`,
    titulo: `Credo ${romano(n)}`,
    subtitulo: "Kyriale · Credo",
  };
}

export function todasAsPecas(): PecaKyriale[] {
  return [
    ...MISSAS.flatMap((m) => partesDaMissa(m).map((p) => pecaDaMissa(m, p))),
    ...CREDOS.map(pecaDoCredo),
  ];
}
