// Suggested places, per school. These are only suggestions: any text is accepted as a place.
// To add a school, add an entry to SCHOOLS with its email domain(s) and location groups.

export type PlaceGroup = { label: string; places: string[] };

export type School = {
  id: string;
  name: string;
  domains: string[]; // email domains, e.g. "mines.edu" (subdomains match too)
  groups: PlaceGroup[];
};

const COLORADO_AIRPORTS_AND_TRANSIT: PlaceGroup = {
  label: "Airports & transit",
  places: [
    "Denver International Airport (DEN)",
    "Colorado Springs Airport (COS)",
    "Rocky Mountain Metropolitan Airport (BJC)",
    "Denver Union Station",
  ],
};

const COLORADO_CITIES: PlaceGroup = {
  label: "Cities",
  places: [
    "Denver, CO",
    "Boulder, CO",
    "Fort Collins, CO",
    "Colorado Springs, CO",
    "Lakewood, CO",
    "Arvada, CO",
    "Westminster, CO",
    "Aurora, CO",
    "Littleton, CO",
    "Englewood, CO",
    "Broomfield, CO",
    "Longmont, CO",
    "Loveland, CO",
    "Greeley, CO",
    "Castle Rock, CO",
    "Pueblo, CO",
    "Idaho Springs, CO",
    "Estes Park, CO",
    "Glenwood Springs, CO",
    "Grand Junction, CO",
    "Durango, CO",
    "Cheyenne, WY",
  ],
};

const COLORADO_MOUNTAINS: PlaceGroup = {
  label: "Ski areas & mountains",
  places: [
    "Loveland Ski Area",
    "Arapahoe Basin",
    "Keystone",
    "Breckenridge",
    "Copper Mountain",
    "Winter Park",
    "Eldora",
    "Vail",
    "Beaver Creek",
    "Steamboat Springs",
    "Red Rocks Amphitheatre",
  ],
};

export const SCHOOLS: School[] = [
  {
    id: "mines",
    name: "Colorado School of Mines",
    domains: ["mines.edu"],
    groups: [
      {
        label: "Mines meetup spots",
        places: [
          "Mines: West Parking Garage",
          "Mines: East Parking Garage",
          "Mines: CTLM Parking Lot",
          "Mines: Visitor Parking Lot",
          "Mines: Ben H. Parker Student Center",
          "Mines: Kafadar Commons",
          "Mines: Arthur Lakes Library",
          "Mines: Student Recreation Center",
          "Mines: Mines Market",
          "Mines: Weaver Towers",
          "Mines: Elm Residence Hall",
          "Mines: Maple Hall",
          "Mines: Spruce Hall",
          "Mines: Aspen Hall",
          "Mines: Mines Park",
          "Mines: Starzer Welcome Center",
        ],
      },
      {
        label: "Mines lettered lots",
        places: ["A", "AA", "C", "D", "F", "K", "L", "M", "MB", "MPG", "N", "O", "Q", "R", "S", "T", "U", "W", "Z"].map(
          (l) => `Mines: Lot ${l}`,
        ),
      },
      {
        label: "Around Golden",
        places: [
          "Downtown Golden (Washington Ave)",
          "Golden Light Rail Station (W Line)",
          "Golden: King Soopers",
          "Golden: Safeway",
        ],
      },
      COLORADO_AIRPORTS_AND_TRANSIT,
      COLORADO_CITIES,
      COLORADO_MOUNTAINS,
    ],
  },
];

// Until more schools are added, unknown email domains get the first school's list.
export function schoolForEmail(email: string | null): School {
  const domain = email?.split("@")[1]?.toLowerCase() ?? "";
  return (
    SCHOOLS.find((s) => s.domains.some((d) => domain === d || domain.endsWith(`.${d}`))) ?? SCHOOLS[0]
  );
}
