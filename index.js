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
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
  }
}

async function GetAll(accessToken) {
  try {
    let users = [];
    let page = 0;
    const perPage = 50; 
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(`https://${DOMAIN}/api/v2/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: page,
          per_page: perPage,
        },
      });

      users = users.concat(response.data);
      console.log(`Fetched page ${page + 1} with ${response.data.length} users`); 
      hasMore = response.data.length === perPage; 
      page++;
    }

    console.log(`Total users fetched: ${users.length}`); 
    return users;
  } catch (error) {
    console.error('Error fetching users:', error.response ? error.response.data : error.message);
  }
}

async function ListAll() {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const users = await GetAll(accessToken);
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log('List of Users:');
  users.forEach(user => {
    console.log(`- ${user.email} (User ID: ${user.user_id}, Logins Count: ${user.logins_count !== undefined ? user.logins_count : 'Not Available'})`); // Adjust logins_count display
  });
}

async function NoLogins() {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const users = await GetAll(accessToken);
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  const NoLogins = users.filter(user => user.logins_count === undefined || user.logins_count === 0);
  
  if (NoLogins.length === 0) {
    console.log('No users with zero logins found.');
  } else {
    console.log('List of Users with 0 Logins:');
    NoLogins.forEach(user => {
      console.log(`- ${user.email} (User ID: ${user.user_id})`);
    });
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
    console.error(`Error deleting user ${userId}:`, error.response ? error.response.data : error.message);
  }
}

async function DeleteAll() {
  const accessToken = await getAccessToken();
  if (!accessToken) return;

  const users = await GetAll(accessToken);
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

async function ChooseList() {
  const option = await inquirer.prompt([
    {
      type: 'list',
      name: 'listOption',
      message: 'What do you want to do?',
      choices: ['List All Users', 'List Users with No Logins', 'Back'],
    },
  ]);

  if (option.listOption === 'List All Users') {
    await ListAll();
  } else if (option.listOption === 'List Users with No Logins') {
    await NoLogins();
  } else {
    console.log('Going back...');
    return; 
  }
}

async function main() {
  const options = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['List Users', 'Delete All Users', 'Exit'],
    },
  ]);

  if (options.action === 'List Users') {
    await ChooseList(); 
  } else if (options.action === 'Delete All Users') {
    await DeleteAll();
  } else {
    console.log('Exiting...');
  }
}

main();
