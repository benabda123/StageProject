import API from './api';

export const createPoll    = (data)    => API.post('/polls', data);
export const getAllPolls    = ()        => API.get('/polls');
export const getActivePolls= ()        => API.get('/polls/active');
export const getPollResults= (id)      => API.get(`/polls/${id}/results`);
export const submitVote    = (id, opt) => API.post(`/polls/${id}/vote`, { optionId: opt });
export const closePoll     = (id)      => API.put(`/polls/${id}/close`);
export const deletePoll    = (id)      => API.delete(`/polls/${id}`);
