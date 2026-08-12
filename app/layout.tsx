'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BudgetProvider, useBudget } from '@/context/BudgetContext';

function HeaderAndNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { saldoRimanente, budgetTotale, totaleSpeso } = useBudget();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-20">
      {/* Header Fisso in Alto */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-indigo-400">
            FantaAsta Live
          </h1>
          <p className="text-xs text-slate-400">Spesi: {totaleSpeso} cr</p>
        </div>

        {/* Badge Saldo Residuo */}
        <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-right">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
            Saldo Residuo
          </span>
          <span
            className={`text-lg font-black ${
              saldoRimanente < 50 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {saldoRimanente}{' '}
            <span className="text-xs font-normal text-slate-300">/ {budgetTotale} cr</span>
          </span>
        </div>
      </header>

      {/* Contenuto Principale della Pagina */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">{children}</main>

      {/* Banner di Navigazione Inferiore Fisso */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-6 py-2 flex justify-around items-center">
        <Link
          href="/fasce"
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            pathname === '/fasce' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-xl">🏷️</span>
          <span>Fasce</span>
        </Link>

        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            pathname === '/' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span>Home</span>
        </Link>

        <Link
          href="/rosa"
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            pathname === '/rosa' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-xl">⚽</span>
          <span>La Mia Rosa</span>
        </Link>
      </nav>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <BudgetProvider>
          <HeaderAndNav>{children}</HeaderAndNav>
        </BudgetProvider>
      </body>
    </html>
  );
}