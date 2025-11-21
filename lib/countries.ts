// Stripe-supported countries with their currencies and postal code terminology
// Source: https://stripe.com/gb/global

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  postalCodeLabel: string;
}

export const STRIPE_COUNTRIES: CountryInfo[] = [
  { code: "AU", name: "Australia", currency: "AUD", postalCodeLabel: "Postcode" },
  { code: "AT", name: "Austria", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "BE", name: "Belgium", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "BR", name: "Brazil", currency: "BRL", postalCodeLabel: "CEP" },
  { code: "BG", name: "Bulgaria", currency: "BGN", postalCodeLabel: "Postal code" },
  { code: "CA", name: "Canada", currency: "CAD", postalCodeLabel: "Postal code" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", postalCodeLabel: "Postal code" },
  { code: "HR", name: "Croatia", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "CY", name: "Cyprus", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "CZ", name: "Czech Republic", currency: "CZK", postalCodeLabel: "Postal code" },
  { code: "DK", name: "Denmark", currency: "DKK", postalCodeLabel: "Postal code" },
  { code: "EE", name: "Estonia", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "FI", name: "Finland", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "FR", name: "France", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "DE", name: "Germany", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "GH", name: "Ghana", currency: "GHS", postalCodeLabel: "Postal code" },
  { code: "GI", name: "Gibraltar", currency: "GBP", postalCodeLabel: "Postcode" },
  { code: "GR", name: "Greece", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "HK", name: "Hong Kong", currency: "HKD", postalCodeLabel: "Postal code" },
  { code: "HU", name: "Hungary", currency: "HUF", postalCodeLabel: "Postal code" },
  { code: "IN", name: "India", currency: "INR", postalCodeLabel: "PIN code" },
  { code: "ID", name: "Indonesia", currency: "IDR", postalCodeLabel: "Postal code" },
  { code: "IE", name: "Ireland", currency: "EUR", postalCodeLabel: "Eircode" },
  { code: "IT", name: "Italy", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "JP", name: "Japan", currency: "JPY", postalCodeLabel: "Postal code" },
  { code: "KE", name: "Kenya", currency: "KES", postalCodeLabel: "Postal code" },
  { code: "LV", name: "Latvia", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "LI", name: "Liechtenstein", currency: "CHF", postalCodeLabel: "Postal code" },
  { code: "LT", name: "Lithuania", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "LU", name: "Luxembourg", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "MY", name: "Malaysia", currency: "MYR", postalCodeLabel: "Postcode" },
  { code: "MT", name: "Malta", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "MX", name: "Mexico", currency: "MXN", postalCodeLabel: "Postal code" },
  { code: "NL", name: "Netherlands", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "NZ", name: "New Zealand", currency: "NZD", postalCodeLabel: "Postcode" },
  { code: "NG", name: "Nigeria", currency: "NGN", postalCodeLabel: "Postal code" },
  { code: "NO", name: "Norway", currency: "NOK", postalCodeLabel: "Postal code" },
  { code: "PL", name: "Poland", currency: "PLN", postalCodeLabel: "Postal code" },
  { code: "PT", name: "Portugal", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "RO", name: "Romania", currency: "RON", postalCodeLabel: "Postal code" },
  { code: "SG", name: "Singapore", currency: "SGD", postalCodeLabel: "Postal code" },
  { code: "SK", name: "Slovakia", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "SI", name: "Slovenia", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "ZA", name: "South Africa", currency: "ZAR", postalCodeLabel: "Postal code" },
  { code: "ES", name: "Spain", currency: "EUR", postalCodeLabel: "Postal code" },
  { code: "SE", name: "Sweden", currency: "SEK", postalCodeLabel: "Postal code" },
  { code: "CH", name: "Switzerland", currency: "CHF", postalCodeLabel: "Postal code" },
  { code: "TH", name: "Thailand", currency: "THB", postalCodeLabel: "Postal code" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", postalCodeLabel: "Postal code" },
  { code: "GB", name: "United Kingdom", currency: "GBP", postalCodeLabel: "Postcode" },
  { code: "US", name: "United States", currency: "USD", postalCodeLabel: "ZIP" },
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  return STRIPE_COUNTRIES.find((country) => country.code === code);
}

export function getDefaultCountry(): CountryInfo {
  // Default to US, but could be based on user location or other logic
  return getCountryByCode("US") || STRIPE_COUNTRIES[0];
}

