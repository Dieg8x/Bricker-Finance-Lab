import { useEffect, useState } from "react";
import { ActiveRates, fetchBanxicoRates } from "../lib/banxico";

interface Props {
  onRatesFetched: (rates: ActiveRates) => void;
}

export function BanxicoPanel({ onRatesFetched }: Props) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("banxico_token");
    if (savedToken) {
      setToken(savedToken);
    }
    const savedRates = localStorage.getItem("banxico_rates");
    const savedTime = localStorage.getItem("banxico_rates_time");
    if (savedRates && savedTime) {
      onRatesFetched(JSON.parse(savedRates));
      setLastFetched(new Date(parseInt(savedTime)).toLocaleString());
    }
  }, [onRatesFetched]);

  async function handleFetch() {
    if (!token) {
      setError("Ingresa un token de Banxico");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rates = await fetchBanxicoRates(token);
      localStorage.setItem("banxico_token", token);
      localStorage.setItem("banxico_rates", JSON.stringify(rates));
      const now = Date.now();
      localStorage.setItem("banxico_rates_time", now.toString());
      setLastFetched(new Date(now).toLocaleString());
      onRatesFetched(rates);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener tasas");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="no-print rounded-lg border border-brand/20 bg-brand/5 px-4 py-2 text-sm font-bold text-brand hover:bg-brand/10 transition-colors flex items-center gap-2"
      >
        <span role="img" aria-label="lightning">⚡</span> Tasas en tiempo real
      </button>
    );
  }

  return (
    <div className="no-print rounded-lg border border-brand bg-white p-5 shadow-lg max-w-sm w-full absolute top-16 right-5 z-10 md:right-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-ink">Tasas Banxico (Tiempo Real)</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-ink">✕</button>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Consulta las tasas vigentes de CETES y TIIE para rellenar las calculadoras automáticamente.
      </p>
      
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-ink">
          Token de Banxico (SIE API)
          <input 
            type="text" 
            placeholder="Pega tu token aquí..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
          />
        </label>
        
        <div className="flex justify-between items-center text-xs">
          <a 
            href="https://www.banxico.org.mx/SieAPIRest/service/v1/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            Obtener token gratis
          </a>
          {lastFetched && <span className="text-slate-400">Act: {lastFetched}</span>}
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button 
          onClick={handleFetch}
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-[#173d60] disabled:opacity-70 flex justify-center items-center"
        >
          {loading ? "Consultando..." : "Actualizar Tasas"}
        </button>
      </div>
    </div>
  );
}
