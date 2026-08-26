const LocationData = {
  US: {
    name: "United States",
    subdivisions: [
      ["US-AL", "Alabama"], ["US-AK", "Alaska"], ["US-AZ", "Arizona"], ["US-AR", "Arkansas"],
      ["US-CA", "California"], ["US-CO", "Colorado"], ["US-CT", "Connecticut"], ["US-DE", "Delaware"],
      ["US-FL", "Florida"], ["US-GA", "Georgia"], ["US-HI", "Hawaii"], ["US-ID", "Idaho"],
      ["US-IL", "Illinois"], ["US-IN", "Indiana"], ["US-IA", "Iowa"], ["US-KS", "Kansas"],
      ["US-KY", "Kentucky"], ["US-LA", "Louisiana"], ["US-ME", "Maine"], ["US-MD", "Maryland"],
      ["US-MA", "Massachusetts"], ["US-MI", "Michigan"], ["US-MN", "Minnesota"], ["US-MS", "Mississippi"],
      ["US-MO", "Missouri"], ["US-MT", "Montana"], ["US-NE", "Nebraska"], ["US-NV", "Nevada"],
      ["US-NH", "New Hampshire"], ["US-NJ", "New Jersey"], ["US-NM", "New Mexico"], ["US-NY", "New York"],
      ["US-NC", "North Carolina"], ["US-ND", "North Dakota"], ["US-OH", "Ohio"], ["US-OK", "Oklahoma"],
      ["US-OR", "Oregon"], ["US-PA", "Pennsylvania"], ["US-RI", "Rhode Island"], ["US-SC", "South Carolina"],
      ["US-SD", "South Dakota"], ["US-TN", "Tennessee"], ["US-TX", "Texas"], ["US-UT", "Utah"],
      ["US-VT", "Vermont"], ["US-VA", "Virginia"], ["US-WA", "Washington"], ["US-WV", "West Virginia"],
      ["US-WI", "Wisconsin"], ["US-WY", "Wyoming"], ["US-DC", "District of Columbia"]
    ]
  },
  CA: {
    name: "Canada",
    subdivisions: [
      ["CA-AB", "Alberta"], ["CA-BC", "British Columbia"], ["CA-MB", "Manitoba"], ["CA-NB", "New Brunswick"],
      ["CA-NL", "Newfoundland and Labrador"], ["CA-NS", "Nova Scotia"], ["CA-NT", "Northwest Territories"],
      ["CA-NU", "Nunavut"], ["CA-ON", "Ontario"], ["CA-PE", "Prince Edward Island"], ["CA-QC", "Quebec"],
      ["CA-SK", "Saskatchewan"], ["CA-YT", "Yukon"]
    ]
  },
  GB: {
    name: "United Kingdom",
    subdivisions: [["GB-ENG", "England"], ["GB-SCT", "Scotland"], ["GB-WLS", "Wales"], ["GB-NIR", "Northern Ireland"]]
  },
  AU: {
    name: "Australia",
    subdivisions: [
      ["AU-ACT", "Australian Capital Territory"], ["AU-NSW", "New South Wales"], ["AU-NT", "Northern Territory"],
      ["AU-QLD", "Queensland"], ["AU-SA", "South Australia"], ["AU-TAS", "Tasmania"], ["AU-VIC", "Victoria"], ["AU-WA", "Western Australia"]
    ]
  },
  DE: {
    name: "Germany",
    subdivisions: [
      ["DE-BW", "Baden-Württemberg"], ["DE-BY", "Bavaria"], ["DE-BE", "Berlin"], ["DE-BB", "Brandenburg"],
      ["DE-HB", "Bremen"], ["DE-HH", "Hamburg"], ["DE-HE", "Hesse"], ["DE-MV", "Mecklenburg-Vorpommern"],
      ["DE-NI", "Lower Saxony"], ["DE-NW", "North Rhine-Westphalia"], ["DE-RP", "Rhineland-Palatinate"],
      ["DE-SL", "Saarland"], ["DE-SN", "Saxony"], ["DE-ST", "Saxony-Anhalt"], ["DE-SH", "Schleswig-Holstein"], ["DE-TH", "Thuringia"]
    ]
  },
  FR: {
    name: "France",
    subdivisions: [
      ["FR-ARA", "Auvergne-Rhône-Alpes"], ["FR-BFC", "Bourgogne-Franche-Comté"], ["FR-BRE", "Brittany"],
      ["FR-CVL", "Centre-Val de Loire"], ["FR-COR", "Corsica"], ["FR-GES", "Grand Est"], ["FR-HDF", "Hauts-de-France"],
      ["FR-IDF", "Île-de-France"], ["FR-NOR", "Normandy"], ["FR-NAQ", "Nouvelle-Aquitaine"], ["FR-OCC", "Occitanie"],
      ["FR-PDL", "Pays de la Loire"], ["FR-PAC", "Provence-Alpes-Côte d'Azur"]
    ]
  },
  IN: {
    name: "India",
    subdivisions: [
      ["IN-AP", "Andhra Pradesh"], ["IN-DL", "Delhi"], ["IN-GA", "Goa"], ["IN-GJ", "Gujarat"],
      ["IN-KA", "Karnataka"], ["IN-KL", "Kerala"], ["IN-MH", "Maharashtra"], ["IN-TN", "Tamil Nadu"],
      ["IN-TS", "Telangana"], ["IN-UP", "Uttar Pradesh"], ["IN-WB", "West Bengal"]
    ]
  },
  MX: {
    name: "Mexico",
    subdivisions: [
      ["MX-AGU", "Aguascalientes"], ["MX-BCN", "Baja California"], ["MX-BCS", "Baja California Sur"],
      ["MX-CAM", "Campeche"], ["MX-CHH", "Chihuahua"], ["MX-CMX", "Ciudad de México"], ["MX-COA", "Coahuila"],
      ["MX-JAL", "Jalisco"], ["MX-MEX", "México"], ["MX-NLE", "Nuevo León"], ["MX-OAX", "Oaxaca"],
      ["MX-PUE", "Puebla"], ["MX-QUE", "Querétaro"], ["MX-ROO", "Quintana Roo"], ["MX-SIN", "Sinaloa"],
      ["MX-SON", "Sonora"], ["MX-TAB", "Tabasco"], ["MX-TAM", "Tamaulipas"], ["MX-VER", "Veracruz"], ["MX-YUC", "Yucatán"]
    ]
  }
};

const LocationCountries = Object.entries(LocationData).map(([code, country]) => ({
  code,
  name: country.name
}));

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LocationData, LocationCountries };
}

if (typeof globalThis !== "undefined") {
  globalThis.CharityLocationData = { LocationData, LocationCountries };
}
