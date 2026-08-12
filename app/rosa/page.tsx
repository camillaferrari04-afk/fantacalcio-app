'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBudget } from '@/context/BudgetContext';

interface Calciatore {
  id: number;
  nome: string;
  squadra: string;
  r: string;
  prezzo_acquisto: number;
}

export default function PaginaRosa() {
  const [acquistati, setAcquistati] = useState<Calciatore[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshBudget } = useBudget();

  const fetchRosa = async () => {
    const { data, error } = await supabase
      .from('calciatori')
      .select('*')
      .eq('acquistato', true)
      .order('prezzo_acquisto', { ascending: false });

    if (error) {
      console.error('Errore durante il caricamento della rosa:', error.message);
    } else {
      setAcquistati(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRosa();
  }, []);

  // Annulla acquisto (rimuove il calciatore dalla rosa)
  const handleRimuovi = async (id: number) => {
    setAcquistati((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase
      .from('calciatori')
      .update({ acquistato: false, prezzo_acquisto: 0 })
      .eq('id', id);

    if (!error) {
      await refreshBudget();
    } else {
      fetchRosa();
    }
  };

  // Suddivisione per ruolo
  const portieri = acquistati.filter((c) => c.r?.toUpperCase() === 'P');
  const difensori = acquistati.filter((c) => c.r?.toUpperCase() === 'D');
  const centrocampisti = acquistati.filter((c) => c.r?.toUpperCase() === 'C');
  const attaccanti = acquistati.filter((c) => c.r?.toUpperCase() === 'A');

  // Calcolo spesa per reparto
  const spesaP = portieri.reduce((acc, curr) => acc + (curr.prezzo_acquisto || 0), 0);
  const spesaD = difensori.reduce((acc, curr) => acc + (curr.prezzo_acquisto || 0), 0);
  const spesaC = centrocampisti.reduce((acc, curr) => acc + (curr.prezzo_acquisto || 0), 0);
  const spesaA = attaccanti.reduce((acc, curr) => acc + (curr.prezzo_acquisto || 0), 0);
  const totaleSpesoRosa = spesaP + spesaD + spesaC + spesaA;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-lg font-medium text-slate-500 animate-pulse">
          Caricamento della tua squadra...
        </p>
      </div>
    );
  }

  const reparti = [
    { titolo: '🧤 Portieri', lista: portieri, spesa: spesaP, badgeColor: 'bg-amber-500' },
    { titolo: '🛡️ Difensori', lista: difensori, spesa: spesaD, badgeColor: 'bg-emerald-600' },
    { titolo: '⚙️ Centrocampisti', lista: centrocampisti, spesa: spesaC, badgeColor: 'bg-blue-600' },
    { titolo: '🎯 Attaccanti', lista: attaccanti, spesa: spesaA, badgeColor: 'bg-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Scheda Riepilogo Totale */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-indigo-400">
            La Mia Squadra
          </h2>
          <p className="text-xs text-slate-400">
            Giocatori in rosa: <span className="font-bold text-white">{acquistati.length}</span>
          </p>
        </div>

        <div className="flex gap-4 text-center">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">
              Totale Speso
            </span>
            <span className="text-lg font-black text-amber-400">{totaleSpesoRosa} cr</span>
          </div>
        </div>
      </div>

      {acquistati.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-bold text-base">Nessun giocatore acquistato.</p>
          <p className="text-xs text-slate-400 mt-1">
            Premi su "+ Compra" nella Home o nelle Fasce durante l'asta per aggiungere i tuoi giocatori!
          </p>
        </div>
      ) : (
        /* Disposizione della Rosa a righe centrate tipo formazione */
        <div className="space-y-6 bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200">
          {reparti.map((rep) => (
            <div key={rep.titolo} className="space-y-3">
              {/* Header Reparto */}
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${rep.badgeColor}`} />
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    {rep.titolo} ({rep.lista.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                  {rep.spesa} cr spesi
                </span>
              </div>

              {/* Righe Centrate Giocatori */}
              {rep.lista.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
                  {rep.lista.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 hover:border-indigo-400 p-2.5 rounded-xl shadow-sm flex items-center justify-between gap-3 min-w-[160px] sm:min-w-[190px] transition-all"
                    >
                      <div className="truncate">
                        <p className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">
                          {c.nome}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {c.squadra}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 whitespace-nowrap">
                          {c.prezzo_acquisto} cr
                        </span>
                        <button
                          onClick={() => handleRimuovi(c.id)}
                          className="text-slate-300 hover:text-rose-500 font-bold text-xs px-1"
                          title="Rimuovi dalla rosa"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 bg-white/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">Nessun acquisto in questo reparto</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}