"use client"

// Environmental Paper Network Constants (per 1000kg of paper)
export const ENVIRONMENTAL_CONSTANTS = {
  // Base values for 1000kg of paper with 10% recycled content
  WOOD_USE_KG: 3628.73, // 4 US Short Tons converted to kg
  TOTAL_ENERGY_KWH: 7.91, // 27 Million BTU converted to kWh
  CO2_EMISSIONS_KG: 8482.32, // 18,700 Pounds converted to kg
  WATER_USAGE_L: 88578.59, // 23,400 Gallons converted to L
  SOLID_WASTE_KG: 585.14, // 1290 Pounds converted to kg

  // Paper weight
  PAGE_WEIGHT_KG: 0.005, // kg per page

  // Conversion factors for comparisons
  SHOWER_WATER_L: 65, // L per shower
  TREES_PER_1000KG_WOOD: 12, // trees needed for 1000kg wood
  CO2_PER_LITER_GAS: 8.9, // kg CO2 per liter of gas
  CAN_WEIGHT_G: 15, // grams per can
  COMPUTER_CONSUMPTION_WH: 750, // Wh per hour
}

export interface UsageData {
  signRequests: number
  sheetsPerDocument: number
  contactsToSign: number
  contactsInCopy: number
  documentsSigned: number
  usersActive: number
  timestamp: string // Added timestamp from API
  period: string // Added period from API
  currentEnergyConsumption?: number // Added for calculator
  // Additional OpenSign specific data
  totalTemplates?: number
  totalUsers?: number
  totalContacts?: number
  error?: string
  errorMessage?: string
}

export interface EnvironmentalImpact {
  totalPages: number
  totalWeightKg: number
  paperSaved: number // in kg
  treesSaved: number // in number of trees
  co2Reduced: number // in kg CO2e
  waterSaved: number // in liters
  woodSaved: number // in kg
  carbonReduced: number // in kg CO2e
  wastePrevented: number // in kg
  energySaved: number // in kWh
  showersEquivalent: number
  treesEquivalent: number
  gasLitersEquivalent: number
  cansEquivalent: number
  computerHoursEquivalent: number
  trees: number
  water: number
  co2: number
}

export class EnvironmentalCalculator {
  /**
   * Calculate total pages saved based on usage
   */
  static calculateTotalPages(usage: UsageData): number {
    return usage.signRequests * usage.sheetsPerDocument * (usage.contactsToSign + usage.contactsInCopy)
  }

  /**
   * Calculate total weight of paper saved
   */
  static calculateTotalWeight(totalPages: number): number {
    return totalPages * ENVIRONMENTAL_CONSTANTS.PAGE_WEIGHT_KG
  }

  /**
   * Calculate environmental impact based on usage data
   */
  static calculateEnvironmentalImpact(usage: UsageData): EnvironmentalImpact;
  static calculateEnvironmentalImpact(
    documentsSigned: number,
    usersActive: number,
    years: number
  ): EnvironmentalImpact;
  static calculateEnvironmentalImpact(
    usageOrDocuments: UsageData | number,
    usersActive?: number,
    years?: number
  ): EnvironmentalImpact {
    // Check if first parameter is UsageData object
    if (typeof usageOrDocuments === 'object' && usageOrDocuments !== null) {
      const usage = usageOrDocuments as UsageData;
      const totalPages = this.calculateTotalPages(usage)
      const totalWeightKg = this.calculateTotalWeight(totalPages)

      // Calculate ratio based on 1000kg baseline
      const ratio = totalWeightKg / 1000

      // Calculate environmental savings
      const woodSaved = ENVIRONMENTAL_CONSTANTS.WOOD_USE_KG * ratio
      const carbonReduced = ENVIRONMENTAL_CONSTANTS.CO2_EMISSIONS_KG * ratio
      const wastePrevented = ENVIRONMENTAL_CONSTANTS.SOLID_WASTE_KG * ratio
      const energySaved = ENVIRONMENTAL_CONSTANTS.TOTAL_ENERGY_KWH * ratio

      // Calculate comparison equivalents
      const showersEquivalent = (ENVIRONMENTAL_CONSTANTS.WATER_USAGE_L * ratio) / ENVIRONMENTAL_CONSTANTS.SHOWER_WATER_L
      const treesEquivalent = (woodSaved / 1000) * ENVIRONMENTAL_CONSTANTS.TREES_PER_1000KG_WOOD
      const gasLitersEquivalent = carbonReduced / ENVIRONMENTAL_CONSTANTS.CO2_PER_LITER_GAS
      const cansEquivalent = (wastePrevented * 1000) / ENVIRONMENTAL_CONSTANTS.CAN_WEIGHT_G // Convert kg to g
      const computerHoursEquivalent = (energySaved * 1000) / ENVIRONMENTAL_CONSTANTS.COMPUTER_CONSUMPTION_WH // Convert kWh to Wh

      // Hypothetical conversion factors
      const TREES_PER_KG_PAPER = 0.0017 // 1 kg of paper saves 0.0017 trees (very rough estimate)
      const WATER_PER_KG_PAPER_LITERS = 10 // 1 kg of paper saves 10 liters of water (very rough estimate)
      const CO2_PER_KG_PAPER_KG = 1.5 // 1 kg of paper saves 1.5 kg of CO2 (very rough estimate)

      const treesSaved = totalWeightKg * TREES_PER_KG_PAPER
      const waterSaved = totalWeightKg * WATER_PER_KG_PAPER_LITERS
      const co2Reduced = totalWeightKg * CO2_PER_KG_PAPER_KG

      return {
        totalPages,
        totalWeightKg,
        paperSaved: totalPages,
        treesSaved,
        co2Reduced,
        waterSaved,
        woodSaved,
        carbonReduced,
        wastePrevented,
        energySaved,
        showersEquivalent,
        treesEquivalent,
        gasLitersEquivalent,
        cansEquivalent,
        computerHoursEquivalent,
        trees: treesSaved,
        water: waterSaved,
        co2: co2Reduced,
      }
    } else {
      // Handle the (documentsSigned, usersActive, years) signature
      const documentsSigned = usageOrDocuments as number;
      
      // Constants for environmental impact per unit of usage
      const PAPER_SAVED_PER_DOCUMENT_KG = 0.005 // 5 grams per document
      const CO2_PER_KG_PAPER_KGCO2E = 1.2 // kg CO2e per kg of paper produced
      const TREES_PER_KG_PAPER = 0.0017 // 17 trees per ton of paper, so 0.0017 trees per kg

      // Calculate paper saved
      const paperSaved = documentsSigned * PAPER_SAVED_PER_DOCUMENT_KG * (years || 1)

      // Calculate CO2 reduced from paper saving
      const co2ReducedFromPaper = paperSaved * CO2_PER_KG_PAPER_KGCO2E

      // Calculate trees saved
      const treesSaved = paperSaved * TREES_PER_KG_PAPER

      // Calculate water saved
      const waterSaved = documentsSigned * 0.5 * (years || 1) // 0.5 liters per document

      // Note: For a more comprehensive calculation, you would also consider
      // the energy consumption of the electronic signature platform itself
      // and subtract its environmental impact. For simplicity, we focus on savings.

      return {
        totalPages: 0,
        totalWeightKg: 0,
        paperSaved: Number.parseFloat(paperSaved.toFixed(2)),
        treesSaved: Number.parseFloat(treesSaved.toFixed(2)),
        co2Reduced: Number.parseFloat(co2ReducedFromPaper.toFixed(2)),
        waterSaved: Number.parseFloat(waterSaved.toFixed(2)),
        woodSaved: 0,
        carbonReduced: 0,
        wastePrevented: 0,
        energySaved: 0,
        showersEquivalent: 0,
        treesEquivalent: 0,
        gasLitersEquivalent: 0,
        cansEquivalent: 0,
        computerHoursEquivalent: 0,
        trees: 0,
        water: 0,
        co2: 0,
      }
    }
  }

  /**
   * Calculates the environmental impact including energy consumption.
   * This version is more suitable if you have real-time energy usage data.
   * @param usageData The usage data including documents signed and energy consumption.
   * @param currentEnergyConsumption The current energy consumption in kWh.
   * @returns The calculated environmental impact.
   */
  static calculateEnvironmentalImpactWithEnergy(
    usageData: UsageData,
    currentEnergyConsumption: number,
  ): EnvironmentalImpact {
    const { documentsSigned } = usageData

    // Constants for environmental impact per unit of usage
    const PAPER_SAVED_PER_DOCUMENT_KG = 0.005 // 5 grams per document
    const CO2_PER_KG_PAPER_KGCO2E = 1.2 // kg CO2e per kg of paper produced
    const TREES_PER_KG_PAPER = 0.001 // 1 tree for every 1000 kg of paper (simplified)

    // Savings from paperless
    const paperSaved = documentsSigned * PAPER_SAVED_PER_DOCUMENT_KG
    const co2ReducedFromPaper = paperSaved * CO2_PER_KG_PAPER_KGCO2E
    const treesSaved = paperSaved * TREES_PER_KG_PAPER
    const waterSaved = documentsSigned * 0.5 // 0.5 liters per document

    // Impact from energy consumption of the digital service
    const co2FromEnergy = currentEnergyConsumption * 0.4 // Average CO2 emissions per kWh (global average, varies by region)

    // Net CO2 reduction (savings - consumption impact)
    const netCo2Reduced = co2ReducedFromPaper - co2FromEnergy

    return {
      totalPages: 0,
      totalWeightKg: 0,
      paperSaved: Number.parseFloat(paperSaved.toFixed(2)),
      treesSaved: Number.parseFloat(treesSaved.toFixed(2)),
      co2Reduced: Number.parseFloat(netCo2Reduced.toFixed(2)),
      waterSaved: Number.parseFloat(waterSaved.toFixed(2)),
      woodSaved: 0,
      carbonReduced: 0,
      wastePrevented: 0,
      energySaved: 0,
      showersEquivalent: 0,
      treesEquivalent: 0,
      gasLitersEquivalent: 0,
      cansEquivalent: 0,
      computerHoursEquivalent: 0,
      trees: 0,
      water: 0,
      co2: 0,
    }
  }

  /**
   * Format numbers for display
   */
  static formatNumber(value: number, decimals = 2): string {
    if (value < 0.01 && value > 0) {
      return value.toExponential(2)
    }
    return value.toFixed(decimals)
  }

  /**
   * Get comparison text for a metric
   */
  static getComparisonText(metric: keyof EnvironmentalImpact, impact: EnvironmentalImpact): string {
    switch (metric) {
      case "waterSaved":
        return `that's ${this.formatNumber(impact.showersEquivalent, 1)} shower${impact.showersEquivalent !== 1 ? "s" : ""}`
      case "woodSaved":
        return `that's ${this.formatNumber(impact.treesEquivalent, 1)} tree${impact.treesEquivalent !== 1 ? "s" : ""}`
      case "carbonReduced":
        return `that's ${this.formatNumber(impact.gasLitersEquivalent, 1)}L of gas fuel`
      case "wastePrevented":
        return `that's ${this.formatNumber(impact.cansEquivalent, 0)} can${impact.cansEquivalent !== 1 ? "s" : ""}`
      case "energySaved":
        return `that's ${this.formatNumber(impact.computerHoursEquivalent, 1)} hour${impact.computerHoursEquivalent !== 1 ? "s" : ""} of computer use`
      case "trees":
        return `that's ${this.formatNumber(impact.trees, 1)} tree${impact.trees !== 1 ? "s" : ""}`
      case "water":
        return `that's ${this.formatNumber(impact.water, 1)} liter${impact.water !== 1 ? "s" : ""} of water`
      case "co2":
        return `that's ${this.formatNumber(impact.co2, 1)} kg of CO2`
      default:
        return ""
    }
  }
}

// Utility functions for environmental calculations
export function calculateCO2Savings(documents: number): number {
  // Placeholder: 0.05 kg CO2 per document saved
  return documents * 0.05
}

export function calculateTreeEquivalent(co2SavedKg: number): number {
  // Placeholder: 1 tree absorbs approx 22 kg CO2 per year
  return co2SavedKg / 22
}

export function calculatePaperSavings(documents: number): number {
  // Placeholder: 0.005 kg paper per document
  return documents * 0.005
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}
