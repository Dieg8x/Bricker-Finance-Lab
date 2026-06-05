export interface BanxicoRate {
  idSerie: string;
  titulo: string;
  fecha: string;
  dato: number;
}

export interface BanxicoResponse {
  bmx: {
    series: {
      idSerie: string;
      titulo: string;
      datos: { fecha: string; dato: string }[];
    }[];
  };
}

export type ActiveRates = Record<string, BanxicoRate>;

// Mapping of Banxico Series IDs to our internal keys
export const SERIES_MAP: Record<string, string> = {
  SF60633: "cetes28",
  SF60648: "tiie28",
  SF60649: "tiie91",
};

export async function fetchBanxicoRates(token: string): Promise<ActiveRates> {
  const series = Object.keys(SERIES_MAP).join(",");
  const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${series}/datos/oportuno`;
  
  // We use allorigins to bypass CORS, as Banxico API doesn't support CORS directly from the browser
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url + "?token=" + token)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error("Error fetching rates from proxy");
  }
  
  const proxyData = await response.json();
  const data: BanxicoResponse = JSON.parse(proxyData.contents);
  
  if (!data.bmx || !data.bmx.series) {
    throw new Error("Invalid response from Banxico");
  }

  const rates: ActiveRates = {};
  for (const serie of data.bmx.series) {
    if (serie.datos && serie.datos.length > 0) {
      const internalKey = SERIES_MAP[serie.idSerie];
      rates[internalKey] = {
        idSerie: serie.idSerie,
        titulo: serie.titulo,
        fecha: serie.datos[0].fecha,
        // Banxico returns percentages like 11.25. Our formulas use decimals (0.1125), but we want to fill the form in decimal format.
        // Wait, the form expects decimal format, or does it? 
        // In excelMap.ts: defaultValue for riskFreeRate is 0.0681, so it uses decimals!
        // So we divide by 100.
        dato: parseFloat(serie.datos[0].dato) / 100,
      };
    }
  }
  
  return rates;
}
