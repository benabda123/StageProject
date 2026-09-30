import API from './api';

export const getMyProfile = () => API.get('/auth/profile/me');
export const updateMyProfile = (data) => API.put('/auth/profile/me', data);
export const uploadMyAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return API.post('/auth/profile/me/avatar', formData);
};
