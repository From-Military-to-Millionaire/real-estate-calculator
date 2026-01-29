// Real Estate Investment Calculations

export interface PropertyInputs {
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  closingCosts: number;
  rehabCosts: number;
  arv: number;
  annualPropertyTaxes: number;
  annualInsurance: number;
}

export interface LTRInputs {
  monthlyRent: number;
  vacancyRate: number;
  propertyManagementPercent: number;
  maintenanceReservePercent: number;
  otherMonthlyExpenses: number;
  appreciationRate: number;
  cashInvested?: number; // User-input based cash invested for accurate ROI calculations
}

export interface STRInputs {
  averageNightlyRate: number;
  occupancyRate: number;
  cleaningFee: number;
  averageStayLength: number;
  highSeasonMultiplier: number;
  lowSeasonMultiplier: number;
  managementFeePercent: number;
  furnishingCosts: number;
  monthlyOperatingExpenses: number;
}

export interface FlipInputs {
  rehabTimelineMonths: number;
  monthlyHoldingCosts: number;
  agentCommissionPercent: number;
  sellingClosingCostsPercent: number;
}

export interface LTRResults {
  monthlyMortgage: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  equityYear1: number;
  equityYear5: number;
  equityYear10: number;
  totalROI10Year: number;
}

export interface STRResults {
  grossMonthlyIncome: number;
  netMonthlyCashFlow: number;
  annualRevenue: number;
  cashOnCashReturn: number;
  breakEvenOccupancy: number;
  totalCashInvested: number;
  roiWithFurnishing: number;
}

export interface FlipResults {
  arv: number;
  purchasePrice: number;
  rehabCosts: number;
  holdingCosts: number;
  sellingCosts: number;
  totalInvestment: number;
  expectedNetProfit: number;
  totalROI: number;
  myROI: number;
}

export function calculateMonthlyMortgage(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return payment;
}

export function calculateLTR(property: PropertyInputs, ltr: LTRInputs): LTRResults {
  const downPayment = property.purchasePrice * (property.downPaymentPercent / 100);
  const loanAmount = property.purchasePrice - downPayment;
  
  // Use user-provided cashInvested if available, otherwise fall back to legacy calculation
  const cashInvested = ltr.cashInvested ?? (downPayment + property.closingCosts + property.rehabCosts);
  
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    property.interestRate,
    property.loanTermYears
  );
  
  const monthlyTaxes = property.annualPropertyTaxes / 12;
  const monthlyInsurance = property.annualInsurance / 12;
  const vacancyLoss = ltr.monthlyRent * (ltr.vacancyRate / 100);
  const propertyManagement = ltr.monthlyRent * (ltr.propertyManagementPercent / 100);
  const maintenanceReserve = ltr.monthlyRent * (ltr.maintenanceReservePercent / 100);
  
  const monthlyExpenses = monthlyMortgage + monthlyTaxes + monthlyInsurance + 
                          vacancyLoss + propertyManagement + maintenanceReserve + 
                          ltr.otherMonthlyExpenses;
  
  const monthlyCashFlow = ltr.monthlyRent - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  
  const cashOnCashReturn = cashInvested > 0 
    ? (annualCashFlow / cashInvested) * 100 
    : (annualCashFlow > 0 ? Infinity : 0);
  
  const noi = (ltr.monthlyRent * 12) - 
              (monthlyTaxes + monthlyInsurance + vacancyLoss + propertyManagement + maintenanceReserve + ltr.otherMonthlyExpenses) * 12;
  const capRate = property.purchasePrice > 0 
    ? (noi / property.purchasePrice) * 100 
    : 0;
  
  // Equity buildup calculations
  const appreciationRate = ltr.appreciationRate / 100;
  const rentAppreciationRate = appreciationRate; // Assume rent grows at same rate as property
  const propertyValueYear1 = property.purchasePrice * Math.pow(1 + appreciationRate, 1);
  const propertyValueYear5 = property.purchasePrice * Math.pow(1 + appreciationRate, 5);
  const propertyValueYear10 = property.purchasePrice * Math.pow(1 + appreciationRate, 10);
  
  // Principal paydown (simplified)
  const annualPrincipalPaydown = loanAmount / property.loanTermYears;
  
  const equityYear1 = downPayment + annualPrincipalPaydown + (propertyValueYear1 - property.purchasePrice);
  const equityYear5 = downPayment + (annualPrincipalPaydown * 5) + (propertyValueYear5 - property.purchasePrice);
  const equityYear10 = downPayment + (annualPrincipalPaydown * 10) + (propertyValueYear10 - property.purchasePrice);
  
  // Calculate cumulative cash flow over 10 years with rent appreciation
  // Cash flow increases each year as rent appreciates (expenses mostly stay fixed or grow slower)
  let cumulativeCashFlow10Year = 0;
  for (let year = 1; year <= 10; year++) {
    const rentMultiplier = Math.pow(1 + rentAppreciationRate, year - 1);
    const yearlyRent = ltr.monthlyRent * rentMultiplier * 12;
    const yearlyVacancy = yearlyRent * (ltr.vacancyRate / 100);
    const yearlyMgmt = yearlyRent * (ltr.propertyManagementPercent / 100);
    const yearlyMaintenance = yearlyRent * (ltr.maintenanceReservePercent / 100);
    const yearlyOther = ltr.otherMonthlyExpenses * 12;
    const yearlyFixedExpenses = (monthlyMortgage + monthlyTaxes + monthlyInsurance) * 12;
    const yearlyCashFlow = yearlyRent - yearlyVacancy - yearlyMgmt - yearlyMaintenance - yearlyOther - yearlyFixedExpenses;
    cumulativeCashFlow10Year += yearlyCashFlow;
  }
  
  const totalROI10Year = cashInvested > 0 
    ? ((equityYear10 + cumulativeCashFlow10Year - cashInvested) / cashInvested) * 100 
    : Infinity;
  
  return {
    monthlyMortgage,
    monthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashReturn,
    capRate,
    equityYear1,
    equityYear5,
    equityYear10,
    totalROI10Year,
  };
}

export function calculateSTR(property: PropertyInputs, str: STRInputs): STRResults {
  const downPayment = property.purchasePrice * (property.downPaymentPercent / 100);
  const loanAmount = property.purchasePrice - downPayment;
  const totalCashInvested = downPayment + property.closingCosts + property.rehabCosts + str.furnishingCosts;
  
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    property.interestRate,
    property.loanTermYears
  );
  
  // Calculate average nightly rate considering seasonality
  const avgSeasonMultiplier = (str.highSeasonMultiplier + str.lowSeasonMultiplier) / 2;
  const adjustedNightlyRate = str.averageNightlyRate * avgSeasonMultiplier;
  
  // Monthly calculations
  const nightsBooked = 30 * (str.occupancyRate / 100);
  const staysPerMonth = nightsBooked / str.averageStayLength;
  const cleaningIncome = staysPerMonth * str.cleaningFee;
  
  const grossMonthlyIncome = (adjustedNightlyRate * nightsBooked) + cleaningIncome;
  const managementFees = grossMonthlyIncome * (str.managementFeePercent / 100);
  
  const monthlyTaxes = property.annualPropertyTaxes / 12;
  const monthlyInsurance = property.annualInsurance / 12;
  
  const totalMonthlyExpenses = monthlyMortgage + monthlyTaxes + monthlyInsurance + 
                               managementFees + str.monthlyOperatingExpenses;
  
  const netMonthlyCashFlow = grossMonthlyIncome - totalMonthlyExpenses;
  const annualRevenue = grossMonthlyIncome * 12;
  
  const cashOnCashReturn = totalCashInvested > 0 
    ? ((netMonthlyCashFlow * 12) / totalCashInvested) * 100 
    : 0;
  
  // Break-even occupancy
  const fixedMonthlyExpenses = monthlyMortgage + monthlyTaxes + monthlyInsurance + str.monthlyOperatingExpenses;
  const revenuePerNight = adjustedNightlyRate + (str.cleaningFee / str.averageStayLength);
  const netRevenuePerNight = revenuePerNight * (1 - str.managementFeePercent / 100);
  const breakEvenNights = netRevenuePerNight > 0 ? fixedMonthlyExpenses / netRevenuePerNight : 0;
  const breakEvenOccupancy = (breakEvenNights / 30) * 100;
  
  const roiWithFurnishing = totalCashInvested > 0 
    ? ((netMonthlyCashFlow * 12) / totalCashInvested) * 100 
    : 0;
  
  return {
    grossMonthlyIncome,
    netMonthlyCashFlow,
    annualRevenue,
    cashOnCashReturn,
    breakEvenOccupancy,
    totalCashInvested,
    roiWithFurnishing,
  };
}

export function calculateFlip(property: PropertyInputs, flip: FlipInputs): FlipResults {
  const downPayment = property.purchasePrice * (property.downPaymentPercent / 100);
  const loanAmount = property.purchasePrice - downPayment;
  
  // Total holding costs
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    property.interestRate,
    property.loanTermYears
  );
  const holdingCosts = (flip.monthlyHoldingCosts + monthlyMortgage) * flip.rehabTimelineMonths;
  
  // Selling costs - use ARV as sale price
  const salePrice = property.arv || property.purchasePrice;
  const agentCommission = salePrice * (flip.agentCommissionPercent / 100);
  const sellingClosingCosts = salePrice * (flip.sellingClosingCostsPercent / 100);
  const sellingCosts = agentCommission + sellingClosingCosts;
  
  // Total investment (all money in the deal)
  const totalInvestment = property.purchasePrice + property.closingCosts + property.rehabCosts + holdingCosts;
  
  // Net profit = ARV - Purchase Price - Rehab Costs - Holding Costs - Selling Costs
  const expectedNetProfit = salePrice - property.purchasePrice - property.rehabCosts - holdingCosts - sellingCosts;
  
  // Cash invested by user (down payment + closing + rehab)
  const cashInvested = downPayment + property.closingCosts + property.rehabCosts;
  
  // Total ROI = Profit / Total Investment
  const totalROI = totalInvestment > 0 
    ? (expectedNetProfit / totalInvestment) * 100 
    : 0;
  
  // My ROI = Profit / Cash Invested (user's actual cash in the deal)
  const myROI = cashInvested > 0 
    ? (expectedNetProfit / cashInvested) * 100 
    : 0;
  
  return {
    arv: salePrice,
    purchasePrice: property.purchasePrice,
    rehabCosts: property.rehabCosts,
    holdingCosts,
    sellingCosts,
    totalInvestment,
    expectedNetProfit,
    totalROI,
    myROI,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return '∞';
  return `${value.toFixed(2)}%`;
}
