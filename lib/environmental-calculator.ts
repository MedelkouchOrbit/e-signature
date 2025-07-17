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
  timestamp: string // Added timestamp from API
  period: string // Added period from API
}

export interface EnvironmentalImpact {
  totalPages: number
  totalWeightKg: number
  paperSaved: number
  waterSaved: number
  woodSaved: number
  carbonReduced: number
  wastePrevented: number
  energySaved: number
  // Comparison values
  showersEquivalent: number
  treesEquivalent: number
  gasLitersEquivalent: number
  cansEquivalent: number
  computerHoursEquivalent: number
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
   * Calculate environmental impact based on paper weight saved
   */
  static calculateEnvironmentalImpact(usage: UsageData): EnvironmentalImpact {
    const totalPages = this.calculateTotalPages(usage)
    const totalWeightKg = this.calculateTotalWeight(totalPages)

    // Calculate ratio based on 1000kg baseline
    const ratio = totalWeightKg / 1000

    // Calculate environmental savings
    const waterSaved = ENVIRONMENTAL_CONSTANTS.WATER_USAGE_L * ratio
    const woodSaved = ENVIRONMENTAL_CONSTANTS.WOOD_USE_KG * ratio
    const carbonReduced = ENVIRONMENTAL_CONSTANTS.CO2_EMISSIONS_KG * ratio
    const wastePrevented = ENVIRONMENTAL_CONSTANTS.SOLID_WASTE_KG * ratio
    const energySaved = ENVIRONMENTAL_CONSTANTS.TOTAL_ENERGY_KWH * ratio

    // Calculate comparison equivalents
    const showersEquivalent = waterSaved / ENVIRONMENTAL_CONSTANTS.SHOWER_WATER_L
    const treesEquivalent = (woodSaved / 1000) * ENVIRONMENTAL_CONSTANTS.TREES_PER_1000KG_WOOD
    const gasLitersEquivalent = carbonReduced / ENVIRONMENTAL_CONSTANTS.CO2_PER_LITER_GAS
    const cansEquivalent = (wastePrevented * 1000) / ENVIRONMENTAL_CONSTANTS.CAN_WEIGHT_G // Convert kg to g
    const computerHoursEquivalent = (energySaved * 1000) / ENVIRONMENTAL_CONSTANTS.COMPUTER_CONSUMPTION_WH // Convert kWh to Wh

    return {
      totalPages,
      totalWeightKg,
      paperSaved: totalPages,
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
      default:
        return ""
    }
  }
}
