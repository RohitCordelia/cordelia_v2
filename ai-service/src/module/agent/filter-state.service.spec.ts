import { FilterStateService } from './filter-state.service';

describe('FilterStateService', () => {
  let svc: FilterStateService;

  beforeEach(() => {
    svc = new FilterStateService();
  });

  // ── get on unknown session ──────────────────────────────────────────────────

  it('returns empty state for an unknown session', () => {
    expect(svc.get('x')).toEqual({
      destination: [], origin: [], monthYear: [], nightCount: [], tripType: [],
    });
  });

  // ── clear ───────────────────────────────────────────────────────────────────

  it('clear removes session state', () => {
    svc.merge('s1', { destination: ['Goa'] });
    svc.clear('s1');
    expect(svc.get('s1').destination).toEqual([]);
  });

  // ── replace ─────────────────────────────────────────────────────────────────

  it('replaces a facet with new values', () => {
    svc.merge('s1', { destination: ['Goa'] });
    const s = svc.merge('s1', { destination: ['Lakshadweep'] });
    expect(s.destination).toEqual(['Lakshadweep']);
  });

  it('multi-destination in same message', () => {
    const s = svc.merge('s1', { destination: ['Goa', 'Lakshadweep'] });
    expect(s.destination).toEqual(['Goa', 'Lakshadweep']);
  });

  it('destination change clears dependent facets', () => {
    svc.merge('s1', {
      destination: ['Goa'],
      monthYear:   ['01-2027'],
      nightCount:  [3],
      origin:      ['Mumbai'],
      tripType:    ['one_way'],
    });
    const s = svc.merge('s1', { destination: ['Lakshadweep'] });
    expect(s.destination).toEqual(['Lakshadweep']);
    expect(s.monthYear).toEqual([]);
    expect(s.nightCount).toEqual([]);
    expect(s.origin).toEqual([]);
    expect(s.tripType).toEqual([]);
  });

  it('destination change does NOT clear facets also provided in same update', () => {
    svc.merge('s1', { destination: ['Goa'], monthYear: ['01-2027'] });
    const s = svc.merge('s1', { destination: ['Lakshadweep'], monthYear: ['02-2027'] });
    expect(s.destination).toEqual(['Lakshadweep']);
    expect(s.monthYear).toEqual(['02-2027']);
  });

  // ── additive (LLM sends full list) ──────────────────────────────────────────

  it('LLM sends both destinations for "also Kochi"', () => {
    svc.merge('s1', { destination: ['Lakshadweep'] });
    const s = svc.merge('s1', { destination: ['Lakshadweep', 'Kochi'] });
    expect(s.destination).toEqual(['Lakshadweep', 'Kochi']);
  });

  it('LLM sends both months for "also in Feb"', () => {
    svc.merge('s1', { destination: ['Goa'], monthYear: ['01-2027'] });
    const s = svc.merge('s1', { monthYear: ['01-2027', '02-2027'] });
    expect(s.monthYear).toEqual(['01-2027', '02-2027']);
    expect(s.destination).toEqual(['Goa']); // destination preserved
  });

  // ── refinement without destination ─────────────────────────────────────────

  it('adding month without destination keeps existing destination', () => {
    svc.merge('s1', { destination: ['Goa'] });
    const s = svc.merge('s1', { monthYear: ['03-2027'] });
    expect(s.destination).toEqual(['Goa']);
    expect(s.monthYear).toEqual(['03-2027']);
  });

  it('adding origin without destination keeps existing destination', () => {
    svc.merge('s1', { destination: ['Chennai'] });
    const s = svc.merge('s1', { origin: ['Mumbai'] });
    expect(s.destination).toEqual(['Chennai']);
    expect(s.origin).toEqual(['Mumbai']);
  });

  // ── OR within facet (multi-value) ───────────────────────────────────────────

  it('multi-value monthYear in same message', () => {
    const s = svc.merge('s1', { destination: ['Goa'], monthYear: ['01-2027', '02-2027'] });
    expect(s.monthYear).toEqual(['01-2027', '02-2027']);
  });

  it('multi-value nightCount in same message', () => {
    const s = svc.merge('s1', { destination: ['Goa'], nightCount: [2, 3] });
    expect(s.nightCount).toEqual([2, 3]);
  });

  // ── AND across facets ───────────────────────────────────────────────────────

  it('destination and monthYear are independent in same message', () => {
    const s = svc.merge('s1', { destination: ['Goa'], monthYear: ['01-2027'] });
    expect(s.destination).toEqual(['Goa']);
    expect(s.monthYear).toEqual(['01-2027']);
  });

  // ── session isolation ───────────────────────────────────────────────────────

  it('two sessions are independent', () => {
    svc.merge('s1', { destination: ['Goa'] });
    svc.merge('s2', { destination: ['Chennai'] });
    expect(svc.get('s1').destination).toEqual(['Goa']);
    expect(svc.get('s2').destination).toEqual(['Chennai']);
  });
});
