// Координаты крупных городов России
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'москва': [55.7558, 37.6173],
  'санкт-петербург': [59.9343, 30.3351],
  'новосибирск': [55.0084, 82.9357],
  'екатеринбург': [56.8389, 60.6057],
  'казань': [55.7961, 49.1064],
  'нижний новгород': [56.2965, 43.9361],
  'челябинск': [55.1644, 61.4368],
  'самара': [53.2001, 50.1500],
  'омск': [54.9885, 73.3242],
  'ростов-на-дону': [47.2357, 39.7015],
};

export const getCityCoordinates = (city: string): [number, number] | null => {
  const normalizedCity = city.toLowerCase().trim();
  return CITY_COORDINATES[normalizedCity] || null;
};