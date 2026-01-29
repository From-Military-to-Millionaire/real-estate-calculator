-- Add missing columns for complete analysis data persistence

-- Rehab costs breakdown
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_roof numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_paint numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_floors numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_cabinets numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_electrical numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_plumbing numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_framing numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_landscaping numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_foundation numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_misc numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_user_cash numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rehab_debt numeric DEFAULT 0;

-- Holding costs
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS monthly_utilities numeric DEFAULT 200;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS short_term_months_held integer DEFAULT 6;

-- Financing - short-term debt
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS short_term_loan_amount numeric DEFAULT 0;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS short_term_interest_rate numeric DEFAULT 12;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS short_term_loan_term_months integer DEFAULT 12;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS short_term_points numeric DEFAULT 2;

-- Financing - refinance
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS refinance_ltv numeric DEFAULT 75;
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS refinance_points numeric DEFAULT 1;

-- LTR additional
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS ltr_additional_cash_invested numeric DEFAULT 0;

-- Returns
ALTER TABLE public.property_analyses ADD COLUMN IF NOT EXISTS rent_appreciation_rate numeric DEFAULT 2;