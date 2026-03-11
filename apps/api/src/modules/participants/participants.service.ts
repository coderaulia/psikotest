import type { ParticipantListFilters } from './participants.repository.js';
import { fetchParticipants } from './participants.repository.js';

export async function listParticipants(filters: ParticipantListFilters = {}) {
  return fetchParticipants(filters);
}
