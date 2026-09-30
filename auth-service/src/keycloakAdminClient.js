const fetch = require('node-fetch');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.REALM;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let adminToken = null;
let tokenExpiry = 0;

async function getAdminToken() {
  if (adminToken && Date.now() < tokenExpiry) return adminToken;

  console.log('Obtention du token admin Keycloak...');

  const response = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec auth admin Keycloak: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  adminToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 10) * 1000; // marge de 10s
  console.log('Token admin obtenu avec succès');
  return adminToken;
}

async function getAllUsers() {
  const token = await getAdminToken();

  console.log('Récupération des utilisateurs...');

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Échec récupération users: ${response.status}`);
  const users = await response.json();

  const usersWithDetails = await Promise.all(
    users.map(async (user) => {
      // Fetch user details to get attributes
      const userResponse = await fetch(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userDetails = userResponse.ok ? await userResponse.json() : user;

      // Fetch roles
      const rolesResponse = await fetch(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}/role-mappings/realm`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const roles = rolesResponse.ok ? await rolesResponse.json() : [];

      return { ...userDetails, realmRoleNames: roles.map((r) => r.name) };
    })
  );

  const filteredUsers = usersWithDetails.filter(
    (u) => u.realmRoleNames.includes('employee') && u.username !== 'admin'
  );

  console.log(`${filteredUsers.length} employés récupérés`);
  return filteredUsers;
}

async function createUser(userData) {
  const token = await getAdminToken();

  console.log('Création de l\'utilisateur:', userData.username);

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      credentials: [{ type: 'password', value: userData.password, temporary: false }],
      attributes: {
        position: userData.position || '',
        phone: userData.phone || '',
        departmentId: userData.departmentId || '',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errorMessage || 'Échec création utilisateur');
  }

  await assignRoleToUser(userData.username, 'employee', token);
  console.log('Utilisateur créé avec succès');
  return { success: true };
}

async function assignRoleToUser(username, roleName, token) {
  const usersResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const users = await usersResponse.json();
  if (users.length === 0) throw new Error('Utilisateur non trouvé');
  const userId = users[0].id;

  const roleResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!roleResponse.ok) throw new Error('Rôle non trouvé');
  const role = await roleResponse.json();

  const assignResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify([role]),
    }
  );
  if (!assignResponse.ok) throw new Error("Échec assignation rôle");
  console.log(`Rôle ${roleName} assigné à ${username}`);
}

async function updateUser(userId, userData) {
  const token = await getAdminToken();

  console.log('Mise à jour de l\'utilisateur:', userId);

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      attributes: {
        position: userData.position || '',
        phone: userData.phone || '',
        departmentId: userData.departmentId || '',
      },
    }),
  });
  if (!response.ok) throw new Error('Échec mise à jour utilisateur');
  console.log('Utilisateur mis à jour avec succès');
  return { success: true };
}

async function getUserById(userId) {
  const token = await getAdminToken();

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Échec récupération utilisateur: ${response.status}`);
  return response.json();
}

async function deleteUser(userId) {
  const token = await getAdminToken();

  console.log('Suppression de l\'utilisateur:', userId);

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Échec suppression utilisateur');
  console.log('Utilisateur supprimé avec succès');
  return { success: true };
}

async function getUsersByEmail(email) {
  const token = await getAdminToken();

  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error(`Échec recherche utilisateur par email: ${response.status}`);
  return response.json();
}

async function resetUserPassword(userId, newPassword) {
  const token = await getAdminToken();

  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/reset-password`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'password', value: newPassword, temporary: false }),
    }
  );
  if (!response.ok) throw new Error(`Échec réinitialisation mot de passe: ${response.status}`);
}

async function updateUserAttributes(userId, attributes) {
  const token = await getAdminToken();

  console.log('Mise à jour des attributs de l\'utilisateur:', userId);

  // First, fetch current user data
  const userResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) throw new Error('Échec récupération utilisateur');
  const currentUser = await userResponse.json();

  // Merge new attributes with existing ones
  const currentAttributes = currentUser.attributes || {};
  const mergedAttributes = { ...currentAttributes };

  // Merge each attribute
  for (const key in attributes) {
    mergedAttributes[key] = attributes[key];
  }

  // Update user with merged attributes
  const updatedUser = {
    ...currentUser,
    attributes: mergedAttributes
  };

  // Remove fields that should not be sent in PUT
  delete updatedUser.access;
  delete updatedUser.notBefore;

  console.log('PUT body:', JSON.stringify(updatedUser, null, 2));

  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(updatedUser),
  });

  console.log('PUT response status:', response.status);
  const responseBody = await response.text();
  console.log('PUT response body:', responseBody);

  if (!response.ok) throw new Error('Échec mise à jour attributs utilisateur');
  console.log('Attributs utilisateur mis à jour avec succès');
  return { success: true };
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser, getUserById, updateUserAttributes, getUsersByEmail, resetUserPassword };
