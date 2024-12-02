# Auth0 CLI Setup Guide

## Prerequisites  
- An active Auth0 account  
- Auth0 Application configured  
- Copy the example environment file: 
```
cp .env.example .env
```

## Steps  

### Step 1: Retrieve Your Auth0 Domain  
1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/dashboard/).  
2. Navigate to **Applications > Applications**.  
3. Open your application's **Settings**.  
4. Locate the **Domain** under the **Basic Information** section.  
5. Copy the **Domain** value and add it to your `.env` file.  

### Step 2: Retrieve Your Client ID  
1. Just below the **Domain** in the **Settings** section, find the **Client ID**.  
2. Copy the **Client ID** value and add it to your `.env` file.  

### Step 3: Retrieve Your Client Secret  
1. Below the **Client ID**, locate the **Client Secret**.  
2. Copy the **Client Secret** value and add it to your `.env` file.  

### Step 4: Retrieve Your Database Connection Name  
1. Navigate to **Authentication > Database** in the Auth0 Dashboard.  
2. Copy the **Database Connection Name**.  
3. Add it to your `.env` file.  
