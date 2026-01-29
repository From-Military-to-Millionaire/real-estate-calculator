import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Save, Building, TrendingUp, Hammer, BarChart3, DollarSign, Home, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateLTR, calculateSTR, calculateFlip, formatCurrency, formatPercent } from '@/lib/calculations';
import { AmortizationChart } from '@/components/AmortizationChart';
import { AnalysisNameDialog } from '@/components/AnalysisNameDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import topoBackdrop from '@/assets/topographic-backdrop.jpg';
import { APP_VERSION } from '@/lib/version';

const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString('en-US');
};

const InputField = ({ label, value, onChange, prefix = '', suffix = '' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync local value when external value changes (but not during focus)
  if (!isFocused && localValue !== value.toString()) {
    setLocalValue(value.toString());
  }

  return (
    <div className="space-y-1">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{prefix}</span>}
        <Input 
          type="text" 
          inputMode="decimal" 
          value={isFocused ? localValue : formatNumberWithCommas(value)} 
          onChange={(e) => {
            setLocalValue(e.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
            setLocalValue('');
          }}
          onBlur={() => {
            setIsFocused(false);
            const num = parseFloat(localValue.replace(/[^0-9.-]/g, ''));
            onChange(isNaN(num) ? 0 : num);
          }}
          className={prefix ? 'pl-7' : suffix ? 'pr-8' : ''} 
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
};

const SyncedInputField = ({ 
  label, 
  dollarValue, 
  baseValue,
  onDollarChange, 
  onPercentChange 
}: {
  label: string;
  dollarValue: number;
  baseValue: number;
  onDollarChange: (v: number) => void;
  onPercentChange: (v: number) => void;
}) => {
  const percentValue = baseValue > 0 ? (dollarValue / baseValue) * 100 : 0;
  const [localPercent, setLocalPercent] = useState<string>(percentValue.toFixed(2));
  const [isPercentFocused, setIsPercentFocused] = useState(false);
  const [localDollar, setLocalDollar] = useState<string>(dollarValue.toString());
  const [isDollarFocused, setIsDollarFocused] = useState(false);

  // Sync local values when external values change (but not during focus)
  if (!isPercentFocused && localPercent !== percentValue.toFixed(2)) {
    setLocalPercent(percentValue.toFixed(2));
  }
  if (!isDollarFocused && localDollar !== dollarValue.toString()) {
    setLocalDollar(dollarValue.toString());
  }
  
  return (
    <div className="space-y-1">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input 
            type="text" 
            inputMode="decimal" 
            value={isDollarFocused ? localDollar : formatNumberWithCommas(dollarValue)} 
            onChange={(e) => {
              setLocalDollar(e.target.value);
            }}
            onFocus={() => {
              setIsDollarFocused(true);
              setLocalDollar('');
            }}
            onBlur={() => {
              setIsDollarFocused(false);
              const num = parseFloat(localDollar.replace(/[^0-9.-]/g, ''));
              onDollarChange(isNaN(num) ? 0 : num);
            }}
            className="pl-7" 
          />
        </div>
        <div className="relative w-20 md:w-24">
          <Input 
            type="text" 
            inputMode="decimal" 
            value={isPercentFocused ? localPercent : percentValue.toFixed(2)} 
            onChange={(e) => {
              setLocalPercent(e.target.value);
            }}
            onFocus={() => {
              setIsPercentFocused(true);
              setLocalPercent('');
            }}
            onBlur={() => {
              setIsPercentFocused(false);
              const num = parseFloat(localPercent.replace(/[^0-9.-]/g, ''));
              onPercentChange(isNaN(num) ? 0 : num);
            }}
            className="pr-8" 
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ label, value, highlight = false }: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className={`p-3 rounded-lg ${highlight ? 'bg-accent/10 border border-accent/30' : 'bg-muted/50'}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-lg font-bold ${highlight ? 'text-accent' : 'text-primary'}`}>{value}</p>
  </div>
);

export default function Analyze() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('property');
  
  const [analysisName, setAnalysisName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(id || null);
  const isAutoSaving = useRef(false);

  // Property inputs (cost-focused)
  const [property, setProperty] = useState({
    address: '', purchasePrice: 300000, closingCosts: 6000, rehabCosts: 15000, arv: 350000,
  });

  // Rehab costs breakdown
  const [rehabCosts, setRehabCosts] = useState({
    roof: 0, paint: 0, floors: 0, cabinets: 0, electrical: 0,
    plumbing: 0, framing: 0, landscaping: 0, foundation: 0, misc: 0,
    userCashForRehab: 0, debtForRehab: 0,
  });

  // Holding costs
  const [holdingCosts, setHoldingCosts] = useState({
    annualPropertyTaxes: 3600, annualInsurance: 1800, monthlyUtilities: 200,
    shortTermMonthsHeld: 6,
  });

  // Financing inputs
  const [financing, setFinancing] = useState({
    // Cash
    cashAmount: 60000,
    // Short-term debt (hard money, bridge loan, etc.)
    shortTermLoanAmount: 0, shortTermInterestRate: 12, shortTermLoanTermMonths: 12, shortTermPoints: 2,
    // Long-term refinance
    refinanceLTV: 75, refinanceInterestRate: 7, refinanceLoanTermYears: 30, refinancePoints: 1,
  });

  // LTR inputs
  const [ltr, setLtr] = useState({
    monthlyRent: 2200, vacancyRate: 5, propertyManagementPercent: 10,
    maintenanceReservePercent: 5, otherMonthlyExpenses: 100,
    additionalCashInvested: 0,
  });

  // Returns/appreciation inputs (shared)
  const [returns, setReturns] = useState({
    houseAppreciationRate: 3,
    rentAppreciationRate: 2,
  });

  // STR inputs
  const [str, setStr] = useState({
    averageNightlyRate: 150, occupancyRate: 65, cleaningFee: 100, averageStayLength: 3,
    highSeasonMultiplier: 1.3, lowSeasonMultiplier: 0.7, managementFeePercent: 20,
    furnishingCosts: 15000, monthlyOperatingExpenses: 300,
  });

  // Flip inputs
  const [flip, setFlip] = useState({
    rehabTimelineMonths: 3, monthlyHoldingCosts: 800, agentCommissionPercent: 6,
    sellingClosingCostsPercent: 2,
  });

  // Derive down payment percent and interest rate from financing for calculations
  const downPaymentPercent = (financing.cashAmount / property.purchasePrice) * 100;
  const interestRate = financing.refinanceInterestRate;
  const loanTermYears = financing.refinanceLoanTermYears;

  // Calculate total rehab costs from breakdown
  const totalRehabCosts = rehabCosts.roof + rehabCosts.paint + rehabCosts.floors + rehabCosts.cabinets + 
    rehabCosts.electrical + rehabCosts.plumbing + rehabCosts.framing + rehabCosts.landscaping + 
    rehabCosts.foundation + rehabCosts.misc;

  // Show name dialog for new analyses
  useEffect(() => {
    if (!id && !currentAnalysisId) {
      setShowNameDialog(true);
    }
  }, [id, currentAnalysisId]);

  // Load existing analysis if ID is provided
  useEffect(() => {
    if (!id) return;
    
    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('property_analyses')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        if (!data) {
          toast({ title: 'Not Found', description: 'Analysis not found.', variant: 'destructive' });
          navigate('/dashboard');
          return;
        }
        
        // Set the analysis name
        setAnalysisName(data.name || data.property_address || '');
        setCurrentAnalysisId(id);
        
        // Populate state from loaded data
        setProperty({
          address: data.property_address || '',
          purchasePrice: data.purchase_price || 300000,
          closingCosts: data.closing_costs || 6000,
          rehabCosts: data.rehab_costs || 15000,
          arv: data.arv || 350000,
        });
        // Load rehab costs breakdown
        setRehabCosts({
          roof: data.rehab_roof || 0,
          paint: data.rehab_paint || 0,
          floors: data.rehab_floors || 0,
          cabinets: data.rehab_cabinets || 0,
          electrical: data.rehab_electrical || 0,
          plumbing: data.rehab_plumbing || 0,
          framing: data.rehab_framing || 0,
          landscaping: data.rehab_landscaping || 0,
          foundation: data.rehab_foundation || 0,
          misc: data.rehab_misc || 0,
          userCashForRehab: data.rehab_user_cash || 0,
          debtForRehab: data.rehab_debt || 0,
        });
        setHoldingCosts({
          annualPropertyTaxes: data.annual_property_taxes || 3600,
          annualInsurance: data.annual_insurance || 1800,
          monthlyUtilities: data.monthly_utilities || 200,
          shortTermMonthsHeld: data.short_term_months_held || 6,
        });
        setFinancing({
          cashAmount: data.down_payment_amount || (data.down_payment_percent ? (data.down_payment_percent / 100) * data.purchase_price : 60000),
          shortTermLoanAmount: data.short_term_loan_amount || 0,
          shortTermInterestRate: data.short_term_interest_rate || 12,
          shortTermLoanTermMonths: data.short_term_loan_term_months || 12,
          shortTermPoints: data.short_term_points || 2,
          refinanceLTV: data.refinance_ltv || 75,
          refinanceInterestRate: data.interest_rate || 7,
          refinanceLoanTermYears: data.loan_term_years || 30,
          refinancePoints: data.refinance_points || 1,
        });
        setLtr({
          monthlyRent: data.ltr_monthly_rent || 2200,
          vacancyRate: data.ltr_vacancy_rate || 5,
          propertyManagementPercent: data.ltr_property_management_percent || 10,
          maintenanceReservePercent: data.ltr_maintenance_reserve_percent || 5,
          otherMonthlyExpenses: data.ltr_other_monthly_expenses || 100,
          additionalCashInvested: data.ltr_additional_cash_invested || 0,
        });
        setReturns({
          houseAppreciationRate: data.ltr_appreciation_rate || 3,
          rentAppreciationRate: data.rent_appreciation_rate || 2,
        });
        setStr({
          averageNightlyRate: data.str_average_nightly_rate || 150,
          occupancyRate: data.str_occupancy_rate || 65,
          cleaningFee: data.str_cleaning_fee || 100,
          averageStayLength: data.str_average_stay_length || 3,
          highSeasonMultiplier: data.str_high_season_rate_multiplier || 1.3,
          lowSeasonMultiplier: data.str_low_season_rate_multiplier || 0.7,
          managementFeePercent: data.str_management_fee_percent || 20,
          furnishingCosts: data.str_furnishing_costs || 15000,
          monthlyOperatingExpenses: data.str_monthly_operating_expenses || 300,
        });
        setFlip({
          rehabTimelineMonths: data.flip_rehab_timeline_months || 3,
          monthlyHoldingCosts: data.flip_monthly_holding_costs || 800,
          agentCommissionPercent: data.flip_agent_commission_percent || 6,
          sellingClosingCostsPercent: data.flip_selling_closing_costs_percent || 2,
        });
      } catch (error) {
        console.error('Error loading analysis:', error);
        toast({ title: 'Error', description: 'Failed to load analysis.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalysis();
  }, [id, navigate, toast]);

  // Sync rehab costs to property (for calculations that use property.rehabCosts)
  useEffect(() => {
    if (totalRehabCosts !== property.rehabCosts && totalRehabCosts > 0) {
      setProperty(prev => ({ ...prev, rehabCosts: totalRehabCosts }));
    }
  }, [totalRehabCosts, property.rehabCosts]);

  // Calculate margin of opportunity
  const totalCosts = property.purchasePrice + property.closingCosts + totalRehabCosts;
  const marginOfOpportunity = property.arv - totalCosts;
  const marginIsNegative = marginOfOpportunity < 0;

  // Calculate monthly holding costs from holding tab
  const calculatedMonthlyHolding = (holdingCosts.annualPropertyTaxes / 12) + (holdingCosts.annualInsurance / 12) + holdingCosts.monthlyUtilities;

  // Calculate short-term debt costs
  const shortTermPointsCost = (financing.shortTermPoints / 100) * financing.shortTermLoanAmount;
  const shortTermMonthlyInterest = (financing.shortTermInterestRate / 100 / 12) * financing.shortTermLoanAmount;
  const shortTermTotalInterest = shortTermMonthlyInterest * holdingCosts.shortTermMonthsHeld;

  // Calculate refinance loan amount from LTV
  const refinanceLoanAmount = (financing.refinanceLTV / 100) * property.arv;
  
  // Calculate long-term refinance costs
  const refinancePointsCost = (financing.refinancePoints / 100) * refinanceLoanAmount;

  // Calculate total holding costs during short-term period
  const totalHoldingCosts = calculatedMonthlyHolding * holdingCosts.shortTermMonthsHeld;

  // Calculate cash position after refinance
  // Cash Invested (User's Money) = Cash Contribution + Rehab Cash + Additional Cash
  const cashInvested = financing.cashAmount + rehabCosts.userCashForRehab + ltr.additionalCashInvested;
  // Total debt for short-term payoff = short-term loan + rehab debt
  const totalShortTermDebt = financing.shortTermLoanAmount + rehabCosts.debtForRehab;
  // Loan Costs = short-term points + interest
  const loanCosts = shortTermPointsCost + shortTermTotalInterest;
  
  // Total Project Cost = all costs regardless of funding source
  const totalProjectCost = property.purchasePrice + property.closingCosts + totalRehabCosts + totalHoldingCosts + loanCosts + refinancePointsCost;
  
  // Refinance Waterfall Calculation
  // Step 1: Pay off all short-term debt first (purchase loan + rehab debt)
  const remainingAfterLenderPayoff = refinanceLoanAmount - totalShortTermDebt;
  
  // Step 2: Calculate three distinct outcomes
  let cashLeftIn = 0;
  let cashTakenOut = 0;
  let cashStillNeeded = 0;

  if (remainingAfterLenderPayoff < 0) {
    // Refi doesn't even cover the lender - user needs to bring more cash
    cashStillNeeded = Math.abs(remainingAfterLenderPayoff);
    cashLeftIn = cashInvested; // All user cash stays in the deal
  } else if (remainingAfterLenderPayoff >= cashInvested) {
    // Lender paid + user gets all cash back + extra profit
    cashTakenOut = remainingAfterLenderPayoff - cashInvested;
  } else {
    // Lender paid, but user doesn't get all their cash back
    cashLeftIn = cashInvested - remainingAfterLenderPayoff;
  }

  const propertyInputs = {
    purchasePrice: property.purchasePrice, downPaymentPercent,
    interestRate, loanTermYears,
    closingCosts: property.closingCosts, rehabCosts: property.rehabCosts, arv: property.arv,
    annualPropertyTaxes: holdingCosts.annualPropertyTaxes, annualInsurance: holdingCosts.annualInsurance,
  };

  const ltrResults = calculateLTR(propertyInputs, { ...ltr, appreciationRate: returns.houseAppreciationRate, cashInvested });
  const strResults = calculateSTR(propertyInputs, str);
  const flipResults = calculateFlip(propertyInputs, { ...flip, monthlyHoldingCosts: calculatedMonthlyHolding });

  // Build analysis data for saving
  const getAnalysisData = useCallback(() => ({
    name: analysisName,
    app_version: APP_VERSION,
    property_address: property.address || 'Untitled Property',
    purchase_price: property.purchasePrice,
    down_payment_percent: downPaymentPercent,
    down_payment_amount: financing.cashAmount,
    interest_rate: interestRate,
    loan_term_years: loanTermYears,
    closing_costs: property.closingCosts,
    rehab_costs: property.rehabCosts,
    arv: property.arv,
    // Rehab breakdown
    rehab_roof: rehabCosts.roof,
    rehab_paint: rehabCosts.paint,
    rehab_floors: rehabCosts.floors,
    rehab_cabinets: rehabCosts.cabinets,
    rehab_electrical: rehabCosts.electrical,
    rehab_plumbing: rehabCosts.plumbing,
    rehab_framing: rehabCosts.framing,
    rehab_landscaping: rehabCosts.landscaping,
    rehab_foundation: rehabCosts.foundation,
    rehab_misc: rehabCosts.misc,
    rehab_user_cash: rehabCosts.userCashForRehab,
    rehab_debt: rehabCosts.debtForRehab,
    // Holding costs
    annual_property_taxes: holdingCosts.annualPropertyTaxes,
    annual_insurance: holdingCosts.annualInsurance,
    monthly_utilities: holdingCosts.monthlyUtilities,
    short_term_months_held: holdingCosts.shortTermMonthsHeld,
    // Financing - short-term
    short_term_loan_amount: financing.shortTermLoanAmount,
    short_term_interest_rate: financing.shortTermInterestRate,
    short_term_loan_term_months: financing.shortTermLoanTermMonths,
    short_term_points: financing.shortTermPoints,
    // Financing - refinance
    refinance_ltv: financing.refinanceLTV,
    refinance_points: financing.refinancePoints,
    // LTR
    ltr_monthly_rent: ltr.monthlyRent,
    ltr_vacancy_rate: ltr.vacancyRate,
    ltr_property_management_percent: ltr.propertyManagementPercent,
    ltr_maintenance_reserve_percent: ltr.maintenanceReservePercent,
    ltr_other_monthly_expenses: ltr.otherMonthlyExpenses,
    ltr_appreciation_rate: returns.houseAppreciationRate,
    ltr_additional_cash_invested: ltr.additionalCashInvested,
    // Returns
    rent_appreciation_rate: returns.rentAppreciationRate,
    // STR
    str_average_nightly_rate: str.averageNightlyRate,
    str_occupancy_rate: str.occupancyRate,
    str_cleaning_fee: str.cleaningFee,
    str_average_stay_length: str.averageStayLength,
    str_high_season_rate_multiplier: str.highSeasonMultiplier,
    str_low_season_rate_multiplier: str.lowSeasonMultiplier,
    str_management_fee_percent: str.managementFeePercent,
    str_furnishing_costs: str.furnishingCosts,
    str_monthly_operating_expenses: str.monthlyOperatingExpenses,
    // Flip
    flip_rehab_timeline_months: flip.rehabTimelineMonths,
    flip_monthly_holding_costs: flip.monthlyHoldingCosts,
    flip_agent_commission_percent: flip.agentCommissionPercent,
    flip_selling_closing_costs_percent: flip.sellingClosingCostsPercent,
    flip_target_sale_price: property.arv,
  }), [user?.id, analysisName, property, financing, holdingCosts, ltr, str, flip, returns, rehabCosts, downPaymentPercent, interestRate, loanTermYears]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!currentAnalysisId || isAutoSaving.current) return;
    
    isAutoSaving.current = true;
    try {
      const analysisData = getAnalysisData();
      const { error } = await supabase
        .from('property_analyses')
        .update(analysisData)
        .eq('id', currentAnalysisId);
      
      if (error) {
        console.error('Auto-save error:', error);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      isAutoSaving.current = false;
    }
  }, [currentAnalysisId, getAnalysisData]);

  // Auto-save on tab change
  const handleTabChange = useCallback((newTab: string) => {
    if (currentAnalysisId && activeTab !== newTab) {
      autoSave();
    }
    setActiveTab(newTab);
  }, [currentAnalysisId, activeTab, autoSave]);

  // Handle naming a new analysis
  const handleNameSubmit = async (name: string) => {
    setAnalysisName(name);
    setShowNameDialog(false);
    
    // Create the analysis in the database
    try {
      const analysisData = {
        ...getAnalysisData(),
        user_id: user?.id,
        name,
        property_address: 'New Property',
      };
      
      const { data, error } = await supabase
        .from('property_analyses')
        .insert(analysisData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCurrentAnalysisId(data.id);
        navigate(`/analysis/${data.id}`, { replace: true });
        toast({ title: 'Analysis Created', description: 'Your analysis has been created. Changes will auto-save.' });
      }
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast({ title: 'Error', description: 'Failed to create analysis.', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const analysisData = getAnalysisData();

      if (currentAnalysisId) {
        const { error } = await supabase.from('property_analyses').update(analysisData).eq('id', currentAnalysisId);
        if (error) throw error;
        toast({ title: 'Saved!', description: 'Your analysis has been updated.' });
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save analysis.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AnalysisNameDialog
        open={showNameDialog}
        onSubmit={handleNameSubmit}
      />
      
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{ backgroundImage: `url(${topoBackdrop})` }} />
      <div className="absolute inset-0 bg-background" />
      <div className="relative z-10">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto py-4 px-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Button></Link>
              <Logo size="sm" showText={false} />
              {analysisName && (
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                  {analysisName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentAnalysisId && (
                <span className="text-xs text-muted-foreground hidden sm:inline">Auto-saving</span>
              )}
              <Button onClick={handleSave} disabled={saving || !currentAnalysisId} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="flex w-full max-w-3xl mb-6 overflow-x-auto md:justify-center">
              <TabsTrigger value="property" className="whitespace-nowrap flex-1 md:flex-none">Property</TabsTrigger>
              <TabsTrigger value="financing" className="whitespace-nowrap flex-1 md:flex-none">Purchase</TabsTrigger>
              <TabsTrigger value="rehab" className="whitespace-nowrap flex-1 md:flex-none">Rehab</TabsTrigger>
              <TabsTrigger value="ltr" className="whitespace-nowrap flex-1 md:flex-none">LTR</TabsTrigger>
              <TabsTrigger value="str" className="whitespace-nowrap flex-1 md:flex-none">STR</TabsTrigger>
              <TabsTrigger value="flip" className="whitespace-nowrap flex-1 md:flex-none">Flip</TabsTrigger>
            </TabsList>

            <TabsContent value="property">
              <Card className="glass-card border-primary/20">
                <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-accent" />Property Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Property Address</Label>
                    <Input placeholder="123 Main St, City, State" value={property.address} onChange={(e) => setProperty({...property, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <InputField label="Purchase Price" value={property.purchasePrice} onChange={(v: number) => setProperty({...property, purchasePrice: v})} prefix="$" />
                    <SyncedInputField 
                      label="Closing Costs" 
                      dollarValue={property.closingCosts} 
                      baseValue={property.purchasePrice}
                      onDollarChange={(v) => setProperty({...property, closingCosts: v})}
                      onPercentChange={(v) => setProperty({...property, closingCosts: (v / 100) * property.purchasePrice})}
                    />
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Total Rehab Costs</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(property.rehabCosts)}</p>
                        <p className="text-xs text-muted-foreground">from Rehab tab</p>
                      </div>
                    </div>
                    <InputField label="ARV" value={property.arv} onChange={(v: number) => setProperty({...property, arv: v})} prefix="$" />
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Margin of Opportunity</Label>
                      <div className={`h-10 flex items-center px-3 rounded-md border ${marginIsNegative ? 'bg-destructive/10 border-destructive/50 text-destructive' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                        <span className="font-bold">{formatCurrency(marginOfOpportunity)}</span>
                        {marginIsNegative && <AlertTriangle className="w-4 h-4 ml-2" />}
                      </div>
                      {marginIsNegative && <p className="text-xs text-destructive">Warning: Costs exceed ARV</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rehab">
              <div className="space-y-6">
                {/* Rehab Costs Breakdown */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Hammer className="w-5 h-5 text-accent" />Rehab Costs Breakdown</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <InputField label="Roof" value={rehabCosts.roof} onChange={(v: number) => setRehabCosts({...rehabCosts, roof: v})} prefix="$" />
                      <InputField label="Paint" value={rehabCosts.paint} onChange={(v: number) => setRehabCosts({...rehabCosts, paint: v})} prefix="$" />
                      <InputField label="Floors" value={rehabCosts.floors} onChange={(v: number) => setRehabCosts({...rehabCosts, floors: v})} prefix="$" />
                      <InputField label="Cabinets" value={rehabCosts.cabinets} onChange={(v: number) => setRehabCosts({...rehabCosts, cabinets: v})} prefix="$" />
                      <InputField label="Electrical" value={rehabCosts.electrical} onChange={(v: number) => setRehabCosts({...rehabCosts, electrical: v})} prefix="$" />
                      <InputField label="Plumbing" value={rehabCosts.plumbing} onChange={(v: number) => setRehabCosts({...rehabCosts, plumbing: v})} prefix="$" />
                      <InputField label="Framing" value={rehabCosts.framing} onChange={(v: number) => setRehabCosts({...rehabCosts, framing: v})} prefix="$" />
                      <InputField label="Landscaping" value={rehabCosts.landscaping} onChange={(v: number) => setRehabCosts({...rehabCosts, landscaping: v})} prefix="$" />
                      <InputField label="Foundation" value={rehabCosts.foundation} onChange={(v: number) => setRehabCosts({...rehabCosts, foundation: v})} prefix="$" />
                      <InputField label="Misc" value={rehabCosts.misc} onChange={(v: number) => setRehabCosts({...rehabCosts, misc: v})} prefix="$" />
                    </div>
                    <div className="pt-4 border-t border-border/50">
                      <div className="max-w-xs">
                        <InputField 
                          label="Total Rehab (adjusts Misc)" 
                          value={totalRehabCosts} 
                          onChange={(v: number) => {
                            const otherCosts = rehabCosts.roof + rehabCosts.paint + rehabCosts.floors + 
                              rehabCosts.cabinets + rehabCosts.electrical + rehabCosts.plumbing + 
                              rehabCosts.framing + rehabCosts.landscaping + rehabCosts.foundation;
                            const newMisc = Math.max(0, v - otherCosts);
                            setRehabCosts({...rehabCosts, misc: newMisc});
                          }} 
                          prefix="$" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rehab Funding */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Rehab Funding</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Your Cash for Rehab" value={rehabCosts.userCashForRehab} onChange={(v: number) => setRehabCosts({...rehabCosts, userCashForRehab: v})} prefix="$" />
                    <InputField label="Short-Term Debt for Rehab" value={rehabCosts.debtForRehab} onChange={(v: number) => setRehabCosts({...rehabCosts, debtForRehab: v})} prefix="$" />
                  </CardContent>
                </Card>

                {/* Rehab Summary */}
                <Card className="glass-card border-accent/30">
                  <CardHeader><CardTitle>Rehab Summary</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ResultCard label="Total Rehab" value={formatCurrency(totalRehabCosts)} highlight />
                    <ResultCard label="Your Cash" value={formatCurrency(rehabCosts.userCashForRehab)} />
                    <ResultCard label="Debt Funded" value={formatCurrency(rehabCosts.debtForRehab)} />
                    <ResultCard 
                      label="Funding Gap" 
                      value={formatCurrency(Math.max(0, totalRehabCosts - rehabCosts.userCashForRehab - rehabCosts.debtForRehab))} 
                      highlight={totalRehabCosts > rehabCosts.userCashForRehab + rehabCosts.debtForRehab}
                    />
                  </CardContent>
                </Card>

                {/* Holding Costs */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Home className="w-5 h-5 text-accent" />Holding Costs</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SyncedInputField 
                      label="Annual Taxes (% of Purchase)" 
                      dollarValue={holdingCosts.annualPropertyTaxes} 
                      baseValue={property.purchasePrice}
                      onDollarChange={(v) => setHoldingCosts({...holdingCosts, annualPropertyTaxes: v})}
                      onPercentChange={(v) => setHoldingCosts({...holdingCosts, annualPropertyTaxes: (v / 100) * property.purchasePrice})}
                    />
                    <InputField label="Annual Insurance" value={holdingCosts.annualInsurance} onChange={(v: number) => setHoldingCosts({...holdingCosts, annualInsurance: v})} prefix="$" />
                    <InputField label="Monthly Utilities" value={holdingCosts.monthlyUtilities} onChange={(v: number) => setHoldingCosts({...holdingCosts, monthlyUtilities: v})} prefix="$" />
                  </CardContent>
                </Card>

                {/* Short-Term Debt Section */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Short-Term Debt Costs</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Loan Amount</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground">{formatCurrency(financing.shortTermLoanAmount)}</p>
                        <p className="text-xs text-muted-foreground">from Purchase tab</p>
                      </div>
                    </div>
                    <InputField 
                      label="Months of Debt Held" 
                      value={holdingCosts.shortTermMonthsHeld} 
                      onChange={(v: number) => setHoldingCosts({...holdingCosts, shortTermMonthsHeld: v})} 
                    />
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Interest Payment</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground">{formatCurrency(shortTermTotalInterest)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(shortTermMonthlyInterest)}/mo × {holdingCosts.shortTermMonthsHeld} mo</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Points Cost</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground">{formatCurrency(shortTermPointsCost)}</p>
                        <p className="text-xs text-muted-foreground">{financing.shortTermPoints}% of loan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-accent/30">
                  <CardHeader><CardTitle>Monthly Holding Summary</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ResultCard label="Monthly Taxes" value={formatCurrency(holdingCosts.annualPropertyTaxes / 12)} />
                    <ResultCard label="Monthly Insurance" value={formatCurrency(holdingCosts.annualInsurance / 12)} />
                    <ResultCard label="Monthly Utilities" value={formatCurrency(holdingCosts.monthlyUtilities)} />
                    <ResultCard label="Total Monthly" value={formatCurrency((holdingCosts.annualPropertyTaxes / 12) + (holdingCosts.annualInsurance / 12) + holdingCosts.monthlyUtilities)} highlight />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financing">
              <div className="space-y-6">
                {/* Cash Section */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Cash for Closing</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InputField label="Cash Amount" value={financing.cashAmount} onChange={(v: number) => setFinancing({...financing, cashAmount: v})} prefix="$" />
                    <div className="flex items-end">
                      <p className="text-sm text-muted-foreground">
                        {((financing.cashAmount / property.purchasePrice) * 100).toFixed(1)}% of purchase price
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Short-Term Debt Section */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Short-Term Debt (Hard Money / Bridge Loan)</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="Loan Amount" value={financing.shortTermLoanAmount} onChange={(v: number) => setFinancing({...financing, shortTermLoanAmount: v})} prefix="$" />
                    <InputField label="Interest Rate" value={financing.shortTermInterestRate} onChange={(v: number) => setFinancing({...financing, shortTermInterestRate: v})} suffix="%" />
                    <InputField label="Term (Months)" value={financing.shortTermLoanTermMonths} onChange={(v: number) => setFinancing({...financing, shortTermLoanTermMonths: v})} />
                    <InputField label="Points" value={financing.shortTermPoints} onChange={(v: number) => setFinancing({...financing, shortTermPoints: v})} suffix="%" />
                  </CardContent>
                </Card>

                {/* Purchase Financing Summary */}
                <Card className="glass-card border-accent/30">
                  <CardHeader><CardTitle>Purchase Financing Summary</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ResultCard label="Total Funds" value={formatCurrency(financing.cashAmount + financing.shortTermLoanAmount)} />
                    <ResultCard label="Purchase Price" value={formatCurrency(property.purchasePrice)} />
                    <ResultCard 
                      label="Coverage" 
                      value={formatPercent(((financing.cashAmount + financing.shortTermLoanAmount) / property.purchasePrice) * 100)} 
                      highlight 
                    />
                    <ResultCard label="Cash Needed" value={formatCurrency(Math.max(0, property.purchasePrice - financing.cashAmount - financing.shortTermLoanAmount))} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


            <TabsContent value="ltr">
              <div className="space-y-6">
                {/* LTR Inputs */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-accent" />LTR Inputs</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="Monthly Rent" value={ltr.monthlyRent} onChange={(v: number) => setLtr({...ltr, monthlyRent: v})} prefix="$" />
                    <InputField label="Vacancy Rate" value={ltr.vacancyRate} onChange={(v: number) => setLtr({...ltr, vacancyRate: v})} suffix="%" />
                    <InputField label="Property Mgmt" value={ltr.propertyManagementPercent} onChange={(v: number) => setLtr({...ltr, propertyManagementPercent: v})} suffix="%" />
                    <InputField label="Maintenance Reserve" value={ltr.maintenanceReservePercent} onChange={(v: number) => setLtr({...ltr, maintenanceReservePercent: v})} suffix="%" />
                    <InputField label="Other Monthly" value={ltr.otherMonthlyExpenses} onChange={(v: number) => setLtr({...ltr, otherMonthlyExpenses: v})} prefix="$" />
                  </CardContent>
                </Card>

                {/* Long-Term Refinance */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-accent" />Long-Term Refinance</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">ARV (from Property)</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(property.arv)}</p>
                        <p className="text-xs text-muted-foreground">synced from Property tab</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">LTV %</Label>
                      <Select 
                        value={financing.refinanceLTV.toString()} 
                        onValueChange={(v) => setFinancing({...financing, refinanceLTV: parseFloat(v)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="70">70%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="85">85%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Loan Amount</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(refinanceLoanAmount)}</p>
                        <p className="text-xs text-muted-foreground">{financing.refinanceLTV}% of ARV</p>
                      </div>
                    </div>
                    <InputField label="Interest Rate" value={financing.refinanceInterestRate} onChange={(v: number) => setFinancing({...financing, refinanceInterestRate: v})} suffix="%" />
                    <InputField label="Term (Years)" value={financing.refinanceLoanTermYears} onChange={(v: number) => setFinancing({...financing, refinanceLoanTermYears: v})} />
                    <SyncedInputField 
                      label="Loan Points/Costs" 
                      dollarValue={refinancePointsCost} 
                      baseValue={refinanceLoanAmount}
                      onDollarChange={(v) => setFinancing({...financing, refinancePoints: refinanceLoanAmount > 0 ? (v / refinanceLoanAmount) * 100 : 0})}
                      onPercentChange={(v) => setFinancing({...financing, refinancePoints: v})}
                    />
                  </CardContent>
                </Card>

                {/* Additional Cash Input */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Cash Used During Project</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Cash for Downpayment</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(financing.cashAmount)}</p>
                        <p className="text-xs text-muted-foreground">from Financing tab</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Cash for Rehab</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(rehabCosts.userCashForRehab)}</p>
                        <p className="text-xs text-muted-foreground">from Rehab tab</p>
                      </div>
                    </div>
                    <InputField 
                      label="Cash for Holding, Refi, or Other" 
                      value={ltr.additionalCashInvested} 
                      onChange={(v: number) => setLtr({...ltr, additionalCashInvested: v})} 
                      prefix="$" 
                    />
                  </CardContent>
                </Card>

                {/* Cash Position */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Cash Position After Refinance</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cash Invested (Your Money) */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Cash Invested (Your Money)</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <ResultCard label="Cash Contribution" value={formatCurrency(financing.cashAmount)} />
                        <ResultCard label="+ Rehab Cash" value={formatCurrency(rehabCosts.userCashForRehab)} />
                        <ResultCard label="+ Additional Cash" value={formatCurrency(ltr.additionalCashInvested)} />
                        <ResultCard label="= Total Cash Invested" value={formatCurrency(cashInvested)} highlight />
                      </div>
                    </div>

                    {/* Total Project Cost */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Total Project Cost</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <ResultCard label="Purchase Price" value={formatCurrency(property.purchasePrice)} />
                        <ResultCard label="Closing Costs" value={formatCurrency(property.closingCosts)} />
                        <ResultCard label="Rehab Costs" value={formatCurrency(totalRehabCosts)} />
                        <ResultCard label="Holding Costs" value={formatCurrency(totalHoldingCosts)} />
                        <ResultCard label="Loan Costs" value={formatCurrency(loanCosts)} />
                        <ResultCard label="Refi Points" value={formatCurrency(refinancePointsCost)} />
                      </div>
                      <div className="mt-3 grid sm:grid-cols-3 gap-3">
                        <ResultCard label="= Total Project Cost" value={formatCurrency(totalProjectCost)} highlight />
                        <ResultCard label="ARV" value={formatCurrency(property.arv)} />
                        <ResultCard label="Total Discount" value={formatCurrency(property.arv - totalProjectCost)} highlight />
                      </div>
                    </div>

                    {/* Refinance Waterfall */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Refinance Waterfall</h4>
                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Refi Loan Amount ({financing.refinanceLTV}% LTV)</span>
                          <span className="font-medium">{formatCurrency(refinanceLoanAmount)}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span className="text-sm">− Short-Term Debt Payoff</span>
                          <span className="font-medium">−{formatCurrency(totalShortTermDebt)}</span>
                        </div>
                        {rehabCosts.debtForRehab > 0 && (
                          <div className="flex justify-between text-muted-foreground text-xs pl-4">
                            <span>(Purchase: {formatCurrency(financing.shortTermLoanAmount)} + Rehab: {formatCurrency(rehabCosts.debtForRehab)})</span>
                          </div>
                        )}
                        <div className="border-t border-border/50 pt-2 flex justify-between">
                          <span className="text-sm text-muted-foreground">= Remaining for You</span>
                          <span className="font-medium">{formatCurrency(remainingAfterLenderPayoff)}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span className="text-sm">− Your Cash Contribution</span>
                          <span className="font-medium">−{formatCurrency(cashInvested)}</span>
                        </div>
                        <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                          <span className="text-sm">= The Difference</span>
                          <span>{formatCurrency(remainingAfterLenderPayoff - cashInvested)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Three Outcomes */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Position</h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className={`p-3 rounded-lg ${cashTakenOut > 0 ? 'bg-green-500/20 border-2 border-green-500' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Taken Out</p>
                          <p className={`text-lg font-bold ${cashTakenOut > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>{formatCurrency(cashTakenOut)}</p>
                          {cashTakenOut > 0 && <p className="text-xs text-green-500 mt-1">You got all your cash back + profit!</p>}
                        </div>
                        <div className={`p-3 rounded-lg ${cashLeftIn > 0 && cashStillNeeded === 0 ? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Left In</p>
                          <p className={`text-lg font-bold ${cashLeftIn > 0 && cashStillNeeded === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{formatCurrency(cashLeftIn > 0 && cashStillNeeded === 0 ? cashLeftIn : 0)}</p>
                          {cashLeftIn > 0 && cashStillNeeded === 0 && <p className="text-xs text-amber-500 mt-1">Lender paid, but some cash remains in deal</p>}
                        </div>
                        <div className={`p-3 rounded-lg ${cashStillNeeded > 0 ? 'bg-destructive/20 border-2 border-destructive' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Still Needed</p>
                          <p className={`text-lg font-bold ${cashStillNeeded > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{formatCurrency(cashStillNeeded)}</p>
                          {cashStillNeeded > 0 && <p className="text-xs text-destructive mt-1">Refi doesn't cover lender payoff!</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Appreciation Assumptions */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Appreciation Assumptions</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <InputField label="House Appreciation Rate" value={returns.houseAppreciationRate} onChange={(v: number) => setReturns({...returns, houseAppreciationRate: v})} suffix="%" />
                    <InputField label="Rent Appreciation Rate" value={returns.rentAppreciationRate} onChange={(v: number) => setReturns({...returns, rentAppreciationRate: v})} suffix="%" />
                  </CardContent>
                </Card>

                {/* LTR Results */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Monthly Cash Flow Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Rent</span>
                        <span className="font-medium text-green-500">+{formatCurrency(ltr.monthlyRent)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Principal & Interest</span>
                        <span className="font-medium">−{formatCurrency(ltrResults.monthlyMortgage)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Property Taxes</span>
                        <span className="font-medium">−{formatCurrency(holdingCosts.annualPropertyTaxes / 12)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Insurance</span>
                        <span className="font-medium">−{formatCurrency(holdingCosts.annualInsurance / 12)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Vacancy ({ltr.vacancyRate}%)</span>
                        <span className="font-medium">−{formatCurrency(ltr.monthlyRent * (ltr.vacancyRate / 100))}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Maintenance ({ltr.maintenanceReservePercent}%)</span>
                        <span className="font-medium">−{formatCurrency(ltr.monthlyRent * (ltr.maintenanceReservePercent / 100))}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Property Mgmt ({ltr.propertyManagementPercent}%)</span>
                        <span className="font-medium">−{formatCurrency(ltr.monthlyRent * (ltr.propertyManagementPercent / 100))}</span>
                      </div>
                      {ltr.otherMonthlyExpenses > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span className="text-sm">− Other Expenses</span>
                          <span className="font-medium">−{formatCurrency(ltr.otherMonthlyExpenses)}</span>
                        </div>
                      )}
                      <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                        <span className="text-sm">= Net Cash Flow</span>
                        <span className={ltrResults.monthlyCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}>
                          {formatCurrency(ltrResults.monthlyCashFlow)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(ltrResults.monthlyCashFlow)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Annual Cash Flow</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(ltrResults.annualCashFlow)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Cash-on-Cash Return</p>
                      <p className="text-2xl font-bold text-accent">{formatPercent(ltrResults.cashOnCashReturn)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Cap Rate</p>
                      <p className="text-2xl font-bold text-accent">{formatPercent(ltrResults.capRate)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle>Equity Buildup</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-3 gap-4">
                    <ResultCard label="Year 1 Equity" value={formatCurrency(ltrResults.equityYear1)} />
                    <ResultCard label="Year 5 Equity" value={formatCurrency(ltrResults.equityYear5)} />
                    <ResultCard label="Year 10 Equity" value={formatCurrency(ltrResults.equityYear10)} highlight />
                  </CardContent>
                </Card>

                <Card className="glass-card border-accent/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">10-Year Total ROI</p>
                    <p className="text-2xl font-bold text-accent">{formatPercent(ltrResults.totalROI10Year)}</p>
                  </CardContent>
                </Card>

                <AmortizationChart
                  loanAmount={refinanceLoanAmount}
                  annualInterestRate={financing.refinanceInterestRate}
                  loanTermYears={financing.refinanceLoanTermYears}
                  houseAppreciationRate={returns.houseAppreciationRate}
                  rentAppreciationRate={returns.rentAppreciationRate}
                  initialPropertyValue={property.arv}
                  initialMonthlyRent={ltr.monthlyRent}
                />

              </div>
            </TabsContent>

            <TabsContent value="str">
              <div className="space-y-6">
                {/* STR Inputs */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />STR Inputs</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="Nightly Rate" value={str.averageNightlyRate} onChange={(v: number) => setStr({...str, averageNightlyRate: v})} prefix="$" />
                    <InputField label="Occupancy Rate" value={str.occupancyRate} onChange={(v: number) => setStr({...str, occupancyRate: v})} suffix="%" />
                    <InputField label="Cleaning Fee" value={str.cleaningFee} onChange={(v: number) => setStr({...str, cleaningFee: v})} prefix="$" />
                    <InputField label="Avg Stay (nights)" value={str.averageStayLength} onChange={(v: number) => setStr({...str, averageStayLength: v})} />
                    <InputField label="Mgmt Fee" value={str.managementFeePercent} onChange={(v: number) => setStr({...str, managementFeePercent: v})} suffix="%" />
                    <InputField label="Furnishing Costs" value={str.furnishingCosts} onChange={(v: number) => setStr({...str, furnishingCosts: v})} prefix="$" />
                  </CardContent>
                </Card>

                {/* Long-Term Refinance */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-accent" />Long-Term Refinance</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">ARV (from Property)</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(property.arv)}</p>
                        <p className="text-xs text-muted-foreground">synced from Property tab</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">LTV %</Label>
                      <Select 
                        value={financing.refinanceLTV.toString()} 
                        onValueChange={(v) => setFinancing({...financing, refinanceLTV: parseFloat(v)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="70">70%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="85">85%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Loan Amount</Label>
                      <div className="p-2 bg-muted/30 rounded-md border border-border/50">
                        <p className="text-foreground font-medium">{formatCurrency(refinanceLoanAmount)}</p>
                        <p className="text-xs text-muted-foreground">{financing.refinanceLTV}% of ARV</p>
                      </div>
                    </div>
                    <InputField label="Interest Rate" value={financing.refinanceInterestRate} onChange={(v: number) => setFinancing({...financing, refinanceInterestRate: v})} suffix="%" />
                    <InputField label="Term (Years)" value={financing.refinanceLoanTermYears} onChange={(v: number) => setFinancing({...financing, refinanceLoanTermYears: v})} />
                    <SyncedInputField 
                      label="Loan Points/Costs" 
                      dollarValue={refinancePointsCost} 
                      baseValue={refinanceLoanAmount}
                      onDollarChange={(v) => setFinancing({...financing, refinancePoints: refinanceLoanAmount > 0 ? (v / refinanceLoanAmount) * 100 : 0})}
                      onPercentChange={(v) => setFinancing({...financing, refinancePoints: v})}
                    />
                  </CardContent>
                </Card>

                {/* Cash Position */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" />Cash Position After Refinance</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cash Invested (Your Money) */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Cash Invested (Your Money)</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <ResultCard label="Cash Contribution" value={formatCurrency(financing.cashAmount)} />
                        <ResultCard label="+ Rehab Cash" value={formatCurrency(rehabCosts.userCashForRehab)} />
                        <ResultCard label="+ Additional Cash" value={formatCurrency(ltr.additionalCashInvested)} />
                        <ResultCard label="= Total Cash Invested" value={formatCurrency(cashInvested)} highlight />
                      </div>
                    </div>

                    {/* Total Project Cost */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Total Project Cost</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <ResultCard label="Purchase Price" value={formatCurrency(property.purchasePrice)} />
                        <ResultCard label="Closing Costs" value={formatCurrency(property.closingCosts)} />
                        <ResultCard label="Rehab Costs" value={formatCurrency(totalRehabCosts)} />
                        <ResultCard label="Holding Costs" value={formatCurrency(totalHoldingCosts)} />
                        <ResultCard label="Loan Costs" value={formatCurrency(loanCosts)} />
                        <ResultCard label="Refi Points" value={formatCurrency(refinancePointsCost)} />
                      </div>
                      <div className="mt-3">
                        <ResultCard label="= Total Project Cost" value={formatCurrency(totalProjectCost)} highlight />
                      </div>
                    </div>

                    {/* Refinance Waterfall */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Refinance Waterfall</h4>
                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Refi Loan Amount ({financing.refinanceLTV}% LTV)</span>
                          <span className="font-medium">{formatCurrency(refinanceLoanAmount)}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span className="text-sm">− Short-Term Debt Payoff</span>
                          <span className="font-medium">−{formatCurrency(totalShortTermDebt)}</span>
                        </div>
                        {rehabCosts.debtForRehab > 0 && (
                          <div className="flex justify-between text-muted-foreground text-xs pl-4">
                            <span>(Purchase: {formatCurrency(financing.shortTermLoanAmount)} + Rehab: {formatCurrency(rehabCosts.debtForRehab)})</span>
                          </div>
                        )}
                        <div className="border-t border-border/50 pt-2 flex justify-between">
                          <span className="text-sm text-muted-foreground">= Remaining for You</span>
                          <span className="font-medium">{formatCurrency(remainingAfterLenderPayoff)}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span className="text-sm">− Your Cash Contribution</span>
                          <span className="font-medium">−{formatCurrency(cashInvested)}</span>
                        </div>
                        <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                          <span className="text-sm">= The Difference</span>
                          <span>{formatCurrency(remainingAfterLenderPayoff - cashInvested)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Three Outcomes */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Position</h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className={`p-3 rounded-lg ${cashTakenOut > 0 ? 'bg-green-500/20 border-2 border-green-500' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Taken Out</p>
                          <p className={`text-lg font-bold ${cashTakenOut > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>{formatCurrency(cashTakenOut)}</p>
                          {cashTakenOut > 0 && <p className="text-xs text-green-500 mt-1">You got all your cash back + profit!</p>}
                        </div>
                        <div className={`p-3 rounded-lg ${cashLeftIn > 0 && cashStillNeeded === 0 ? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Left In</p>
                          <p className={`text-lg font-bold ${cashLeftIn > 0 && cashStillNeeded === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{formatCurrency(cashLeftIn > 0 && cashStillNeeded === 0 ? cashLeftIn : 0)}</p>
                          {cashLeftIn > 0 && cashStillNeeded === 0 && <p className="text-xs text-amber-500 mt-1">Lender paid, but some cash remains in deal</p>}
                        </div>
                        <div className={`p-3 rounded-lg ${cashStillNeeded > 0 ? 'bg-destructive/20 border-2 border-destructive' : 'bg-muted/30 border border-border/50'}`}>
                          <p className="text-xs text-muted-foreground">Cash Still Needed</p>
                          <p className={`text-lg font-bold ${cashStillNeeded > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{formatCurrency(cashStillNeeded)}</p>
                          {cashStillNeeded > 0 && <p className="text-xs text-destructive mt-1">Refi doesn't cover lender payoff!</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Appreciation Assumptions */}
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Appreciation Assumptions</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <InputField label="House Appreciation Rate" value={returns.houseAppreciationRate} onChange={(v: number) => setReturns({...returns, houseAppreciationRate: v})} suffix="%" />
                    <InputField label="Rent Appreciation Rate" value={returns.rentAppreciationRate} onChange={(v: number) => setReturns({...returns, rentAppreciationRate: v})} suffix="%" />
                  </CardContent>
                </Card>

                {/* STR Results */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Gross Monthly Income</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(strResults.grossMonthlyIncome)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Net Monthly Cash Flow</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(strResults.netMonthlyCashFlow)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="text-2xl font-bold text-accent">{formatCurrency(strResults.annualRevenue)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Cash-on-Cash Return</p>
                      <p className="text-2xl font-bold text-accent">{formatPercent(strResults.cashOnCashReturn)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Break-even Occupancy</p>
                      <p className="text-2xl font-bold text-accent">{formatPercent(strResults.breakEvenOccupancy)}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-accent/30">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">ROI w/ Furnishing</p>
                      <p className="text-2xl font-bold text-accent">{formatPercent(strResults.roiWithFurnishing)}</p>
                    </CardContent>
                  </Card>
                </div>

                <AmortizationChart
                  loanAmount={refinanceLoanAmount}
                  annualInterestRate={financing.refinanceInterestRate}
                  loanTermYears={financing.refinanceLoanTermYears}
                  houseAppreciationRate={returns.houseAppreciationRate}
                  rentAppreciationRate={returns.rentAppreciationRate}
                  initialPropertyValue={property.arv}
                  initialMonthlyRent={strResults.netMonthlyCashFlow}
                />
              </div>
            </TabsContent>

            <TabsContent value="flip">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card border-primary/20">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Hammer className="w-5 h-5 text-accent" />Flip Inputs</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <InputField label="Rehab Timeline (mo)" value={flip.rehabTimelineMonths} onChange={(v: number) => setFlip({...flip, rehabTimelineMonths: v})} />
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Monthly Holding</Label>
                      <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 border-border">
                        <span className="text-muted-foreground mr-1">$</span>
                        <span className="font-medium">{calculatedMonthlyHolding.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground ml-2">(from Rehab tab)</span>
                      </div>
                    </div>
                    <InputField label="Agent Commission" value={flip.agentCommissionPercent} onChange={(v: number) => setFlip({...flip, agentCommissionPercent: v})} suffix="%" />
                    <InputField label="Selling Costs" value={flip.sellingClosingCostsPercent} onChange={(v: number) => setFlip({...flip, sellingClosingCostsPercent: v})} suffix="%" />
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Target Sale Price</Label>
                      <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 border-border">
                        <span className="text-muted-foreground mr-1">$</span>
                        <span className="font-medium">{formatNumberWithCommas(property.arv)}</span>
                        <span className="text-xs text-muted-foreground ml-2">(ARV from Property)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className={`glass-card ${flipResults.myROI >= 20 ? 'border-green-500/50 bg-green-500/5' : flipResults.myROI > 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                  <CardHeader><CardTitle>Flip Results</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {/* Complete Profit Breakdown */}
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      {/* Gross Profit Calculation */}
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">ARV (Sale Price)</span>
                        <span className="font-bold text-green-500">{formatCurrency(flipResults.arv)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Purchase Price</span>
                        <span className="font-medium">−{formatCurrency(flipResults.purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Rehab Costs</span>
                        <span className="font-medium">−{formatCurrency(flipResults.rehabCosts)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Holding Costs</span>
                        <span className="font-medium">−{formatCurrency(flipResults.holdingCosts)}</span>
                      </div>
                      <div className="flex justify-between text-destructive">
                        <span className="text-sm">− Selling Costs</span>
                        <span className="font-medium">−{formatCurrency(flipResults.sellingCosts)}</span>
                      </div>
                      <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                        <span className="text-sm text-accent">= Gross Profit</span>
                        <span className="text-accent">{formatCurrency(flipResults.arv - flipResults.purchasePrice - flipResults.rehabCosts - flipResults.holdingCosts - flipResults.sellingCosts)}</span>
                      </div>

                    </div>

                    {/* Capital Outlays */}
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Capital Outlays</h4>
                      <div className="flex justify-between text-muted-foreground">
                        <span className="text-sm">− Repay Short-Term Lender</span>
                        <span className="font-medium">−{formatCurrency(totalShortTermDebt)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span className="text-sm">− Repay My Cash</span>
                        <span className="font-medium">−{formatCurrency(financing.cashAmount + rehabCosts.userCashForRehab)}</span>
                      </div>
                      <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
                        <span className={`${flipResults.expectedNetProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>= Net Profit (Before Taxes)</span>
                        <span className={flipResults.expectedNetProfit >= 0 ? 'text-green-500' : 'text-destructive'}>{formatCurrency(flipResults.expectedNetProfit)}</span>
                      </div>
                    </div>

                    {/* ROI Metrics */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <ResultCard label="Total ROI" value={formatPercent(flipResults.totalROI)} />
                      <ResultCard label="My ROI" value={formatPercent(flipResults.myROI)} highlight />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
    </>
  );
}
