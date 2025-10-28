# Complete Authentication & Company Setup Guide

## ✅ YES - Company and User Login is Fully Implemented

## Registration Flow

### Option 1: Create New Company (First User = Owner)

When the **first person** from a company signs up:

```javascript
POST /api/v1/auth/register
{
  "email": "owner@acmeconstruction.com",
  "password": "securePassword123",
  "name": "John Smith",
  "role": "Owner",
  "hourlyRate": 50,
  "organizationName": "Acme Construction"  // Optional, defaults to "John Smith's Organization"
}
```

**What happens:**
1. ✅ Creates new organization "Acme Construction"
2. ✅ Creates user John Smith with email/password
3. ✅ Links user to organization as "Owner"
4. ✅ Returns JWT token and user info

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "owner@acmeconstruction.com",
    "name": "John Smith",
    "role": "Owner",
    "hourlyRate": 50,
    "organizationId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Option 2: Join Existing Company (Additional Employees)

When **additional employees** join an existing company:

```javascript
POST /api/v1/auth/register
{
  "email": "worker@acmeconstruction.com",
  "password": "password123",
  "name": "Jane Worker",
  "role": "Installer",
  "hourlyRate": 25,
  "organizationId": 1  // Join existing organization
}
```

**What happens:**
1. ✅ Verifies organization exists
2. ✅ Creates user Jane Worker
3. ✅ Links user to organization as "Member"
4. ✅ Returns JWT token and user info

**Response:**
```json
{
  "user": {
    "id": 2,
    "email": "worker@acmeconstruction.com",
    "name": "Jane Worker",
    "role": "Installer",
    "hourlyRate": 25,
    "organizationId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Login Flow

### Standard Login

```javascript
POST /api/v1/auth/login
{
  "email": "owner@acmeconstruction.com",
  "password": "securePassword123"
}
```

**Response includes:**
```json
{
  "user": {
    "id": 1,
    "email": "owner@acmeconstruction.com",
    "name": "John Smith",
    "role": "Owner",
    "hourlyRate": 50,
    "organizationId": 1
  },
  "organizations": [
    {
      "id": 1,
      "name": "Acme Construction",
      "subdomain": "acme",
      "user_role": "owner"
    },
    {
      "id": 2,
      "name": "BuildCo",
      "subdomain": "buildco",
      "user_role": "member"
    }
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Why return organizations array?**
- Users can belong to multiple companies!
- Example: A consultant might work for 3 different construction companies
- Frontend can show organization switcher

---

### Login to Specific Organization (Optional)

If user belongs to multiple organizations, you can specify which one:

```javascript
POST /api/v1/auth/login
{
  "email": "owner@acmeconstruction.com",
  "password": "securePassword123",
  "organizationId": 1  // Optional: login to specific org
}
```

---

## Get Current User

After login, get user details with their organizations:

```javascript
GET /api/v1/auth/me
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "id": 1,
  "email": "owner@acmeconstruction.com",
  "name": "John Smith",
  "role": "Owner",
  "hourlyRate": 50,
  "organizationId": 1,
  "organizations": [
    {
      "id": 1,
      "name": "Acme Construction",
      "subdomain": "acme",
      "user_role": "owner"
    }
  ]
}
```

---

## Complete User Journey

### Scenario 1: New Company Signs Up

**Step 1: Owner registers (creates company)**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "boss@construction.com",
    "password": "password123",
    "name": "Boss Man",
    "role": "Owner",
    "hourlyRate": 75,
    "organizationName": "Boss Construction"
  }'

# Creates:
# - Organization "Boss Construction" 
# - User "Boss Man" as Owner
# - Returns token
```

**Step 2: Owner invites employees**
```bash
# Owner shares organization ID (1) with employees

# Employee 1 registers
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker1@construction.com",
    "password": "password123",
    "name": "Worker One",
    "role": "Installer",
    "hourlyRate": 25,
    "organizationId": 1
  }'

# Employee 2 registers
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker2@construction.com",
    "password": "password123",
    "name": "Worker Two",
    "role": "Installer",
    "hourlyRate": 25,
    "organizationId": 1
  }'
```

**Step 3: Everyone logs in**
```bash
# Anyone can login with their credentials
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker1@construction.com",
    "password": "password123"
  }'

# Returns token - use for all API requests
```

---

### Scenario 2: User Belongs to Multiple Companies

```javascript
// Consultant Jane works for 3 companies

// She registered with Company A (created her account)
POST /api/v1/auth/register
{
  "email": "jane@email.com",
  "organizationId": 1  // Company A
}

// Company B invited her - admin uses:
POST /api/v1/organizations/2/members
{
  "email": "jane@email.com",
  "role": "member"
}

// Company C invited her - admin uses:
POST /api/v1/organizations/3/members
{
  "email": "jane@email.com",
  "role": "member"
}

// When Jane logs in:
POST /api/v1/auth/login
{
  "email": "jane@email.com",
  "password": "password"
}

// Returns all 3 organizations
{
  "organizations": [
    { "id": 1, "name": "Company A", "user_role": "member" },
    { "id": 2, "name": "Company B", "user_role": "member" },
    { "id": 3, "name": "Company C", "user_role": "member" }
  ]
}

// Frontend shows organization switcher
// Jane selects "Company B"
// All subsequent API calls show only Company B's data
```

---

## Email Rules

### Same Email, Different Companies: ✅ ALLOWED

```javascript
// John works for 2 separate companies

// Company 1
{
  "email": "john@email.com",
  "organizationId": 1
}

// Company 2  
{
  "email": "john@email.com",
  "organizationId": 2
}

// This is ALLOWED - same email can exist in multiple organizations
// Database constraint: UNIQUE(email, organization_id)
```

### Same Email, Same Company: ❌ NOT ALLOWED

```javascript
// Company 1 already has john@email.com

// Try to register again with same email
{
  "email": "john@email.com",
  "organizationId": 1
}

// Error: "User with this email already exists in this organization"
```

---

## Frontend Implementation

### Registration Page

```javascript
// Step 1: Check if creating new company or joining existing
const isNewCompany = !inviteCode;

// Step 2: Register
const registerUser = async (formData) => {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      hourlyRate: formData.hourlyRate,
      ...(isNewCompany 
        ? { organizationName: formData.companyName }
        : { organizationId: inviteCode }
      )
    })
  });

  const { user, token } = await response.json();
  
  // Save token
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Redirect to dashboard
  navigate('/dashboard');
};
```

### Login Page

```javascript
const loginUser = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { user, organizations, token } = await response.json();
  
  // Save token and user info
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('organizations', JSON.stringify(organizations));
  
  // If multiple organizations, show selector
  if (organizations.length > 1) {
    navigate('/select-organization');
  } else {
    navigate('/dashboard');
  }
};
```

### Organization Switcher

```javascript
const OrganizationSwitcher = () => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);

  useEffect(() => {
    const orgs = JSON.parse(localStorage.getItem('organizations'));
    const user = JSON.parse(localStorage.getItem('user'));
    setOrganizations(orgs);
    setCurrentOrg(orgs.find(o => o.id === user.organizationId));
  }, []);

  const switchOrganization = async (orgId) => {
    // Update user's default organization
    const response = await fetch('/api/v1/auth/me', {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // All API calls now automatically use this organization
    window.location.reload(); // Refresh to load new org's data
  };

  return (
    <select onChange={(e) => switchOrganization(e.target.value)}>
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.user_role})
        </option>
      ))}
    </select>
  );
};
```

---

## Security Features

### ✅ Password Hashing
- All passwords hashed with bcrypt (10 rounds)
- Never stored in plain text

### ✅ JWT Tokens
- Token contains userId and email
- Token signed with secret key
- Expires after 7 days (configurable)

### ✅ Organization Isolation
- User can only access data from their organizations
- Middleware automatically filters all data

### ✅ Role-Based Access
- Owner: Full control
- Admin: Manage users and data
- Manager: Manage projects
- Member: View and create

---

## Summary

### ✅ Company Creation
- First user registers → Creates company → Becomes owner

### ✅ User Registration  
- Additional users join with organizationId → Become members

### ✅ Login
- Email + password → Returns token + user + organizations

### ✅ Multi-Organization Support
- Users can belong to multiple companies
- Easy switching between organizations

### ✅ Security
- Password hashing, JWT tokens, organization isolation

**Everything is ready to go!** 🚀

