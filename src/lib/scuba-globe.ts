import scubaSeasons from "@/data/scuba-seasons.json";

export type ScubaSeasonWindow = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

export type ScubaSeasonEntry = {
  id: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  season: ScubaSeasonWindow;
  notes: string;
};

export type ScubaGlobeMarker = {
  lat: number;
  lng: number;
  label: string;
  color: string;
};

const scubaEntries = scubaSeasons as ScubaSeasonEntry[];

const formatMonthDay = (month: number, day: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month - 1, day)));

const getDayOfYear = (month: number, day: number) => {
  const date = new Date(Date.UTC(2024, month - 1, day));
  const startOfYear = new Date(Date.UTC(2024, 0, 1));

  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000) + 1;
};

export const formatSeasonWindow = (season: ScubaSeasonWindow) =>
  `${formatMonthDay(season.startMonth, season.startDay)} - ${formatMonthDay(season.endMonth, season.endDay)}`;

export const isDateInSeason = (date: Date, season: ScubaSeasonWindow) => {
  const targetDayOfYear = getDayOfYear(date.getUTCMonth() + 1, date.getUTCDate());
  const startDayOfYear = getDayOfYear(season.startMonth, season.startDay);
  const endDayOfYear = getDayOfYear(season.endMonth, season.endDay);

  if (startDayOfYear <= endDayOfYear) {
    return targetDayOfYear >= startDayOfYear && targetDayOfYear <= endDayOfYear;
  }

  return targetDayOfYear >= startDayOfYear || targetDayOfYear <= endDayOfYear;
};

export const getScubaGlobeData = (date = new Date()) => {
  const markers: ScubaGlobeMarker[] = scubaEntries.map((entry) => {
    const isInSeason = isDateInSeason(date, entry.season);
    const seasonWindow = formatSeasonWindow(entry.season);

    return {
      lat: entry.lat,
      lng: entry.lng,
      color: isInSeason ? "#2dd4bf" : "#fb7185",
      label: `${entry.country} • ${entry.region}
${isInSeason ? "In season" : "Out of season"} (${seasonWindow})
${entry.notes}`,
    };
  });

  return {
    markers,
    highlightedCountries: scubaEntries.map((entry) => entry.country),
  };
};
