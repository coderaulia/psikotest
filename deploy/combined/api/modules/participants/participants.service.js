import { fetchParticipants } from './participants.repository.js';
export async function listParticipants(filters = {}) {
    return fetchParticipants(filters);
}
