'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Calciatore {
  id: number;
  nome: string;
  squadra: string;
  r: string;
  fvm: number;
  note: string;
  prezzo_consigliato: number;
}

export default function Home() {
  const [calciatori, setCalciatori] = useState<Calciatore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalciatori() {
      const { data, error } = await supabase
        .from('calciatori')
        .select('*')
        .limit(20);

      if (!error && data) {
        setCalciatori(data);
      }
      setLoading(false);
    }

    fetchCalciatori();
  }, []);

  if (loading) return <p className="p-8 text-center">Caricamento listone...</p>;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Taccuino Asta Fantacalcio</h1>
      <div className="grid gap-3">
        {calciatori.map((c) => (
          <div key={c.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{c.nome}</span>
                <span className="text-sm px-2 py-0.5 bg-gray-100 rounded">{c.squadra}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">{c.r}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Note: {c.note || 'Nessuna nota'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">FVM: {c.fvm}</span>
              <span className="font-semibold text-green-600">Max: {c.prezzo_consigliato} cr</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}