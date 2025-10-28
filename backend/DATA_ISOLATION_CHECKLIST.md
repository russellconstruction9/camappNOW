# Complete Data Isolation Checklist

## ✅ ALL Company Data is Organization-Scoped

Every piece of data that belongs to a business/organization is now completely isolated:

### 1. ✅ Projects
```javascript
// CREATE - includes organization_id
INSERT INTO projects (organization_id, name, address, type, status, start_date, end_date, budget)

// READ - filtered by organization_id
SELECT * FROM projects WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE projects SET ... WHERE id = $1 AND organization_id = $2

// DELETE - verified by organization_id
DELETE FROM projects WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization only sees their own projects

---

### 2. ✅ Tasks
```javascript
// CREATE - includes organization_id
INSERT INTO tasks (organization_id, title, description, project_id, assignee_id, due_date, status)

// READ - filtered by organization_id
SELECT * FROM tasks WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE tasks SET ... WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization only sees their own tasks

---

### 3. ✅ Time Logs (Labor Tracking)
```javascript
// Clock In - includes organization_id
INSERT INTO time_logs (organization_id, user_id, project_id, clock_in, clock_in_location)

// Clock Out - filtered by organization_id
UPDATE time_logs SET clock_out = $1 WHERE user_id = $2 AND organization_id = $3

// Get Time Logs - filtered by organization_id
SELECT * FROM time_logs WHERE user_id = $1 AND organization_id = $2

// Project validation
SELECT id FROM projects WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization only sees their own time tracking data

---

### 4. ✅ Punch List Items
```javascript
// CREATE - includes organization_id
INSERT INTO punch_list_items (organization_id, project_id, text)

// READ - filtered by organization_id
SELECT * FROM punch_list_items WHERE project_id = $1 AND organization_id = $2

// UPDATE - verified by organization_id
UPDATE punch_list_items SET is_complete = NOT is_complete 
WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization only sees their own punch list items

---

### 5. ✅ Project Photos
```javascript
// CREATE - includes organization_id
INSERT INTO project_photos (organization_id, project_id, storage_url, description)

// READ - filtered by organization_id
SELECT * FROM project_photos WHERE project_id = $1 AND organization_id = $2

// DELETE - verified by organization_id
DELETE FROM project_photos WHERE id = $1 AND organization_id = $2

// Storage Path - organized by organization
/uploads/organizations/${organizationId}/projects/${projectId}/${filename}
```
**Result**: Each organization only sees their own photos, stored in separate folders

---

### 6. ✅ Invoices
```javascript
// CREATE - includes organization_id
INSERT INTO invoices (organization_id, invoice_number, project_id, date_issued, ...)

// READ - filtered by organization_id
SELECT * FROM invoices WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE invoices SET ... WHERE id = $1 AND organization_id = $2

// DELETE - verified by organization_id
DELETE FROM invoices WHERE id = $1 AND organization_id = $2

// Invoice Number - unique per organization
CONSTRAINT invoices_org_invoice_number_unique UNIQUE(organization_id, invoice_number)
```
**Result**: Each organization has their own invoices with independent numbering

---

### 7. ✅ Invoice Line Items
```javascript
// Scoped via invoice relationship
// When creating line items, invoice is already verified to belong to organization

// Time Log Associations - verified
SELECT id FROM time_logs WHERE id = $1 AND organization_id = $2
// Only allows linking time logs that belong to the organization
```
**Result**: Line items automatically scoped via invoice, time logs verified

---

### 8. ✅ Expenses
```javascript
// CREATE - includes organization_id
INSERT INTO expenses (organization_id, project_id, description, amount, date, vendor)

// READ - filtered by organization_id
SELECT * FROM expenses WHERE project_id = $1 AND organization_id = $2
SELECT * FROM expenses WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE expenses SET ... WHERE id = $1 AND organization_id = $2

// DELETE - verified by organization_id
DELETE FROM expenses WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization only sees their own expenses

---

### 9. ✅ Inventory Items
```javascript
// CREATE - includes organization_id
INSERT INTO inventory_items (organization_id, name, quantity, unit, cost, low_stock_threshold)

// READ - filtered by organization_id
SELECT * FROM inventory_items WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE inventory_items SET ... WHERE id = $1 AND organization_id = $2

// DELETE - verified by organization_id
DELETE FROM inventory_items WHERE id = $1 AND organization_id = $2
```
**Result**: Each organization has completely separate inventory

---

### 10. ✅ Users
```javascript
// CREATE - includes organization_id
INSERT INTO users (organization_id, email, password_hash, name, role, hourly_rate)

// READ - filtered by organization_id
SELECT * FROM users WHERE organization_id = $1

// UPDATE - verified by organization_id
UPDATE users SET ... WHERE id = $1 AND organization_id = $2

// Email uniqueness - per organization
CONSTRAINT users_email_organization_unique UNIQUE(email, organization_id)
```
**Result**: Users belong to organizations, same email can exist in different organizations

---

## Data Flow Examples

### Creating a Project
```
1. User logs in → Gets token with user_id
2. Middleware extracts user_id from token
3. Middleware queries: SELECT organization_id FROM users WHERE id = user_id
4. Middleware sets req.organizationId
5. Route handler creates project:
   INSERT INTO projects (organization_id, ...) VALUES (req.organizationId, ...)
```

### Creating an Invoice
```
1. User creates invoice for project
2. Route validates: SELECT id FROM projects WHERE id = projectId AND organization_id = req.organizationId
3. If project doesn't belong to org → 404 error
4. Creates invoice: INSERT INTO invoices (organization_id, project_id, ...)
5. Links time logs: Only time logs WHERE organization_id = req.organizationId can be linked
```

### Time Tracking
```
1. User clocks in to project
2. Validates: SELECT id FROM projects WHERE id = projectId AND organization_id = req.organizationId
3. Checks existing clock-in: SELECT * FROM time_logs WHERE user_id AND organization_id AND clock_out IS NULL
4. Creates: INSERT INTO time_logs (organization_id, user_id, project_id, clock_in)
```

---

## Security Guarantees

### ✅ No Cross-Organization Access
- **Projects**: Organization A cannot see Organization B's projects
- **Time Logs**: Organization A cannot see Organization B's hours
- **Invoices**: Organization A cannot see Organization B's invoices
- **Inventory**: Organization A cannot see Organization B's inventory
- **Expenses**: Organization A cannot see Organization B's expenses
- **Photos**: Organization A cannot see Organization B's photos

### ✅ Relationship Validation
When creating relationships (invoice → time logs, task → project, etc.):
```javascript
// ALWAYS verify both entities belong to same organization
const projectCheck = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND organization_id = $2',
    [projectId, organizationId]
);
```

### ✅ Server-Side Enforcement
Organization context is set by middleware based on authenticated user:
```javascript
// Client CANNOT fake organization_id
// It's determined server-side from JWT token → user → organization
```

---

## What Gets Stored Per Organization

### Company/Organization Level:
- ✅ Organization name, subdomain, plan, billing
- ✅ Organization members with roles
- ✅ Organization settings (max users, etc.)

### Operational Data:
- ✅ **All Projects** (with addresses, budgets, dates)
- ✅ **All Tasks** (assigned to users in the organization)
- ✅ **All Time Logs** (employee hours, costs, locations)
- ✅ **All Punch Lists** (per project)
- ✅ **All Photos** (project photos, stored separately)
- ✅ **All Invoices** (with line items and time log associations)
- ✅ **All Expenses** (project costs, vendors)
- ✅ **All Inventory** (materials, quantities, costs)
- ✅ **All Users** (employees, hourly rates)

### Shared (Not Organization-Specific):
- ❌ Geocoding cache (address → lat/lng mapping, shared for efficiency)

---

## Complete Isolation

**Organization 1: "Acme Construction"**
- Projects: Office Building, Warehouse, Store
- Users: John (Owner), Mary (Manager), Bob (Installer)
- Inventory: 100 2x4 lumber, 50 bags cement
- Invoices: #001, #002, #003

**Organization 2: "BuildCo"**
- Projects: School, Hospital, Bridge
- Users: Alice (Owner), Dave (Installer)
- Inventory: 200 steel beams, 30 paint cans
- Invoices: #001, #002 (same numbers, different org!)

**They NEVER see each other's data!**

---

## Migration Status

### ✅ Already Have organization_id:
- `users` table
- All route logic updated

### ⚠️ Need to Run Migration:
```sql
ALTER TABLE projects ADD COLUMN organization_id ...
ALTER TABLE tasks ADD COLUMN organization_id ...
ALTER TABLE time_logs ADD COLUMN organization_id ...
ALTER TABLE punch_list_items ADD COLUMN organization_id ...
ALTER TABLE project_photos ADD COLUMN organization_id ...
ALTER TABLE inventory_items ADD COLUMN organization_id ...
ALTER TABLE invoices ADD COLUMN organization_id ...
ALTER TABLE expenses ADD COLUMN organization_id ...
```

Once migration runs, **EVERY** piece of company data is completely isolated! 🔒

