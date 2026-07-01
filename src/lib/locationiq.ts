import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

export interface LocationIQResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export const searchAddress = async (
  query: string,
): Promise<LocationIQResult[]> => {
  if (!query.trim()) return [];

  const { data } = await axios.get<LocationIQResult[]>(
    "https://api.locationiq.com/v1/autocomplete",
    {
      params: {
        key: API_KEY,
        q: query,
        limit: 5,
        format: "json",
        dedupe: 1,
        addressdetails: 1,
        countrycodes: "us",
      },
    },
  );

  return data;
};
