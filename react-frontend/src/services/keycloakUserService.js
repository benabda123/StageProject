const API_URL = 'http://localhost:8000/auth'; // via Kong

export async function getAllUsers(userToken) {
  const response = await fetch(`${API_URL}/employees`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec récupération employés');
  }
  return response.json();
}

export async function getUser(userId, userToken) {
  const response = await fetch(`${API_URL}/employees/${userId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec récupération employé');
  }
  return response.json();
}

export async function createUser(userData, userToken) {
  const response = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec création employé');
  }
  return response.json();
}

export async function updateUser(userId, userData, userToken) {
  const response = await fetch(`${API_URL}/employees/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec mise à jour employé');
  }
  return response.json();
}

export async function deleteUser(userId, userToken) {
  const response = await fetch(`${API_URL}/employees/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec suppression employé');
  }
  return response.json();
}
