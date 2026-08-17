'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBudget } from '@/context/BudgetContext';

interface Calciatore {
  id: number;
  nome: string;
  squadra: string;
  r: string;
  fvm: number;
  note: string | null;
  prezzo_consigliato: number | null;
  fascia: number | null;
  acquistato: boolean;
  prezzo_acquisto: number;
  preferito?: boolean;
}

export default function PaginaFasce() {
  const [calciatori, setCalciatori] = useState<Calciatore[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruoloSelezionato, setRuoloSelezionato] = useState<string>('P');
  const [modalCalciatore, setModalCalciatore] = useState<Calciatore | null>(null);
  const [prezzoInput, setPrezzoInput] = useState<string>('');

  const { refreshBudget } = useBudget();

  const fetchCalciatori = async () => {
    const { data, error } = await supabase
      .from('calciatori')
      .select('*')
      .or('fascia.not.is.null,preferito.eq.true')
      .order('fascia', { ascending: true })
      .order('fvm', { ascending: false });

    if (error) {
      console.error('Errore nel caricamento delle fasce:', error.message);
    } else {
      setCalciatori(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCalciatori();
  }, []);

  const handleOpenCompraModal = (c: Calciatore) => {
    setModalCalciatore(c);
    setPrezzoInput(c.prezzo_consigliato ? String(c.prezzo_consigliato) : '1');
  };

  const handleConfermaAcquisto = async () => {
    if (!modalCalciatore) return;
    const prezzo = Number(prezzoInput) || 1;

    setCalciatori((prev) =>
      prev.map((item) =>
        item.id === modalCalciatore.id
          ? { ...item, acquistato: true, prezzo_acquisto: prezzo }
          : item
      )
    );

    const { error } = await supabase
      .from('calciatori')
      .update({ acquistato: true, prezzo_acquisto: prezzo })
      .eq('id', modalCalciatore.id);

    if (!error) {
      await refreshBudget();
    } else {
      fetchCalciatori();
    }

    setModalCalciatore(null);
  };

  const handleRimuoviFascia = async (id: number) => {
    setCalciatori((prev) => prev.filter((item) => item.id !== id));

    await supabase
      .from('calciatori')
      .update({ fascia: null, preferito: false })
      .eq('id', id);
  };

  const calciatoriRuolo = calciatori.filter(
    (c) => c.r?.toUpperCase() === ruoloSelezionato
  );

  const preferitiRuolo = calciatoriRuolo.filter((c) => c.preferito);
  const fasceUniche = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-lg font-medium text-slate-500 animate-pulse">
          Caricamento fasce...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector Ruoli */}
      <div className="flex justify-center gap-1.5 sm:gap-2 bg-slate-200 p-1.5 rounded-2xl max-w-2xl w-full mx-auto overflow-x-auto">
        {[
          { key: 'P', label: '🧤 Portieri' },
          { key: 'D', label: '🛡️ Difensori' },
          { key: 'C', label: '⚙️ Centrocampisti' },
          { key: 'A', label: '🎯 Attaccanti' },
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => setRuoloSelezionato(r.key)}
            className={`flex-1 min-w-fit px-2 sm:px-4 py-2 font-bold text-xs sm:text-sm rounded-xl transition-all whitespace-nowrap ${
              ruoloSelezionato === r.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* SEZIONE PREFERITI - IN CIMA A TUTTO */}
        {preferitiRuolo.length > 0 && (
          <div className="bg-slate-200/80 border border-slate-300 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-400 text-slate-900 font-black text-xs rounded-lg flex items-center justify-center shadow-sm">
                  ⭐
                </span>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Preferiti
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-300/80 px-2.5 py-1 rounded-full">
                {preferitiRuolo.length} giocatori
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {preferitiRuolo.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    c.acquistato
                      ? 'bg-emerald-100/70 border-emerald-300 opacity-60'
                      : 'bg-white border-slate-300 shadow-sm hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {c.nome}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-200 px-1.5 py-0.5 rounded">
                        {c.squadra}
                      </span>
                      {c.fascia && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          F{c.fascia}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                      <span>FVM: {c.fvm ?? '-'}</span>
                      {c.prezzo_consigliato && (
                        <span className="text-emerald-700 font-bold">
                          Max: {c.prezzo_consigliato} cr
                        </span>
                      )}
                      {c.note && (
                        <span className="truncate max-w-[120px] text-slate-600">
                          📝 {c.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.acquistato ? (
                      <span className="text-xs font-black px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                        Preso ({c.prezzo_acquisto}cr)
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenCompraModal(c)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        + Compra
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA FASCE DA 1 A 8 */}
        {fasceUniche.map((numFascia) => {
          const giocatoriInFascia = calciatoriRuolo.filter(
            (c) => c.fascia === numFascia
          );

          if (giocatoriInFascia.length === 0) return null;

          return (
            <div
              key={numFascia}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-indigo-100 text-indigo-700 font-black text-xs rounded-lg flex items-center justify-center">
                    F{numFascia}
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Fascia {numFascia}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {giocatoriInFascia.length} giocatori
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {giocatoriInFascia.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      c.acquistato
                        ? 'bg-emerald-50/50 border-emerald-300 opacity-60'
                        : c.preferito
                        ? 'bg-slate-100 border-slate-300'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {c.preferito && '⭐ '}
                          {c.nome}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {c.squadra}
                        </span>
                      </div>
                      <div className="flex gap-3 text-[11px] text-slate-400 font-medium mt-0.5">
                        <span>FVM: {c.fvm ?? '-'}</span>
                        {c.prezzo_consigliato && (
                          <span className="text-emerald-600 font-bold">
                            Max: {c.prezzo_consigliato} cr
                          </span>
                        )}
                        {c.note && (
                          <span className="truncate max-w-[120px] text-slate-500">
                            📝 {c.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.acquistato ? (
                        <span className="text-xs font-black px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          Preso ({c.prezzo_acquisto}cr)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenCompraModal(c)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                        >
                          + Compra
                        </button>
                      )}

                      <button
                        onClick={() => handleRimuoviFascia(c.id)}
                        className="text-slate-300 hover:text-rose-500 text-xs px-1 font-bold"
                        title="Rimuovi da fasce"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {calciatoriRuolo.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-medium text-sm">
              Nessun giocatore inserito in fascia o preferito per questo ruolo.
            </p>
          </div>
        )}
      </div>

      {/* Modal Acquisto */}
      {modalCalciatore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Conferma Acquisto
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Prezzo per <span className="font-bold text-slate-800">{modalCalciatore.nome}</span>:
            </p>

            <div className="mb-6">
              <input
                type="number"
                value={prezzoInput}
                onChange={(e) => setPrezzoInput(e.target.value)}
                autoFocus
                className="w-full text-2xl font-black p-3 border-2 border-indigo-500 rounded-xl text-indigo-600 focus:outline-none bg-indigo-50/30"
                placeholder="Es. 25"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalCalciatore(null)}
                className="flex-1 py-2.5 font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleConfermaAcquisto}
                className="flex-1 py-2.5 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}