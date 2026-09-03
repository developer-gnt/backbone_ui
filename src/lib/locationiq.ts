import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

export interface LocationIQResult {
  place_id?: string;
  display_name: string;
  display_place?: string;
  display_address?: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    street?: string;
    pedestrian?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    suburb?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

const queryCache = new Map<string, LocationIQResult[]>();

export const searchAddress = async (
  query: string,
  signal?: AbortSignal,
): Promise<LocationIQResult[]> => {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)!;
  }

  try {
    const { data } = await axios.get<LocationIQResult[]>(
      "https://api.locationiq.com/v1/autocomplete",
      {
        signal,
        params: {
          key: API_KEY,
          q: trimmed,
          limit: 8,
          format: "json",
          dedupe: 1,
          addressdetails: 1,
          normalizecity: 1,
          countrycodes: "us",
        },
      },
    );

    const results = Array.isArray(data) ? data : [];
    queryCache.set(cacheKey, results);
    return results;
  } catch (err: any) {
    if (axios.isCancel(err) || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
      return [];
    }
    throw err;
  }
};
