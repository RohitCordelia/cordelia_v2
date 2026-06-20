import { Injectable } from '@nestjs/common';

export interface FilterState {
  destination: string[];
  origin: string[];
  monthYear: string[];
  nightCount: number[];
  tripType: string[];
}

export interface FacetUpdates {
  destination?: string[];
  origin?: string[];
  monthYear?: string[];
  nightCount?: number[];
  tripType?: string[];
}

function emptyState(): FilterState {
  return { destination: [], origin: [], monthYear: [], nightCount: [], tripType: [] };
}

@Injectable()
export class FilterStateService {
  private readonly store = new Map<string, FilterState>();

  get(sessionId: string): FilterState {
    return this.store.get(sessionId) ?? emptyState();
  }

  // Replace per facet. When destination is updated, dependent facets are cleared
  // unless they are also provided in the same update.
  merge(sessionId: string, updates: FacetUpdates): FilterState {
    const current = this.store.get(sessionId) ?? emptyState();
    const next: FilterState = { ...current };

    if (updates.destination !== undefined) {
      next.destination = updates.destination;
      // Destination changed → clear dependent facets unless also explicitly provided
      if (updates.monthYear === undefined)  next.monthYear  = [];
      if (updates.nightCount === undefined) next.nightCount = [];
      if (updates.origin    === undefined)  next.origin     = [];
      if (updates.tripType  === undefined)  next.tripType   = [];
    }

    if (updates.origin    !== undefined) next.origin    = updates.origin;
    if (updates.monthYear !== undefined) next.monthYear = updates.monthYear;
    if (updates.nightCount !== undefined) next.nightCount = updates.nightCount;
    if (updates.tripType  !== undefined) next.tripType  = updates.tripType;

    this.store.set(sessionId, next);
    return next;
  }

  clear(sessionId: string): void {
    this.store.delete(sessionId);
  }
}
