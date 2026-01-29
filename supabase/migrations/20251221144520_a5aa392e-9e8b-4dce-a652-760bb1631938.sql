-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create property analyses table
CREATE TABLE public.property_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  
  -- Property Details
  property_address TEXT NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  down_payment_percent DECIMAL(5,2) DEFAULT 20,
  down_payment_amount DECIMAL(12,2),
  interest_rate DECIMAL(5,3) NOT NULL,
  loan_term_years INTEGER DEFAULT 30,
  closing_costs DECIMAL(12,2) DEFAULT 0,
  rehab_costs DECIMAL(12,2) DEFAULT 0,
  arv DECIMAL(12,2),
  annual_property_taxes DECIMAL(12,2) DEFAULT 0,
  annual_insurance DECIMAL(12,2) DEFAULT 0,
  
  -- LTR Inputs
  ltr_monthly_rent DECIMAL(10,2),
  ltr_vacancy_rate DECIMAL(5,2) DEFAULT 5,
  ltr_property_management_percent DECIMAL(5,2) DEFAULT 10,
  ltr_maintenance_reserve_percent DECIMAL(5,2) DEFAULT 5,
  ltr_other_monthly_expenses DECIMAL(10,2) DEFAULT 0,
  ltr_appreciation_rate DECIMAL(5,2) DEFAULT 3,
  
  -- STR Inputs
  str_average_nightly_rate DECIMAL(10,2),
  str_occupancy_rate DECIMAL(5,2) DEFAULT 65,
  str_cleaning_fee DECIMAL(10,2) DEFAULT 0,
  str_average_stay_length DECIMAL(5,2) DEFAULT 3,
  str_high_season_rate_multiplier DECIMAL(5,2) DEFAULT 1.3,
  str_low_season_rate_multiplier DECIMAL(5,2) DEFAULT 0.7,
  str_management_fee_percent DECIMAL(5,2) DEFAULT 20,
  str_furnishing_costs DECIMAL(12,2) DEFAULT 0,
  str_monthly_operating_expenses DECIMAL(10,2) DEFAULT 0,
  
  -- Flip Inputs
  flip_rehab_timeline_months INTEGER DEFAULT 3,
  flip_monthly_holding_costs DECIMAL(10,2) DEFAULT 0,
  flip_agent_commission_percent DECIMAL(5,2) DEFAULT 6,
  flip_selling_closing_costs_percent DECIMAL(5,2) DEFAULT 2,
  flip_target_sale_price DECIMAL(12,2),
  
  -- Metadata
  name TEXT,
  notes TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_analyses
ALTER TABLE public.property_analyses ENABLE ROW LEVEL SECURITY;

-- Property analyses RLS policies
CREATE POLICY "Users can view their own analyses"
ON public.property_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public analyses by share_id"
ON public.property_analyses FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can insert their own analyses"
ON public.property_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
ON public.property_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON public.property_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_analyses_updated_at
BEFORE UPDATE ON public.property_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();