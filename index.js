const axios = require('axios');
const inquirer = require('inquirer').default; 
require('dotenv').config();

const DOMAIN = process.env.DOMAIN;
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET = process.env.SECRET;

async function getAccessToken() {
  try {
    const response = await axios.post(`https://${DOMAIN}/oauth/token`, {
      client_id: CLIENT_ID,
      client_secret: SECRET, 
      audience: `https://${DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
  }
}

async function getAllUsers(accessToken) {
  try {
    const response = await axios.get(`https://${DOMAIN}/api/v2/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.message);
  }
}

async function deleteUser(accessToken, userId) {
  try {
    await axios.delete(`https://${DOMAIN}/api/v2/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(`Deleted user: ${userId}`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error.message);
  }
}

async function deleteAllUsers() {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const users = await getAllUsers(accessToken);
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete all users? This action is irreversible.',
      default: false,
    },
  ]);

  if (answer.confirm) {
    for (const user of users) {
      await deleteUser(accessToken, user.user_id);
    }
    console.log('All users deleted successfully.');
  } else {
    console.log('Action cancelled. No users were deleted.');
  }
}

async function main() {
  const options = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['Delete All Users', 'Exit'],
    },
  ]);

  if (options.action === 'Delete All Users') {
    await deleteAllUsers();
  } else {
    console.log('Exiting...');
  }
}

main();
