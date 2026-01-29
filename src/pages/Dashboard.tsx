import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Plus, Building, Trash2, ExternalLink, LogOut } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import topoBackdrop from '@/assets/topographic-backdrop.jpg';

interface Analysis {
  id: string;
  property_address: string;
  purchase_price: number;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('property_analyses')
        .select('id, property_address, purchase_price, name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your analyses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const { error } = await supabase
        .from('property_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAnalyses(analyses.filter(a => a.id !== id));
      toast({
        title: 'Deleted',
        description: 'Analysis has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete analysis.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-5"
        style={{ backgroundImage: `url(${topoBackdrop})` }}
      />
      <div className="absolute inset-0 bg-background" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto py-4 px-4 flex justify-between items-center">
            <Logo size="sm" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">Your Analyses</h1>
              <p className="text-muted-foreground">Manage and view your property analyses</p>
            </div>
            <Link to="/analyze">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading your analyses...</div>
            </div>
          ) : analyses.length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="py-12 text-center">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Analyses Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first property analysis to get started.
                </p>
                <Link to="/analyze">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className="glass-card border-primary/20 hover:border-accent/50 transition-all group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-primary truncate">
                          {analysis.name || analysis.property_address}
                        </CardTitle>
                        {analysis.name && (
                          <CardDescription className="truncate">
                            {analysis.property_address}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase Price</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(Number(analysis.purchase_price))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="text-muted-foreground">
                          {new Date(analysis.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link to={`/analysis/${analysis.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(analysis.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
