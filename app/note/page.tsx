'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function PaginaNote() {
  const [testo, setTesto] = useState('');
  const [statoSalvataggio, setStatoSalvataggio] = useState<'salvato' | 'salvataggio' | 'errore'>('salvato');
  const [loading, setLoading] = useState(true);
  
  // Timer per l'auto-salvataggio automatico mentre scrivi
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      const { data, error } = await supabase
        .from('app_notes')
        .select('testo')
        .eq('id', 1)
        .single();

      if (!error && data) {
        setTesto(data.testo || '');
      }
      setLoading(false);
    };

    fetchNote();
  }, []);

  const salvaNote = async (nuovoTesto: string) => {
    setStatoSalvataggio('salvataggio');

    const { error } = await supabase
      .from('app_notes')
      .upsert({ id: 1, testo: nuovoTesto });

    if (error) {
      console.error('Errore durante il salvataggio:', error.message);
      setStatoSalvataggio('errore');
    } else {
      setStatoSalvataggio('salvato');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTesto(val);
    setStatoSalvataggio('salvataggio');

    // Auto-salva 1 secondo dopo la fine della digitazione
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      salvaNote(val);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-lg font-medium text-slate-500 animate-pulse">
          Caricamento note...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">📝 Blocco Note Asta</h2>
          <p className="text-xs text-slate-500">
            Annota strategie generali, svincoli, crediti degli avversari o promemoria.
          </p>
        </div>

        {/* Indicatore di salvataggio */}
        <div className="text-xs font-bold px-3 py-1.5 rounded-full border">
          {statoSalvataggio === 'salvato' && (
            <span className="text-emerald-700 bg-emerald-50 border-emerald-200">
              ✓ Salvato
            </span>
          )}
          {statoSalvataggio === 'salvataggio' && (
            <span className="text-amber-700 bg-amber-50 border-amber-200 animate-pulse">
              ⏳ Salvataggio...
            </span>
          )}
          {statoSalvataggio === 'errore' && (
            <span className="text-rose-700 bg-rose-50 border-rose-200">
              ❌ Errore salvataggio
            </span>
          )}
        </div>
      </div>

      {/* Casella di testo grande */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
        <textarea
          value={testo}
          onChange={handleChange}
          placeholder="Scrivi qui tutte le tue note generali sull'asta..."
          className="w-full h-[65vh] p-4 text-slate-800 text-base leading-relaxed border-0 focus:ring-0 focus:outline-none resize-none bg-transparent"
        />
      </div>
    </div>
  );
}