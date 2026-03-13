export type LocationLink = {
  rel: string
  href: string
}

export type LocationStructuredAddress = {
  street?: string
  city?: string
  postCode?: string
  countryCode?: string
}

export type LocationProviderInfo = {
  id?: string
  name?: string
  ownStores?: boolean
}

export type DdoLocation = {
  id: string
  storeId?: string
  storeName?: string
  address?: string
  city?: string
  postCode?: string
  countryCode?: string
  latitude?: number
  longitude?: number
  telephoneNumber?: string
  photoUrls?: string[]
  hasDisabledAccess?: boolean
  tags?: string[]
  structuredAddress?: LocationStructuredAddress
  locationType?: string
  cashOnDelivery?: boolean
  dropOff?: boolean
  locationProvider?: LocationProviderInfo
  links?: LocationLink[]
  [key: string]: unknown
}

export type OpeningClosingTime = {
  openingAt?: string
  closingAt?: string
}

export type OpeningTimesRule = {
  rule: string
  openingClosingTimes?: OpeningClosingTime[]
}

export type OpeningTimesData = {
  openingTimesRules?: OpeningTimesRule[]
  links?: LocationLink[]
  [key: string]: unknown
}

export type CountrySummary = {
  countryCode: string
  numberOfLocations: number
  links: unknown[]
}

export type LocationProvider = {
  id: string
  name: string
  archivingPeriod?: number
  locationsSource?: {
    endpoint: string | null
  }
  links: unknown[]
}

export type Retailer = {
  id: string
  name: string
  details: unknown
  links: unknown[]
}

