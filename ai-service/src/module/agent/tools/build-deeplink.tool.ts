import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Booking journey:
// 1. /upcoming-cruises            — browse & filter (no id needed)
// 2. /upcoming-cruises/itinerary  — view itinerary details (?id=<itinerary_id>)
// 3. /upcoming-cruises/selectcabin — select cabin & book (?id=<itinerary_id>)

export const buildDeeplinkTool = createTool({
  id: 'build_deeplink',
  description:
    'Build a deep link to take the user to the right page in the booking journey. ' +
    'Use /upcoming-cruises/itinerary for BOTH "view details" AND "book" requests — ' +
    'the user must go through the itinerary details page before booking. ' +
    'Only redirect after clear user intent — never navigate unprompted. Payment page is FORBIDDEN.',
  inputSchema: z.object({
    route: z.enum([
      '/upcoming-cruises',
      '/upcoming-cruises/itinerary',
    ]).describe(
      '/upcoming-cruises = search/filter page (no id needed); ' +
      '/upcoming-cruises/itinerary = view details or start booking (requires itinerary_id)',
    ),
    itinerary_id: z.string().optional().describe(
      'Required for /upcoming-cruises/itinerary. Use the itinerary_id from the search results.',
    ),
  }),
  execute: async ({ context }) => {
    const params = new URLSearchParams();
    if (context.itinerary_id) params.set('id', context.itinerary_id);

    const qs = params.toString();
    const deeplink = `${context.route}${qs ? '?' + qs : ''}`;

    const labels: Record<string, string> = {
      '/upcoming-cruises': 'Browse Cruises',
      '/upcoming-cruises/itinerary': 'View Details',
    };

    return {
      deeplink,
      label: labels[context.route] ?? 'Continue',
    };
  },
});
