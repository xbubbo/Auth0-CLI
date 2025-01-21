const axios = require('axios');
const inquirer = require('inquirer').default;
const fs = require('node:fs'); 
require('dotenv').config();

const DOMAIN = process.env.DOMAIN;
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET = process.env.SECRET;
const MONTHS = parseInt(process.env.INACTIVEM) || 0;
const DAYS = parseInt(process.env.INACTIVED) || 0;
const LIMIT = 850; 

async function getToken() {
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

async function GetAll(Token) {
  try {
    let users = [];
    let page = 0;
    const perPage = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(`https://${DOMAIN}/api/v2/users`, {
        headers: {
          Authorization: `Bearer ${Token}`,
        },
        params: {
          page: page,
          per_page: perPage,
        },
      });

      users = users.concat(response.data);
// console.log(`Fetched page ${page + 1} with ${response.data.length} users`);  
      hasMore = response.data.length === perPage;
      page++;
    }

// console.log(`Total users fetched: ${users.length}`); 
    return users;
  } catch (error) {
    console.error('Error fetching users:', error.response ? error.response.data : error.message);
  }
}

async function ListAll() {
  const Token = await getToken();
  if (!Token) return;

  const users = await GetAll(Token);
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log('List of Users:');
  users.forEach(user => {
    console.log(`- ${user.email} (User ID: ${user.user_id}, Logins Count: ${user.logins_count !== undefined ? user.logins_count : 'Not Available'})`);
  });
}

async function NoLogins() {
  const Token = await getToken();
  if (!Token) return;

  const users = await GetAll(Token);
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

async function ListInactive() {
    const Token = await getToken();
    if (!Token) return;
  
    const users = await GetAll(Token);
    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }
  
    if (MONTHS === 0 && DAYS === 0) {
      console.warn('Inactive Months and Days are not set. Please set at least one.');
      return;
    }
  
    let cutoffDate = new Date();
    
    if (MONTHS > 0) {
      cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS);
    }
  
    if (DAYS > 0) {
      cutoffDate.setDate(cutoffDate.getDate() - DAYS);
    }
  
    const inactiveUsers = users.filter(user => {
      const lastLogin = user.last_login ? new Date(user.last_login) : null;
      return !lastLogin || lastLogin < cutoffDate;
    });
  
    if (inactiveUsers.length === 0) {
      console.log('No inactive users found.');
    } else {
      console.log(`Inactive Users: ${inactiveUsers.length}`);
      inactiveUsers.forEach(user => {
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        const inactiveDuration = lastLogin ? Math.floor((Date.now() - lastLogin) / (1000 * 60 * 60 * 24)) : 'N/A';
        console.log(`- ${user.email} (User ID: ${user.user_id}, Inactive for: ${inactiveDuration} days)`);
      });
    }
  }

  async function DeleteUser(Token, userId) {
    const MAX_RETRIES = 5;  
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.delete(`https://${DOMAIN}/api/v2/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${Token}`,
          },
        });
  
        if (response.status === 204) {
          console.log(`Deleted user: ${userId}`);
          return;  
        } else {
          console.log(`Unexpected status for ${userId}: ${response.status}`);
          return;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          retries++;
          const retryAfter = parseInt(error.response.headers['retry-after'] || 5); 
          console.log(`Rate limit hit for ${userId}. Retrying in ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000)); 
        } else {
          console.error(`Error deleting user ${userId}:`, error.response ? error.response.data : error.message);
          return;  
        }
      }
    }
    console.error(`Failed to delete user ${userId} after ${MAX_RETRIES} retries.`);
  }
  
async function DeleteAll() {
    const Token = await getToken();
    if (!Token) return;
  
    const users = await GetAll(Token);
    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }
  
    if (users.length <= 1) {
      console.log('You cannot delete all users. At least one user must remain.');
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
      const ToDelete = users.slice(0, users.length - 1); 
  
      for (const user of ToDelete) {
        await DeleteUser(Token, user.user_id);
        await new Promise(resolve => setTimeout(resolve, LIMIT));
      }
      console.log('All users deleted successfully except for one.');
    } else {
      console.log('Action cancelled. No users were deleted.');
    }
  }
  

async function DeleteNoLogins() {
  const Token = await getToken();
  if (!Token) return;

  const users = await GetAll(Token);
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

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete all users with no logins? This action is irreversible.',
        default: false,
      },
    ]);

    if (answer.confirm) {
      for (const user of NoLogins) {
        await DeleteUser(Token, user.user_id);
      }
      console.log('All users with no logins deleted successfully.');
    } else {
      console.log('Action cancelled. No users were deleted.');
    }
  }
}

async function DeleteInactive() {
    const Token = await getToken();
    if (!Token) return;
  
    const users = await GetAll(Token);
    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }
  
    const cutoffDate = new Date();
  
    if (MONTHS > 0) {
      cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS);
    }
  
    if (DAYS > 0) {
      cutoffDate.setDate(cutoffDate.getDate() - DAYS);
    }
  
    const inactiveUsers = users.filter(user => {
      const lastLogin = user.last_login ? new Date(user.last_login) : null;
      return !lastLogin || lastLogin < cutoffDate;
    });
  
    const inactiveCount = inactiveUsers.length;
    if (inactiveCount === 0) {
      console.log('No inactive users found.');
    } else {
      console.log(`Fetched ${Math.ceil(users.length / 50)} pages with ${users.length} users`);
      console.log(`Inactive Users: ${inactiveCount}`);
      console.log('List of Inactive Users:');
  
      inactiveUsers.forEach(user => {
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        const inactiveDuration = lastLogin ? Math.floor((Date.now() - lastLogin) / (1000 * 60 * 60 * 24)) : 'N/A';
        console.log(`- ${user.email} (User ID: ${user.user_id}, Inactive for: ${inactiveDuration} days)`);
      });
  
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete all inactive users? This action is irreversible.',
          default: false,
        },
      ]);
  
      if (answer.confirm) {
        console.log(`Deleting ${inactiveCount} inactive users...`);
        for (const user of inactiveUsers) {
          await DeleteUser(Token, user.user_id);
        }
        console.log('All inactive users deleted successfully.');
      } else {
        console.log('Action cancelled. No users were deleted.');
      }
    }
  }
  
async function AddUser() {
    const Token = await getToken();
    if (!Token) return;
  
    let email; 
  
    while (true) { 
      if (!email) {
        const emailInput = await inquirer.prompt([
          { type: 'input', name: 'email', message: 'Enter the email of the user:' },
        ]);
        email = emailInput.email; 
      }
  
      const passwordInput = await inquirer.prompt([
        { type: 'input', name: 'password', message: 'Enter the password for the user:' },
      ]);
      const password = passwordInput.password; 
  
      try {
        const response = await axios.post(`https://${DOMAIN}/api/v2/users`, {
          email: email,
          password: password,
          connection: process.env.CONNECTION,
        }, {
          headers: {
            Authorization: `Bearer ${Token}`,
          },
        });
        console.log(`Added user: ${response.data.email} (User ID: ${response.data.user_id})`);
        break; 
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message.includes('PasswordStrengthError')) {
          console.log('Password is too weak. Please try again.'); 
        } else {
          console.error(`Error adding user:`, error.response ? error.response.data : error.message);
          break; 
        }
      }
    }
  }
  
async function ImportUsers() {
    const Token = await getToken();
    if (!Token) return;
  
    fs.readFile('./data/users.json', 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading users.json:', err);
        return;
      }
  
      try {
        const users = JSON.parse(data);
        for (const user of users) {
          await axios.post(`https://${DOMAIN}/api/v2/users`, {
            email: user.email,
            password: user.password,
            connection: process.env.CONNECTION, 
          }, {
            headers: {
              Authorization: `Bearer ${Token}`,
            },
          });
          console.log(`Imported user: ${user.email}`);
          await new Promise(resolve => setTimeout(resolve, LIMIT));
        }
      } catch (error) {
        console.error(`Error importing users:`, error.response ? error.response.data : error.message);
      }
    });
  }
  

async function ChooseList() {
  const option = await inquirer.prompt([
    {
      type: 'list',
      name: 'list',
      message: 'What do you want to do?',
      choices: ['List All Users', 'List Users with No Logins', 'List Inactive Accounts', 'Back'],
    },
  ]);

  if (option.list === 'List All Users') {
    await ListAll();
  } else if (option.list === 'List Users with No Logins') {
    await NoLogins();
  } else if (option.list === 'List Inactive Accounts') {
    await ListInactive();
} else if (option.list === 'Back') {
    await Main();
  }  
}

async function ChooseDelete() {
  const option = await inquirer.prompt([
    {
      type: 'list',
      name: 'deleteOption',
      message: 'What do you want to delete?',
      choices: ['Delete All Users', 'Delete Users with No Logins', 'Delete Inactive Users', 'Back'],
    },
  ]);

  if (option.deleteOption === 'Delete All Users') {
    await DeleteAll();
  } else if (option.deleteOption === 'Delete Users with No Logins') {
    await DeleteNoLogins();
  } else if (option.deleteOption === 'Delete Inactive Users') {
    await DeleteInactive();
  } else if (option.deleteOption === 'Back') {
    await Main();
  }
}

async function ChooseAdd() {
    const option = await inquirer.prompt([
      {
        type: 'list',
        name: 'addOption',
        message: 'What do you want to do?',
        choices: ['Add User', 'Import Users', 'Back'],
      },
    ]);
  
    if (option.addOption === 'Add User') {
      await AddUser();
    } else if (option.addOption === 'Import Users') {
      await ImportUsers();
    } else if (option.addOption === 'Back') {
      await Main();
    }
  }

  async function Main() {
    const option = await inquirer.prompt([
      {
        type: 'list',
        name: 'list',
        message: 'What do you want to do?',
        choices: ['List Users', 'Delete Users', 'Add Users', 'Exit'],
      },
    ]);
  
    if (option.list === 'List Users') {
      await ChooseList();
    } else if (option.list === 'Delete Users') {
      await ChooseDelete();
    } else if (option.list === 'Add Users') {
      await ChooseAdd();
    } else {
      console.log('Exiting...');
    }
  }

Main();
