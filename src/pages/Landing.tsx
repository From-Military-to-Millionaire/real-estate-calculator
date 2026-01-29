import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Target, TrendingUp, Building, Hammer, BarChart3, FileDown, Share2 } from "lucide-react";
import topoBackdrop from "@/assets/topographic-backdrop.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${topoBackdrop})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/50" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto py-6 px-4 flex justify-between items-center">
          <Logo size="md" />
          <Link to="/auth">
            <Button
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              Sign In
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium">
              <Target className="w-4 h-4" />
              Strategic Real Estate Analysis
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary leading-tight">
              Real Estate <br />
              <span className="text-accent">Deal Analysis</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze Long-Term Rentals, Short-Term Rentals, and Fix & Flips — all from a single, unified command
              center.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth?mode=signup">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 animate-pulse-glow"
                >
                  Start Your Analysis
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/30">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Complete Investment Arsenal</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze any real estate deal with precision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Building,
                title: "Long-Term Rentals",
                description: "Calculate cash flow, cash-on-cash returns, cap rates, and 10-year equity projections.",
              },
              {
                icon: TrendingUp,
                title: "Short-Term Rentals",
                description: "Factor in seasonality, occupancy rates, management fees, and furnishing costs.",
              },
              {
                icon: Hammer,
                title: "Fix & Flip Analysis",
                description: "Model rehab timelines, holding costs, agent fees, and projected ROI.",
              },
              {
                icon: BarChart3,
                title: "Side-by-Side Comparison",
                description: "Compare all three strategies at once to find the best investment path.",
              },
              {
                icon: FileDown,
                title: "Export Reports",
                description: "Generate professional PDF reports and CSV exports for partners and lenders.",
              },
              {
                icon: Share2,
                title: "Shareable Links",
                description: "Share your analysis with partners using secure, read-only links.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 rounded-xl hover:border-accent/50 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-tactical-gradient rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${topoBackdrop})` }} />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to Deploy Your Strategy?</h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto">
                Join the War Room and get instant access to our comprehensive investment calculator.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} War Room. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
