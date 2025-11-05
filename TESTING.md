# Testing Guide - Friends & Family App

## Pre-requisites

1. **Database Setup**
   ```bash
   # Execute schema in your PostgreSQL database
   psql $POSTGRES_URL < lib/database/schema.sql
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env
   # Fill in all required variables
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

## Type Checking

```bash
npm run type-check
```

## Linting

```bash
npm run lint
```

## Development Server

```bash
npm run dev
```

Then visit:
- Admin: http://localhost:3000/admin
- Customer: http://localhost:3000/customer
- API: http://localhost:3000/api

## Manual Testing Checklist

### Admin Panel Tests

- [ ] **Dashboard** (`/admin`)
  - [ ] Page loads without errors
  - [ ] Navigation cards are clickable
  - [ ] Analytics section visible

- [ ] **Groups Management** (`/admin/groups`)
  - [ ] List of groups loads
  - [ ] Search functionality works
  - [ ] Status filter works
  - [ ] Can view group details

- [ ] **Group Details** (`/admin/groups/[id]`)
  - [ ] Group information displays
  - [ ] Members list shows
  - [ ] Can suspend/terminate group
  - [ ] Status badges display correctly

- [ ] **Discount Config** (`/admin/config`)
  - [ ] Configuration loads
  - [ ] Can enable/disable program
  - [ ] Can add/remove discount tiers
  - [ ] Can save configuration

- [ ] **Analytics** (`/admin/analytics`)
  - [ ] Metrics display correctly
  - [ ] Groups by status shows data
  - [ ] Top groups list works

- [ ] **Appointments** (`/admin/appointments`)
  - [ ] List of appointments loads
  - [ ] Search works
  - [ ] Status filter works
  - [ ] Can view appointment details

### Customer Portal Tests

- [ ] **Dashboard** (`/customer`)
  - [ ] Shows customer's groups
  - [ ] Active discount badge displays
  - [ ] Can create new group
  - [ ] Can navigate to appointments

- [ ] **Create Group** (`/customer/groups/new`)
  - [ ] Form validates required fields
  - [ ] Can create group successfully
  - [ ] Redirects to group detail after creation

- [ ] **Group Detail** (`/customer/groups/[id]`)
  - [ ] Group information displays
  - [ ] Invite code shows
  - [ ] Can invite by email
  - [ ] Members list shows
  - [ ] Can leave group (if not owner)

- [ ] **Invitations** (`/customer/invitations/[token]`)
  - [ ] Invitation page loads
  - [ ] Shows group information
  - [ ] Can accept invitation
  - [ ] Handles expired invitations
  - [ ] Handles full groups

- [ ] **Appointments** (`/customer/appointments`)
  - [ ] List of appointments loads
  - [ ] Can book new appointment
  - [ ] Shows appointment status

- [ ] **Book Appointment** (`/customer/appointments/new`)
  - [ ] Branches dropdown loads
  - [ ] Date picker works
  - [ ] Time slots load based on date
  - [ ] Can submit appointment
  - [ ] Validates required fields

### API Endpoints Tests

#### Groups API
```bash
# Create group
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "test-merchant",
    "name": "Test Group",
    "ownerCustomerId": "test-customer",
    "ownerEmail": "test@example.com",
    "maxMembers": 6
  }'

# Get groups
curl http://localhost:3000/api/groups?customerId=test-customer

# Get group by ID
curl http://localhost:3000/api/groups/[group-id]
```

#### Invitations API
```bash
# Create invitation
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group-id",
    "email": "invitee@example.com"
  }'

# Get invitation by token
curl http://localhost:3000/api/invitations?token=invitation-token

# Accept invitation
curl -X POST http://localhost:3000/api/invitations/token/accept \
  -H "Content-Type: application/json" \
  -d '{"customerId": "test-customer"}'
```

#### Appointments API
```bash
# Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "test-merchant",
    "branchId": "branch-id",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "appointmentDate": "2024-12-15",
    "appointmentTime": "10:00"
  }'

# Get appointments
curl http://localhost:3000/api/appointments?email=john@example.com
```

#### Checkout API
```bash
# Validate group code
curl -X POST http://localhost:3000/api/checkout/validate-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "INVITE123",
    "merchantId": "test-merchant"
  }'
```

## Database Tests

### Test Database Connection
```sql
-- Test connection
SELECT NOW();

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ff_%' OR table_name = 'appointments';

-- Test group creation (via API, then check DB)
SELECT * FROM ff_groups LIMIT 5;
SELECT * FROM ff_group_members LIMIT 5;
SELECT * FROM ff_invitations LIMIT 5;
```

## Email Tests

### Test Email Service
```typescript
// In a test script or API route
import { sendInvitationEmail } from '@/lib/email/service';

await sendInvitationEmail(
  'test@example.com',
  'Test Group',
  'http://localhost:3000/customer/invitations/test-token'
);
```

**Note**: Make sure `RESEND_API_KEY` is set in `.env`

## Common Issues & Solutions

### Issue: "Cannot find module '@/lib/...'"
**Solution**: Check `tsconfig.json` paths configuration

### Issue: Database connection errors
**Solution**: 
- Verify `POSTGRES_URL` is correct
- Check database is accessible
- Verify SSL settings if using Supabase/Vercel

### Issue: Polaris components not rendering
**Solution**: 
- Verify `@shopify/polaris` is installed
- Check CSS import in `PolarisProvider.tsx`
- Ensure `ShopifyAppWrapper` is used in layouts

### Issue: API routes return 404
**Solution**:
- Check route file exists in correct location
- Verify file exports correct HTTP methods
- Check Next.js is running in development mode

### Issue: Emails not sending
**Solution**:
- Verify `RESEND_API_KEY` is set
- Check email service logs
- Verify `EMAIL_FROM` domain is verified in Resend

## Next Steps After Testing

1. Fix any TypeScript errors
2. Fix any linting issues
3. Test all API endpoints
4. Test all UI pages
5. Verify database operations
6. Test email sending
7. Set up production environment variables
8. Deploy to staging environment

