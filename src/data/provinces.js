// The 12 Dutch provinces in fixed order
export const PROVINCES = [
  { id: 1, name: 'Groningen',    slug: 'groningen' },
  { id: 2, name: 'Friesland',    slug: 'friesland' },
  { id: 3, name: 'Drenthe',      slug: 'drenthe' },
  { id: 4, name: 'Overijssel',   slug: 'overijssel' },
  { id: 5, name: 'Flevoland',    slug: 'flevoland' },
  { id: 6, name: 'Gelderland',   slug: 'gelderland' },
  { id: 7, name: 'Utrecht',      slug: 'utrecht' },
  { id: 8, name: 'Noord-Holland', slug: 'noord-holland' },
  { id: 9, name: 'Zuid-Holland',  slug: 'zuid-holland' },
  { id: 10, name: 'Zeeland',      slug: 'zeeland' },
  { id: 11, name: 'Noord-Brabant', slug: 'noord-brabant' },
  { id: 12, name: 'Limburg',      slug: 'limburg' },
]

export const DISTANCES = [
  { value: '10k',      label: '10 km',          medal: 'Brons' },
  { value: 'half',     label: 'Halve marathon',  medal: 'Zilver' },
  { value: 'marathon', label: 'Marathon',         medal: 'Goud' },
]

// Keys match DB values, labels are Dutch for the UI
export const STATUS_LABELS = {
  interested: 'Geïnteresseerd',
  signed_up:  'Ingeschreven',
  completed:  'Gelopen',
  dns:        'Niet gestart',
  dnf:        'Niet gefinisht',
}
