'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Calciatore {
  id: number;
  nome: string;
  squadra: string;
  r: string;
  fvm: number;
  note: string | null;
  prezzo_consigliato: number | null;
}

export default function Home() {
  const [calciatori, setCalciatori] = useState<Calciatore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ruoloFiltro, setRuoloFiltro] = useState('TUTTI');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Carica i calciatori da Supabase
  useEffect(() => {
    async function fetchCalciatori() {
      const { data, error } = await supabase
        .from('calciatori')
        .select('*')
        .order('fvm', { ascending: false }); // Ordina per FVM decrescente

      if (error) {
        console.error('Errore durante il caricamento:', error.message);
      } else {
        setCalciatori(data || []);
      }
      setLoading(false);
    }

    fetchCalciatori();
  }, []);

  // Aggiorna nota o prezzo consigliato su Supabase
  const handleUpdate = async (id: number, field: 'note' | 'prezzo_consigliato', value: string | number) => {
    setSavingId(id);

    // Aggiornamento locale immediato per reattività UI
    setCalciatori((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    // Aggiornamento su Supabase
    const { error } = await supabase
      .from('calciatori')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error(`Errore durante l'aggiornamento di ${field}:`, error.message);
      alert("Errore nel salvataggio! Verifica le politiche (RLS) della tabella su Supabase.");
    }

    setSavingId(null);
  };

  // Badge colore per ruolo
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
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Filtraggio dinamico dei calciatori
  const calciatoriFiltrati = calciatori.filter((c) => {
    const matchNome = c.nome.toLowerCase().includes(search.toLowerCase()) || 
                      c.squadra.toLowerCase().includes(search.toLowerCase());
    const matchRuolo = ruoloFiltro === 'TUTTI' || c.r?.toUpperCase() === ruoloFiltro;
    return matchNome && matchRuolo;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-lg font-medium text-slate-600 animate-pulse">Caricamento taccuino fantacalcio...</p>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 min-h-screen bg-slate-50">
      {/* Header e Titolo */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Taccuino Asta Fantacalcio
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {calciatoriFiltrati.length} calciatori trovati
        </p>
      </header>

      {/* Barra di ricerca e filtri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Cerca calciatore o squadra..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
        />

        <div className="flex gap-1.5 bg-slate-200 p-1 rounded-xl">
          {['TUTTI', 'P', 'D', 'C', 'A'].map((r) => (
            <button
              key={r}
              onClick={() => setRuoloFiltro(r)}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${
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

      {/* Griglia Calciatori */}
      <div className="grid gap-4">
        {calciatoriFiltrati.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Info Calciatore */}
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
                <span className="text-xs text-slate-400 font-medium">FVM: {c.fvm ?? '-'}</span>
              </div>
            </div>

            {/* Input Modificabili (Prezzo e Note) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
              {/* Input Prezzo Consigliato */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Max (cr):</label>
                <input
                  type="number"
                  defaultValue={c.prezzo_consigliato ?? ''}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    if (val !== c.prezzo_consigliato) handleUpdate(c.id, 'prezzo_consigliato', val);
                  }}
                  className="w-20 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-bold text-emerald-600 text-right"
                  placeholder="0"
                />
              </div>

              {/* Input Note */}
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  defaultValue={c.note ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (c.note ?? '')) handleUpdate(c.id, 'note', e.target.value);
                  }}
                  className="w-full sm:w-64 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 text-slate-700"
                  placeholder="Aggiungi una nota..."
                />
              </div>

              {/* Indicatore di salvataggio */}
              {savingId === c.id && (
                <span className="text-xs text-indigo-500 animate-pulse font-medium">Salvataggio...</span>
              )}
            </div>
          </div>
        ))}

        {calciatoriFiltrati.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">Nessun calciatore trovato con questi criteri.</p>
          </div>
        )}
      </div>
    </main>
  );
}