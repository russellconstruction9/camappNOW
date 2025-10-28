# ConstructTrack Pro Backend API

## Setup & Deployment

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Set up Supabase database:**
   - Log into your Supabase project
   - Navigate to SQL Editor
   - Run the SQL from `src/db/schema.sql` to create all tables

4. **Update `.env` with Supabase connection details:**
   ```env
   DB_HOST=db.cqhocbnosmqaqmzpyguy.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-supabase-password
 Digit```Unk-' 


### Vercel Deployment

1. **Deploy to Vercel:**
   ```bash
   cd backend
   vercel
   ```

2. **Add environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add all variables from `.env.example`
   - Use Vercel Secrets for sensitive values

3. **The `vercel.json` configuration:**
   - Already configured for Node.js
   - Routes all traffic to `src/index.js`
   - Uses `@vercel/node` runtime

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Projects
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get single project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/punch-list` - Add punch list item
- `PUT /api/v1/projects/:projectId/punch-list/:itemId` - Toggle punch list item

### Tasks
- `GET /api/v1/tasks` - List tasks (with optional filters)
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task

### Time Logs
- `POST /api/v1/timelogs/clock-in` - Clock in
- `POST /api/v1/timelogs/clock-out` - Clock out
- `POST /api/v1/timelogs/switch` - Switch job
- `GET /api/v1/timelogs/user/:userId` - Get user's time logs

### Photos
- `GET /api/v1/photos/projects/:projectId` - Get project photos
- `POST /api/v1/photos/projects/:projectId/upload-url` - Get upload URLs
- `POST /api/v1/photos/upload` - Upload photo
- `POST /api/v1/photos/projects/:projectId` - Create photo record
- `DELETE /api/v1/photos/:photoId` - Delete photo

### Invoices
- `GET /api/v1/invoices` - List all invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices/:id` - Get single invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice

### Expenses
- `GET /api/v1/expenses/projects/:projectId` - Get project expenses
- `POST /api/v1/expenses/projects/:projectId` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Inventory
- `GET /api/v1/inventory` - List all inventory items
- `POST /api/v1/inventory` - Create inventory item
- `PUT /api/v1/inventory/:id` - Update inventory item
- `DELETE /api/v1/inventory/:id` - Delete inventory item

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get single user
- `PUT /api/v1/users/:id` - Update user

## Database Schema

The complete schema is in `src/db/schema.sql` including:

- Users (with authentication)
- Projects (with punch lists and photos)
- Tasks
- Time Logs (with location tracking)
- Inventory Items
- Invoices (with line items and time log associations)
- Expenses
- Geocoding Cache

## Next Steps (TODO)

- [ ] Implement AI/Gemini proxy endpoints
- [ ] Implement geocoding with Redis caching
- [ ] Implement server-side PDF report generation
- [ ] Add file storage integration (S3/GCS for production)
- [ ] Add request validation middleware
- [ ] Add rate limiting
- [ ] Add comprehensive error handling
- [ ] Add API documentation (Swagger/OpenAPI)

