'use client';

import * as React from 'react';
import type { RequesterCatalogArea } from '@/lib/workflows/requester/catalog-types';
import { WorkflowAreaCard } from './WorkflowAreaCard';

type WorkflowAreaGridProps = {
  areas: RequesterCatalogArea[];
  onAreaClick: (area: RequesterCatalogArea) => void;
};

export function WorkflowAreaGrid({ areas, onAreaClick }: WorkflowAreaGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {areas.map((area) => (
        <WorkflowAreaCard
          key={area.areaId}
          area={area}
          onClick={() => onAreaClick(area)}
        />
      ))}
    </div>
  );
}
