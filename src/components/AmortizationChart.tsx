import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface AmortizationChartProps {
  loanAmount: number;
  annualInterestRate: number;
  loanTermYears: number;
  houseAppreciationRate: number;
  rentAppreciationRate: number;
  initialPropertyValue: number;
  initialMonthlyRent: number;
}

interface AmortizationDataPoint {
  year: number;
  principal: number;
  interest: number;
  balance: number;
  propertyValue: number;
  equity: number;
  annualRent: number;
}

export function AmortizationChart({
  loanAmount,
  annualInterestRate,
  loanTermYears,
  houseAppreciationRate,
  rentAppreciationRate,
  initialPropertyValue,
  initialMonthlyRent,
}: AmortizationChartProps) {
  const data = useMemo(() => {
    const monthlyRate = annualInterestRate / 100 / 12;
    const totalMonths = loanTermYears * 12;
    
    // Calculate monthly payment
    let monthlyPayment = 0;
    if (monthlyRate > 0 && loanAmount > 0) {
      monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else if (loanAmount > 0) {
      monthlyPayment = loanAmount / totalMonths;
    }

    const yearlyData: AmortizationDataPoint[] = [];
    let balance = loanAmount;
    let propertyValue = initialPropertyValue;
    let annualRent = initialMonthlyRent * 12;

    for (let year = 0; year <= loanTermYears; year++) {
      if (year === 0) {
        yearlyData.push({
          year,
          principal: 0,
          interest: 0,
          balance: loanAmount,
          propertyValue: initialPropertyValue,
          equity: initialPropertyValue - loanAmount,
          annualRent: initialMonthlyRent * 12,
        });
        continue;
      }

      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      for (let month = 0; month < 12; month++) {
        if (balance <= 0) break;
        
        const interestPayment = balance * monthlyRate;
        const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
        
        yearlyInterest += interestPayment;
        yearlyPrincipal += principalPayment;
        balance -= principalPayment;
      }

      // Apply appreciation
      propertyValue *= (1 + houseAppreciationRate / 100);
      annualRent *= (1 + rentAppreciationRate / 100);

      yearlyData.push({
        year,
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.max(0, Math.round(balance)),
        propertyValue: Math.round(propertyValue),
        equity: Math.round(propertyValue - Math.max(0, balance)),
        annualRent: Math.round(annualRent),
      });
    }

    return yearlyData;
  }, [loanAmount, annualInterestRate, loanTermYears, houseAppreciationRate, rentAppreciationRate, initialPropertyValue, initialMonthlyRent]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Amortization & Equity Growth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loan Balance vs Equity Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Loan Balance vs Equity Over Time</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `Yr ${value}`}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="propertyValue" 
                  name="Property Value"
                  stackId="1"
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent) / 0.3)"
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Loan Balance"
                  stackId="2"
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive) / 0.3)"
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  name="Equity"
                  stackId="3"
                  stroke="hsl(142 76% 36%)" 
                  fill="hsl(142 76% 36% / 0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Principal vs Interest Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Annual Principal vs Interest Payments</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(1)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `Yr ${value}`}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="principal" 
                  name="Principal"
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="interest" 
                  name="Interest"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rent Growth Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Annual Rent Growth</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `Yr ${value}`}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="annualRent" 
                  name="Annual Rent"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
