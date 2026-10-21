// Cantos de exemplo em GABC, tirados da página de testes do exsurge.
export interface ExemploGabc {
  id: string;
  titulo: string;
  subtitulo: string;
  anotacao: string;
  gabc: string;
}

export const EXEMPLOS_GABC: ExemploGabc[] = [
  {
    id: "christus",
    titulo: "Christus factus est",
    subtitulo: "Gradual · Quinta-feira Santa",
    anotacao: "V",
    gabc: "(c4) CHris(ffg)tus(f.) *(,) fac(fg)tus(f) est(f') pro(f) no(ghF'ED.g_e/fg)bis(f.) (;) o(f)bé(hf/gh!jj/kjk)di(jij)ens(h_g) (,) us(h!jjh)que(f.) ad(ixfiH'Gh) mor(fgf___)tem,(f.) (:) mor(ixf!hhi)tem(g) au(ixgjj//)tem(j.h!iw!jvIG'hw!ivHG) cru(fv.ff)cis.(f_c) (,) (fg!hvGF.e!g'h//fhg/hggf.) V/.(z0::c3)  Prop(d)ter(d) quod(d) et(fe~) De(eh)us(h.) (,) e(h)xal(h)tá(h)vit(h) il(h)lum,(ihhe.//hih___/ihhe.) (,) (hi!kv//lvKI'jvHF.) (,) (h_g/ijh'___ jvIH'jvIH'//hvGF.) (:) et(f) de(f!h'i)dit(i) il(i)li(ih/jki/hhf.) (,) no(hf/hhh)men,(h.f!gwh!iv.hi/jhh/iih.) (;) quod(d) est(d) su(d)per(d) o(dfE'D)mne(ef) *() no(fhG'Fhhh)men.(hhf.) (,) (gxg_fgvED.fgED.fehv.hhhff//dfe/feed.) (::)",
  },
  {
    id: "puer",
    titulo: "Puer natus est",
    subtitulo: "Intróito · Natal, Missa do Dia",
    anotacao: "VII",
    gabc: "(c3) PU(ei)ER(i) *() na(iji)tus(h) est(hhh) no(ih/ji)bis,(i) (;) et(ei~) fí(iji)li(hg)us(f) da(hhi)tus(h) est(h) no(hihh)bis:(efe) (:) cu(e)jus(f) im(h)pé(gi!jk)ri(ih)um(h) (,) su(h)per(h) hú(ih/ji)me(hg)rum(hhh) e(hf//hghvGF)jus:(gf) (:) et(hg) vo(h)cá(hji)bi(h)tur(hhh) no(h)men(hhh) e(highvGF)jus,(gf) (;) ma(hj)gni(i) con(eh~)sí(h)li(hhhf)i(f) An(fhf!gwh)ge(efe)lus.(e) Ps.(::) Can(ehg)tá(hi)te(i) Dó(i)mi(i)no(i) cán(ik)ti(j)cum(j) no(ji)vum:(ij) *(:) qui(ig)a(hi) mi(i)ra(i)bí(i!jwk)li(i)a(h) fe(hhh)cit.(fe) (::) Gló(ehg)ri(hi)a(i) Pa(i)tri.(i) (::) E(i) u(i!jwk) o(i) u(h) a(hhh) e.(fe) (::)",
  },
];
