import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AnalysisNameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
  defaultName?: string;
}

export function AnalysisNameDialog({ open, onSubmit, defaultName = '' }: AnalysisNameDialogProps) {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Name Your Analysis</DialogTitle>
            <DialogDescription>
              Give this analysis a name to help you identify it later. Changes will auto-save as you work.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="analysis-name">Analysis Name</Label>
            <Input
              id="analysis-name"
              placeholder="e.g., 123 Main St Rental Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Start Analysis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
