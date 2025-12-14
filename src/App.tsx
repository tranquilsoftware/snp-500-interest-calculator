import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Header Component
const Header: React.FC = () => (
  <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="https://i.imgur.com/CdnTZ20.png" alt="Tranquil Software Logo" className="w-6 h-6" />
          </div>
          <a 
            href="https://www.tranquilsoftware.com.au" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Tranquil Software
          </a>
        </div>
      </div>
    </div>
  </header>
);

// Footer Component
const Footer: React.FC = () => (
  <footer className="bg-slate-900 border-t border-slate-800 py-8">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-slate-400 text-sm">
        © {new Date().getFullYear()}{' '}
        <a 
          href="https://www.tranquilsoftware.com.au" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Tranquil Software
        </a>
        . All rights reserved.
      </p>
    </div>
  </footer>
);

// Constants
const SP500_INTEREST = 10; // Historical average annual return
const SAVINGS_INTEREST = 1.5; // Typical savings account
const BONDS_INTEREST = 4.5; // Average bond return
const INFLATION_RATE = 3; // Average annual inflation
const BEST_YEAR = 37; // Best historical S&P 500 year
const WORST_YEAR = -37; // Worst historical S&P 500 year

// Types
interface CalculatorState {
  mode: 'goal' | 'investment'; // Mode A or Mode B
  // Mode A: Goal-based
  targetMonthlyIncome?: number;
  targetYears?: number;
  // Mode B: Investment-based
  initialInvestment?: number;
  monthlyContribution?: number;
  investmentYears?: number;
  // Common
  useCustomRate: boolean;
  customInterestRate: number;
}

interface MonthData {
  month: number;
  year: number;
  balance: number;
  contributions: number;
  gains: number;
  inflationAdjusted: number;
  savingsAccount: number;
  bonds: number;
  bestCase: number;
  worstCase: number;
}

interface InvestmentMetrics {
  finalBalance: number;
  totalContributions: number;
  totalGains: number;
  inflationAdjustedValue: number;
  monthlyIncome: number; // At 4% withdrawal rate
  yearsTo1M: number;
  yearsTo2M: number;
  yearsTo5M: number;
  vsSavings: number;
  vsBonds: number;
  requiredRate: number;
  withdrawalSustainability: number; // Years money lasts at target withdrawal
}

/**
 * Calculates compound interest with monthly contributions
 * Formula: FV = PV(1 + r)^n + PMT × [((1 + r)^n - 1) / r]
 * Where:
 * - FV = Future Value
 * - PV = Present Value (initial investment)
 * - r = Monthly interest rate (annual rate / 12)
 * - n = Number of months
 * - PMT = Monthly payment/contribution
 */
const calculateFutureValue = (
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  months: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  
  // Future value of principal
  const fvPrincipal = principal * Math.pow(1 + monthlyRate, months);
  
  // Future value of monthly contributions (annuity)
  const fvContributions = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  return fvPrincipal + fvContributions;
};

/**
 * Calculates required initial investment to reach a goal
 * Rearranged formula solving for PV:
 * PV = (FV - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n
 */
const calculateRequiredInvestment = (
  targetAmount: number,
  monthlyContribution: number,
  annualRate: number,
  months: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  
  // Future value of monthly contributions
  const fvContributions = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  // Required principal
  const requiredPrincipal = (targetAmount - fvContributions) / 
    Math.pow(1 + monthlyRate, months);
  
  return Math.max(0, requiredPrincipal);
};

/**
 * Calculates investment projections over time with multiple scenarios
 */
const calculateProjections = (
  initialInvestment: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): MonthData[] => {
  const data: MonthData[] = [];
  const months = years * 12;
  
  for (let month = 1; month <= months; month++) {
    const balance = calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      annualRate,
      month
    );
    
    const contributions = initialInvestment + (monthlyContribution * month);
    const gains = balance - contributions;
    
    // Inflation-adjusted value
    const inflationAdjusted = balance / Math.pow(1 + INFLATION_RATE / 100, month / 12);
    
    // Comparison scenarios
    const savingsAccount = calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      SAVINGS_INTEREST,
      month
    );
    
    const bonds = calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      BONDS_INTEREST,
      month
    );
    
    const bestCase = calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      BEST_YEAR,
      month
    );
    
    const worstCase = calculateFutureValue(
      initialInvestment,
      monthlyContribution,
      WORST_YEAR,
      month
    );
    
    data.push({
      month,
      year: Math.floor(month / 12),
      balance: Math.round(balance),
      contributions: Math.round(contributions),
      gains: Math.round(gains),
      inflationAdjusted: Math.round(inflationAdjusted),
      savingsAccount: Math.round(savingsAccount),
      bonds: Math.round(bonds),
      bestCase: Math.round(bestCase),
      worstCase: Math.round(worstCase)
    });
  }
  
  return data;
};

/**
 * Calculates years needed to reach a monetary milestone
 * Uses binary search for efficiency
 */
const calculateYearsToMilestone = (
  currentBalance: number,
  monthlyContribution: number,
  annualRate: number,
  targetAmount: number
): number => {
  if (currentBalance >= targetAmount) return 0;
  
  // Binary search for the number of months needed
  let low = 0;
  let high = 1200; // Max 100 years
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const value = calculateFutureValue(currentBalance, monthlyContribution, annualRate, mid);
    
    if (value < targetAmount) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  
  return low / 12; // Convert months to years
};

/**
 * Calculates comprehensive investment metrics
 */
const calculateInvestmentMetrics = (
  projections: MonthData[],
  initialInvestment: number,
  monthlyContribution: number,
  annualRate: number,
  targetMonthlyIncome?: number
): InvestmentMetrics => {
  const finalMonth = projections[projections.length - 1];
  
  // 4% rule for safe withdrawal rate
  const monthlyIncome = (finalMonth.balance * 0.04) / 12;
  
  // Years to milestones
  const yearsTo1M = calculateYearsToMilestone(
    initialInvestment,
    monthlyContribution,
    annualRate,
    1000000
  );
  
  const yearsTo2M = calculateYearsToMilestone(
    initialInvestment,
    monthlyContribution,
    annualRate,
    2000000
  );
  
  const yearsTo5M = calculateYearsToMilestone(
    initialInvestment,
    monthlyContribution,
    annualRate,
    5000000
  );
  
  // Comparison vs other investments
  const vsSavings = finalMonth.balance - finalMonth.savingsAccount;
  const vsBonds = finalMonth.balance - finalMonth.bonds;
  
  // Required rate to reach goal (if target income specified)
  let requiredRate = 0;
  if (targetMonthlyIncome) {
    const targetBalance = (targetMonthlyIncome * 12) / 0.04;
    // Binary search for required rate
    for (let rate = 0; rate <= 50; rate += 0.1) {
      const testBalance = calculateFutureValue(
        initialInvestment,
        monthlyContribution,
        rate,
        projections.length
      );
      if (testBalance >= targetBalance) {
        requiredRate = rate;
        break;
      }
    }
  }
  
  // Withdrawal sustainability (at 4% rule)
  const withdrawalSustainability = 25; // Years at 4% withdrawal rate
  
  return {
    finalBalance: Math.round(finalMonth.balance),
    totalContributions: Math.round(finalMonth.contributions),
    totalGains: Math.round(finalMonth.gains),
    inflationAdjustedValue: Math.round(finalMonth.inflationAdjusted),
    monthlyIncome: Math.round(monthlyIncome),
    yearsTo1M: Math.round(yearsTo1M * 10) / 10,
    yearsTo2M: Math.round(yearsTo2M * 10) / 10,
    yearsTo5M: Math.round(yearsTo5M * 10) / 10,
    vsSavings: Math.round(vsSavings),
    vsBonds: Math.round(vsBonds),
    requiredRate: Math.round(requiredRate * 10) / 10,
    withdrawalSustainability
  };
};

// Components
const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, prefix = '', suffix = '', min, max, step = 1 }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-200 mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={`w-full ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-16' : 'pr-4'} py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-lg font-semibold`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  highlight = false,
  className = '',
}) => (
  <div className={`p-6 rounded-lg border ${highlight ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-800 border-slate-700'} ${className}`}>
    <div className="text-sm text-slate-400 mb-1">{title}</div>
    <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</div>
    {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
  </div>
);

const BigPictureCard: React.FC<{ 
  metrics: InvestmentMetrics;
  finalMonth?: MonthData;
 }> = ({ metrics, finalMonth }) => {
  if (!finalMonth) {
    return (
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 rounded-xl p-8 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6">Loading data...</h3>
      </div>
    );
  }
  
  const roi = metrics.totalContributions > 0 
    ? ((metrics.totalGains / metrics.totalContributions) * 100).toFixed(1)
    : 0;
  
  return (
    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 rounded-xl p-8 shadow-xl">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-3xl">💰</span>
        Investment Dashboard
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-slate-400 mb-1">Final Balance</div>
          <div className="text-3xl font-bold text-blue-400">${(metrics.finalBalance / 1000).toFixed(0)}k</div>
          <div className="text-xs text-slate-400 mt-1">After {finalMonth.year} years</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Total Gains</div>
          <div className="text-3xl font-bold text-green-500">${(metrics.totalGains / 1000).toFixed(0)}k</div>
          <div className="text-xs text-slate-400 mt-1">Investment returns</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">ROI</div>
          <div className="text-3xl font-bold text-blue-400">{roi}%</div>
          <div className="text-xs text-slate-400 mt-1">Return on investment</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Monthly Income</div>
          <div className="text-3xl font-bold text-blue-400">${metrics.monthlyIncome.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">4% withdrawal rule</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Inflation-Adjusted</div>
          <div className="text-3xl font-bold text-yellow-500">${(metrics.inflationAdjustedValue / 1000).toFixed(0)}k</div>
          <div className="text-xs text-slate-400 mt-1">Real purchasing power</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">vs Savings Account</div>
          <div className="text-3xl font-bold text-green-500">+${(metrics.vsSavings / 1000).toFixed(0)}k</div>
          <div className="text-xs text-slate-400 mt-1">Extra earnings</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">vs Bonds</div>
          <div className="text-3xl font-bold text-green-500">+${(metrics.vsBonds / 1000).toFixed(0)}k</div>
          <div className="text-xs text-slate-400 mt-1">Extra earnings</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Years to $1M</div>
          <div className={`text-3xl font-bold ${metrics.yearsTo1M < 100 ? 'text-blue-400' : 'text-slate-600'}`}>
            {metrics.yearsTo1M < 100 ? `${metrics.yearsTo1M} yr` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Millionaire status</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Sustainability</div>
          <div className="text-3xl font-bold text-blue-400">{metrics.withdrawalSustainability} yr</div>
          <div className="text-xs text-slate-400 mt-1">At 4% withdrawal</div>
        </div>
      </div>
    </div>
  );
};

const InsightsCard: React.FC<{ 
  metrics: InvestmentMetrics; 
  finalMonth: MonthData | undefined;
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
}> = ({ metrics, finalMonth, initialInvestment, monthlyContribution, years }) => {
  const insights = [];
  
  // Early start advantage
  const fiveYearsEarlier = calculateFutureValue(
    initialInvestment,
    monthlyContribution,
    SP500_INTEREST,
    (years + 5) * 12
  );
  const earlyAdvantage = fiveYearsEarlier - metrics.finalBalance;
  insights.push({ 
    type: 'success', 
    text: `Starting 5 years earlier would give you an extra $${(earlyAdvantage / 1000).toFixed(0)}k (${((earlyAdvantage / metrics.finalBalance) * 100).toFixed(0)}% more). Time is your biggest asset!` 
  });
  
  // Higher contribution impact
  const higherContribution = calculateFutureValue(
    initialInvestment,
    monthlyContribution + 500,
    SP500_INTEREST,
    years * 12
  );
  const extraFromContribution = higherContribution - metrics.finalBalance;
  insights.push({ 
    type: 'info', 
    text: `Adding just $500/month more would give you an extra $${(extraFromContribution / 1000).toFixed(0)}k over ${years} years. Small increases compound dramatically.` 
  });
  
  // Millionaire timeline
  if (metrics.yearsTo1M < 100) {
    if (metrics.yearsTo1M <= years) {
      insights.push({ 
        type: 'success', 
        text: `🎉 You'll reach $1M in ${metrics.yearsTo1M} years! At this rate, you'll be a millionaire well within your investment timeline.` 
      });
    } else {
      const extraYears = metrics.yearsTo1M - years;
      insights.push({ 
        type: 'warning', 
        text: `You'll reach $1M in ${metrics.yearsTo1M} years, which is ${extraYears.toFixed(1)} years beyond your current timeline. Consider extending your investment period or increasing contributions.` 
      });
    }
    
    if (metrics.yearsTo2M < 100) {
      insights.push({ 
        type: 'success', 
        text: `After reaching $1M, you'll hit $2M in just ${(metrics.yearsTo2M - metrics.yearsTo1M).toFixed(1)} more years. Wealth compounds faster as your balance grows!` 
      });
    }
  }
  
  // Market volatility reality check
  const bestCaseGain = finalMonth ? (finalMonth.bestCase - metrics.finalBalance) : 0;
  const worstCaseLoss = finalMonth ? (metrics.finalBalance - finalMonth.worstCase) : 0;
  insights.push({ 
    type: 'warning', 
    text: `Market volatility: In a best year (+37%), you'd gain $${(bestCaseGain / 1000).toFixed(0)}k more. In a worst year (-37%), you'd have $${(worstCaseLoss / 1000).toFixed(0)}k less. Stay invested through the ups and downs!` 
  });
  
  // Inflation impact
  const inflationLoss = metrics.finalBalance - metrics.inflationAdjustedValue;
  insights.push({ 
    type: 'info', 
    text: `Inflation will erode about $${(inflationLoss / 1000).toFixed(0)}k (${((inflationLoss / metrics.finalBalance) * 100).toFixed(0)}%) of your gains over ${years} years. This is why stocks typically outperform cash.` 
  });
  
  // Withdrawal sustainability
  insights.push({ 
    type: 'success', 
    text: `Following the 4% rule, you can withdraw $${metrics.monthlyIncome.toLocaleString()}/month for ${metrics.withdrawalSustainability} years. This is a sustainable retirement income strategy.` 
  });
  
  // Comparison advantage
  insights.push({ 
    type: 'success', 
    text: `By choosing S&P 500 over a savings account (${SAVINGS_INTEREST}%), you'll earn an extra $${(metrics.vsSavings / 1000).toFixed(0)}k. Over bonds (${BONDS_INTEREST}%), you'll earn $${(metrics.vsBonds / 1000).toFixed(0)}k more.` 
  });
  
  return (
    <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl p-8 shadow-xl">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-3xl">💡</span>
        Insights & What-If Scenarios
      </h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'success' ? 'bg-green-500/10 border-green-500' :
              insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
              insight.type === 'danger' ? 'bg-red-500/10 border-red-500' :
              'bg-blue-500/10 border-blue-500'
            }`}
          >
            <p className="text-sm text-slate-200 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
      
      {finalMonth && metrics.yearsTo1M < 100 && (
        <div className="mt-6 p-6 rounded-lg border-l-4 border-purple-500 bg-purple-500/10">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Milestone Timeline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-400">•</span>
              <div>
                <div className="text-white font-medium">{metrics.yearsTo1M} years</div>
                <div className="text-slate-400 text-xs">To $1 Million</div>
              </div>
            </div>
            {metrics.yearsTo2M < 100 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <div>
                  <div className="text-white font-medium">{metrics.yearsTo2M} years</div>
                  <div className="text-slate-400 text-xs">To $2 Million</div>
                </div>
              </div>
            )}
            {metrics.yearsTo5M < 100 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <div>
                  <div className="text-white font-medium">{metrics.yearsTo5M} years</div>
                  <div className="text-slate-400 text-xs">To $5 Million</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App
const InvestmentCalculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    mode: 'investment',
    initialInvestment: 10000,
    monthlyContribution: 500,
    investmentYears: 30,
    useCustomRate: false,
    customInterestRate: SP500_INTEREST
  });

  const [projections, setProjections] = useState<MonthData[]>([]);
  const [metrics, setMetrics] = useState<InvestmentMetrics>({
    finalBalance: 0,
    totalContributions: 0,
    totalGains: 0,
    inflationAdjustedValue: 0,
    monthlyIncome: 0,
    yearsTo1M: 0,
    yearsTo2M: 0,
    yearsTo5M: 0,
    vsSavings: 0,
    vsBonds: 0,
    requiredRate: 0,
    withdrawalSustainability: 25
  });

  useEffect(() => {
    const rate = state.useCustomRate ? state.customInterestRate : SP500_INTEREST;
    
    if (state.mode === 'investment') {
      const data = calculateProjections(
        state.initialInvestment || 0,
        state.monthlyContribution || 0,
        rate,
        state.investmentYears || 30
      );
      setProjections(data);
      
      const investmentMetrics = calculateInvestmentMetrics(
        data,
        state.initialInvestment || 0,
        state.monthlyContribution || 0,
        rate
      );
      setMetrics(investmentMetrics);
    } else {
      // Goal mode - calculate required investment
      const targetBalance = ((state.targetMonthlyIncome || 0) * 12) / 0.04;
      const requiredInvestment = calculateRequiredInvestment(
        targetBalance,
        state.monthlyContribution || 0,
        rate,
        (state.targetYears || 30) * 12
      );
      
      const data = calculateProjections(
        requiredInvestment,
        state.monthlyContribution || 0,
        rate,
        state.targetYears || 30
      );
      setProjections(data);
      
      const investmentMetrics = calculateInvestmentMetrics(
        data,
        requiredInvestment,
        state.monthlyContribution || 0,
        rate,
        state.targetMonthlyIncome
      );
      setMetrics(investmentMetrics);
    }
  }, [state]);

  const finalMonth = projections[projections.length - 1];
  const currentRate = state.useCustomRate ? state.customInterestRate : SP500_INTEREST;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className="max-w mx-auto p-4 md:px-16 lg:px-32">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            S&P 500 Investment Calculator
          </h1>
          <p className="text-lg text-slate-400">
            See how your investments grow with historical market returns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl p-8 shadow-xl sticky top-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-3xl">⚙️</span>
                Configuration
              </h2>
              
              {/* Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Calculator Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setState({ ...state, mode: 'investment' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      state.mode === 'investment'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-900 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <div className="font-semibold text-white text-sm">I Have $X</div>
                    <div className="text-xs text-slate-400 mt-1">See what I'll make</div>
                  </button>
                  <button
                    onClick={() => setState({ ...state, mode: 'goal' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      state.mode === 'goal'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-900 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="font-semibold text-white text-sm">I Want $X</div>
                    <div className="text-xs text-slate-400 mt-1">See what I need</div>
                  </button>
                </div>
              </div>

              {state.mode === 'investment' ? (
                <>
                  <InputField
                    label="Initial Investment"
                    value={state.initialInvestment || 0}
                    onChange={(v) => setState({ ...state, initialInvestment: v })}
                    prefix="$"
                    min={0}
                    step={1000}
                  />

                  <InputField
                    label="Monthly Contribution"
                    value={state.monthlyContribution || 0}
                    onChange={(v) => setState({ ...state, monthlyContribution: v })}
                    prefix="$"
                    min={0}
                    step={100}
                  />

                  <InputField
                    label="Investment Period"
                    value={state.investmentYears || 0}
                    onChange={(v) => setState({ ...state, investmentYears: v })}
                    suffix="years"
                    min={1}
                    max={50}
                    step={1}
                  />
                </>
              ) : (
                <>
                  <InputField
                    label="Target Monthly Income"
                    value={state.targetMonthlyIncome || 0}
                    onChange={(v) => setState({ ...state, targetMonthlyIncome: v })}
                    prefix="$"
                    min={0}
                    step={100}
                  />

                  <InputField
                    label="Monthly Contribution"
                    value={state.monthlyContribution || 0}
                    onChange={(v) => setState({ ...state, monthlyContribution: v })}
                    prefix="$"
                    min={0}
                    step={100}
                  />

                  <InputField
                    label="Time to Goal"
                    value={state.targetYears || 0}
                    onChange={(v) => setState({ ...state, targetYears: v })}
                    suffix="years"
                    min={1}
                    max={50}
                    step={1}
                  />
                  
                  {state.targetMonthlyIncome && state.targetYears && (
                    <div className="p-4 bg-blue-500/10 border-2 border-blue-500 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Required Initial Investment</div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${calculateRequiredInvestment(
                          (state.targetMonthlyIncome * 12) / 0.04,
                          state.monthlyContribution || 0,
                          currentRate,
                          state.targetYears * 12
                        ).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">To reach your goal</div>
                    </div>
                  )}
                </>
              )}

              {/* Interest Rate Toggle */}
              <div className="mb-6 mt-6">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Annual Return Rate
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setState({ ...state, useCustomRate: false })}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      !state.useCustomRate
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-900 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">S&P 500 Average</div>
                        <div className="text-xs text-slate-400 mt-1">Historical ~10% annual</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">{SP500_INTEREST}%</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setState({ ...state, useCustomRate: true })}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      state.useCustomRate
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-900 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="font-semibold text-white mb-2">Custom Rate</div>
                    {state.useCustomRate && (
                      <InputField
                        label=""
                        value={state.customInterestRate}
                        onChange={(v) => setState({ ...state, customInterestRate: v })}
                        suffix="%"
                        min={0}
                        max={50}
                        step={0.1}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Final Balance"
                value={`${(metrics.finalBalance / 1000).toFixed(0)}k`}
                subtitle={`After ${state.mode === 'investment' ? state.investmentYears : state.targetYears} years`}
                highlight
              />
              <MetricCard
                title="Total Gains"
                value={`${(metrics.totalGains / 1000).toFixed(0)}k`}
                subtitle="Investment returns"
              />
              <MetricCard
                title="Monthly Income"
                value={`${metrics.monthlyIncome.toLocaleString()}`}
                subtitle="4% withdrawal rule"
              />
              <MetricCard
                title="Years to $1M"
                value={metrics.yearsTo1M < 100 ? `${metrics.yearsTo1M} yr` : 'N/A'}
                subtitle="Millionaire status"
              />
            </div>

            {/* Growth Chart */}
            <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-3xl">📈</span>
                Investment Growth Projection
              </h3>
              <div className="h-[400px] -mx-2 pr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections.filter((_, i) => i % 6 === 0)}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#a0aec0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      width={90}
                      tickMargin={5}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }
                        return `${value}`;
                      }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const label = name === 'balance' ? 'Total Balance' : 
                                     name === 'contributions' ? 'Total Contributions' : name;
                        return [`${Number(value).toLocaleString()}`, label];
                      }}
                      labelFormatter={(year) => `Year ${year}`}
                      contentStyle={{
                        background: '#1a202c',
                        border: '1px solid #4a5568',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone"
                      dataKey="balance"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={0.2}
                      fill="url(#colorBalance)"
                      name="Total Balance"
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                    <Area 
                      type="monotone"
                      dataKey="contributions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={0.2}
                      fill="url(#colorContributions)"
                      name="Total Contributions"
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-3xl">📊</span>
                Investment Comparison
              </h3>
              <div className="h-[400px] -mx-2 pr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections.filter((_, i) => i % 6 === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#a0aec0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      width={90}
                      tickMargin={5}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }
                        return `${value}`;
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString()}`]}
                      labelFormatter={(year) => `Year ${year}`}
                      contentStyle={{
                        background: '#1a202c',
                        border: '1px solid #4a5568',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name={`S&P 500 (${currentRate}%)`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bonds" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                      name={`Bonds (${BONDS_INTEREST}%)`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="savingsAccount" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      name={`Savings (${SAVINGS_INTEREST}%)`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best/Worst Case Scenario */}
            <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-3xl">⚡</span>
                Market Volatility Scenarios
              </h3>
              <div className="h-[400px] -mx-2 pr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections.filter((_, i) => i % 6 === 0)}>
                    <defs>
                      <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#a0aec0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      width={90}
                      tickMargin={5}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }
                        return `${value}`;
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString()}`]}
                      labelFormatter={(year) => `Year ${year}`}
                      contentStyle={{
                        background: '#1a202c',
                        border: '1px solid #4a5568',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="bestCase" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#colorBest)"
                      name={`Best Year (+${BEST_YEAR}%)`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={false}
                      name="Expected"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="worstCase" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#colorWorst)"
                      name={`Worst Year (${WORST_YEAR}%)`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Big Picture Dashboard */}
            <BigPictureCard metrics={metrics} finalMonth={finalMonth} />

            {/* Insights */}
            <InsightsCard 
              metrics={metrics} 
              finalMonth={finalMonth} 
              initialInvestment={state.mode === 'investment' ? (state.initialInvestment || 0) : calculateRequiredInvestment(
                ((state.targetMonthlyIncome || 0) * 12) / 0.04,
                state.monthlyContribution || 0,
                currentRate,
                (state.targetYears || 30) * 12
              )}
              monthlyContribution={state.monthlyContribution || 0}
              years={state.mode === 'investment' ? (state.investmentYears || 30) : (state.targetYears || 30)}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestmentCalculator;