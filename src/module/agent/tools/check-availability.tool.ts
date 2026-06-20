import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';

export function createCheckAvailabilityTool(railsApiUrl: string, jwtToken?: string) {
  return createTool({
    id: 'check_sailing_availability',
    description:
      'Check available cabin categories and pricing for a specific sailing. Use after the user picks an itinerary and wants to see cabin options and current prices.',
    inputSchema: z.object({
      itinerary_id: z.string().describe('Itinerary ID from search_sailings result'),
    }),
    execute: async ({ context }) => {
      if (!jwtToken) {
        return {
          error: 'auth_required',
          message: 'Please log in to view cabin availability and pricing for this sailing.',
        };
      }

      const { data } = await axios.get(
        `${railsApiUrl}/api/v2/itineraries/${context.itinerary_id}/available_cabins`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      return { cabins: data?.cabins ?? data ?? [] };
    },
  });
}
