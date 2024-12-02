# Auth0 CLI Setup Guide  

## Prerequisites  
- Active Auth0 account  
- Configured Auth0 application  

## Steps  

### Step 1: Copy Environment File  
#### For Linux/Mac:  
```bash
cp .env.example .env
```  

#### For Windows (PowerShell):  
```powershell
Copy-Item .env.example .env
```  

### Step 2: Retrieve Auth0 Domain  
1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/dashboard/).  
2. Go to **Applications > Applications**.  
3. Open your application's **Settings**.  
4. Find the **Domain** in the **Basic Information** section.  
5. Copy the **Domain** value and add it to your `.env` file as:  
   ```
   DOMAIN=<your-domain>
   ```  

### Step 3: Retrieve Client ID  
1. In the **Settings** section, locate the **Client ID** below the **Domain**.  
2. Copy the **Client ID** and add it to your `.env` file as:  
   ```
   CLIENT_ID=<your-client-id>
   ```  

### Step 4: Retrieve Client Secret  
1. In the **Settings** section, find the **Client Secret** below the **Client ID**.  
2. Copy the **Client Secret** and add it to your `.env` file as:  
   ```
   SECRET=<your-client-secret>
   ```  

### Step 5: Retrieve Database Connection Name  
1. Go to **Authentication > Database** in the Auth0 Dashboard.  
2. Locate and copy the **Database Connection Name**.  
3. Add it to your `.env` file as:  
   ```
   CONNECTION=<your-db-connection-name>
   ```  
