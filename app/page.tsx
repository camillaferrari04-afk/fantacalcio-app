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
}

export default function Home() {
  const [calciatori, setCalciatori] = useState<Calciatore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ruoloFiltro, setRuoloFiltro] = useState('TUTTI');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Stato per il Modal di Acquisto
  const [modalCalciatore, setModalCalciatore] = useState<Calciatore | null>(null);
  const [prezzoInput, setPrezzoInput] = useState<string>('');

  const { refreshBudget } = useBudget();

  // Carica i calciatori da Supabase
  const fetchCalciatori = async () => {
    const { data, error } = await supabase
      .from('calciatori')
      .select('*')
      .order('qt_i', { ascending: false });

    if (error) {
      console.error('Errore durante il caricamento:', error.message);
    } else {
      setCalciatori(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCalciatori();
  }, []);

  // Aggiorna un singolo campo (Note, Prezzo Consigliato, Fascia)
  const handleUpdate = async (
    id: number,
    field: 'note' | 'prezzo_consigliato' | 'fascia',
    value: string | number | null
  ) => {
    setSavingId(id);

    // Aggiornamento locale immediato
    setCalciatori((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    const { error } = await supabase
      .from('calciatori')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error(`Errore durante l'aggiornamento di ${field}:`, error.message);
      alert('Errore nel salvataggio! Riprova.');
      fetchCalciatori(); // Ripristina dati da DB
    }

    setSavingId(null);
  };

  // Apre il modal per acquistare
  const handleOpenCompraModal = (c: Calciatore) => {
    setModalCalciatore(c);
    setPrezzoInput(c.prezzo_consigliato ? String(c.prezzo_consigliato) : '1');
  };

  // Salva l'acquisto su Supabase
  const handleConfermaAcquisto = async () => {
    if (!modalCalciatore) return;

    const prezzo = Number(prezzoInput) || 1;

    // Update locale
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

    if (error) {
      alert('Errore durante il salvataggio dell\'acquisto');
      fetchCalciatori();
    } else {
      await refreshBudget(); // Aggiorna il saldo in alto
    }

    setModalCalciatore(null);
  };

  // Annulla l'acquisto di un giocatore
  const handleAnnullaAcquisto = async (id: number) => {
    setCalciatori((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, acquistato: false, prezzo_acquisto: 0 } : item
      )
    );

    const { error } = await supabase
      .from('calciatori')
      .update({ acquistato: false, prezzo_acquisto: 0 })
      .eq('id', id);

    if (!error) {
      await refreshBudget();
    } else {
      fetchCalciatori();
    }
  };

  // Colore del badge ruolo
  const getRuoloBadge = (ruolo: string) => {
    switch (ruolo?.toUpperCase()) {
      case 'P':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'D':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'C':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'A':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Filtro calciatori
  const calciatoriFiltrati = calciatori.filter((c) => {
    const matchNome =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.squadra.toLowerCase().includes(search.toLowerCase());
    const matchRuolo = ruoloFiltro === 'TUTTI' || c.r?.toUpperCase() === ruoloFiltro;
    return matchNome && matchRuolo;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-lg font-medium text-slate-500 animate-pulse">
          Caricamento taccuino...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra di ricerca e filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cerca calciatore o squadra..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
        />

        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl justify-between sm:justify-start">
          {['TUTTI', 'P', 'D', 'C', 'A'].map((r) => (
            <button
              key={r}
              onClick={() => setRuoloFiltro(r)}
              className={`px-3 py-1.5 font-bold text-sm rounded-lg transition-colors ${
                ruoloFiltro === r
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Calciatori */}
      <div className="grid gap-3">
        {calciatoriFiltrati.map((c) => (
          <div
            key={c.id}
            className={`p-4 bg-white border rounded-xl shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              c.acquistato
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-200 hover:shadow-md'
            }`}
          >
            {/* Info principali */}
            <div className="flex items-center gap-3">
              <span
                className={`w-9 h-9 flex items-center justify-center font-bold text-sm rounded-full border ${getRuoloBadge(
                  c.r
                )}`}
              >
                {c.r}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-slate-800">{c.nome}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase">
                    {c.squadra}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-slate-400 font-medium mt-0.5">
                  <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs text-slate-400 font-medium">Q.iniziale: {c.qt_i ?? '-'}</span>
                  <span className="text-xs text-slate-400 font-medium">Q.attuale: {c.qt_a ?? '-'}</span>
                  <span className="text-xs text-slate-400 font-medium">FVM: {c.fvm ?? '-'}</span>
                </div>
                </div>
              </div>
            </div>

            {/* Controlli e Azioni */}
            <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 justify-between md:justify-end">
              {/* Selettore Fascia */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-400 mr-1">Fascia:</span>
                {[1, 2, 3, 4, 5].map((f) => (
                  <button
                    key={f}
                    onClick={() => handleUpdate(c.id, 'fascia', c.fascia === f ? null : f)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${
                      c.fascia === f
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    F{f}
                  </button>
                ))}
              </div>

              {/* Max consigliato */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Max:</label>
                <input
                  type="number"
                  defaultValue={c.prezzo_consigliato ?? ''}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);
                    if (val !== c.prezzo_consigliato)
                      handleUpdate(c.id, 'prezzo_consigliato', val);
                  }}
                  className="w-16 p-1.5 text-xs font-bold border border-slate-300 rounded-lg text-right bg-slate-50 text-emerald-600"
                  placeholder="0"
                />
              </div>

              {/* Note */}
              <input
                type="text"
                defaultValue={c.note ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (c.note ?? '')) handleUpdate(c.id, 'note', e.target.value);
                }}
                className="w-full sm:w-40 p-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                placeholder="Note..."
              />

              {/* Bottone Compra / Acquistato */}
              {c.acquistato ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
                    Preso a {c.prezzo_acquisto} cr
                  </span>
                  <button
                    onClick={() => handleAnnullaAcquisto(c.id)}
                    className="text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCompraModal(c)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  + Compra
                </button>
              )}

              {savingId === c.id && (
                <span className="text-[10px] text-indigo-500 animate-pulse">Saving...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* POPUP / MODAL ACQUISTO */}
      {modalCalciatore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Conferma Acquisto
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              A quanti crediti hai acquistato <span className="font-bold text-slate-800">{modalCalciatore.nome}</span>?
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                Prezzo Pagato (Crediti)
              </label>
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