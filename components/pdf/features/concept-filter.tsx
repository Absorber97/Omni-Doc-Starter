'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ConceptType } from '@/lib/store/concepts-store';
import { pdfViewerConfig } from '@/config/pdf-viewer';

interface ConceptFilterProps {
  selectedType: ConceptType | 'all';
  searchQuery: string;
  onTypeChange: (type: ConceptType | 'all') => void;
  onSearchChange: (query: string) => void;
}

const conceptConfig = pdfViewerConfig.features.ai.features.concepts.types;

export function ConceptFilter({
  selectedType,
  searchQuery,
  onTypeChange,
  onSearchChange
}: ConceptFilterProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search concepts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue={selectedType} onValueChange={(v) => onTypeChange(v as ConceptType | 'all')}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All
          </TabsTrigger>
          {(Object.entries(conceptConfig) as [ConceptType, typeof conceptConfig[keyof typeof conceptConfig]][]).map(([type, config]) => (
            <TabsTrigger 
              key={type} 
              value={type}
              className="flex-1"
            >
              {config.emoji}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
} 