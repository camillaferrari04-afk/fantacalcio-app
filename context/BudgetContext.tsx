'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BudgetContextType {
  budgetTotale: number;
  setBudgetTotale: (val: number) => void;
  totaleSpeso: number;
  saldoRimanente: number;
  refreshBudget: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgetTotale, setBudgetTotale] = useState<number>(500); // Default 500 crediti
  const [totaleSpeso, setTotaleSpeso] = useState<number>(0);

  // Calcola il totale speso leggendo i calciatori acquistati da Supabase
  const refreshBudget = async () => {
    const { data, error } = await supabase
      .from('calciatori')
      .select('prezzo_acquisto')
      .eq('acquistato', true);

    if (!error && data) {
      const spesi = data.reduce((acc, curr) => acc + (curr.prezzo_acquisto || 0), 0);
      setTotaleSpeso(spesi);
    }
  };

  useEffect(() => {
    refreshBudget();
  }, []);

  const saldoRimanente = budgetTotale - totaleSpeso;

  return (
    <BudgetContext.Provider
      value={{
        budgetTotale,
        setBudgetTotale,
        totaleSpeso,
        saldoRimanente,
        refreshBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget deve essere usato all\'interno di un BudgetProvider');
  }
  return context;
}