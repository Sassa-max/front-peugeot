export interface EffectiveDiacOffer {
  diacFinancialProductType?: string;
  financialContribution?: number;
  monthlyPayment?: number;
  duration?: number;
  maxKilometers?: number;
  catchPhrase?: string;
  legalNotice?: string;
  detailedLegalNotice?: string;
}


export interface ImageItem {
  id?: string; // alias for @id
  url: string;
  description?: string;
}

export interface DiacOffer {
  uuid: string;
  diacFinancialProductType?: string;
  financialContribution?: number;
  monthlyPayment?: number;
  duration?: number;
  maxKilometers?: number;
  catchPhrase?: string;
  legalNotice?: string;
  detailedLegalNotice?: string;
}

export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  model: string;
  autoDealer?: string;
  categoryName?: string;
  colorName?: string;
  weight?: number;
  height?: number;
  width?: number;
  numberOfDoors?: number;
  vehicleIdentificationNumber: string;
  dateVehicleFirstRegistered?: string; // ISO datetime
  fuelType?: string;
  mileageFromOdometer?: number;
  vehicleSeatingCapacity?: number;
  vehicleTransmission?: string;
  emissionsCO2?: number;
  numberPlate?: string;
  vehiclePriceIncTax?: number;
  vehiclePriceExcTax?: number;
  vehicleFamily?: string;
  finishQuality?: string;
  version?: string;
  vehicleEnginePowerTax?: number;
  vehicleEnginePowerHp?: number;
  warrantyName?: string;
  rrgType?: string;
  locationName?: string;
  dateOfEntryIntoStock?: string; // ISO datetime
  internalType?: string;
  type?: string;
  onlinePurchaseCompliant?: boolean;
  availabilityStatus?: string;
  vcdAvailable?: boolean;
  latitude?: number;
  longitude?: number;
  effectiveDiacOffer?: EffectiveDiacOffer;
  premium?: boolean;
  images?: ImageItem[];
  infoPlayer360?: string;
  diacOffers?: DiacOffer[];
  vehicleConfiguration?: string;
  numPolice?: string;
  offer?: string;
  offerStockPriceIncTax?: number;
  offerStockDiscount?: number;
  harmonie?: string;
  vehicleOriginalPriceIncTax?: number;
  vehicleOriginalPriceExcTax?: number;
  warrantyEndDate?: string; // ISO datetime
  vehicleAdditionOptions?: string;
  vehiclePriceCalculation?: string;
  pgrDiscountIsEligible?: boolean;
  pgrDiscountPriceIncTax?: number;
  pgrDiscountPriceExcTax?: number;
  tekion?: boolean;
  _sort?: number;
}


export interface VehicleModel {
  id: string; // e.g., "Renault_Rafale"
  brand: string;
  model: string;
}
