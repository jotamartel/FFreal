# Setup Guide - Friends & Family Discount App

## Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database (Vercel Postgres, Supabase, or self-hosted)
- Shopify Partner account
- Resend account (for emails)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `POSTGRES_URL`: Your PostgreSQL connection string
- `SHOPIFY_API_KEY`: From your Shopify app settings
- `SHOPIFY_API_SECRET`: From your Shopify app settings
- `SHOPIFY_APP_URL`: Your app URL (e.g., `https://your-app.vercel.app`)
- `RESEND_API_KEY`: Your Resend API key
- `JWT_SECRET`: A random secret for JWT tokens

### 3. Database Setup

Execute the schema file in your PostgreSQL database:

```bash
psql $POSTGRES_URL < lib/database/schema.sql
```

Or use a database GUI tool to run `lib/database/schema.sql`.

### 4. Shopify App Configuration

1. Create a new app in your Shopify Partner Dashboard
2. Set the app URL to your deployed URL
3. Configure scopes:
   - `read_customers`
   - `write_customers`
   - `read_orders`
   - `write_orders`
   - `read_products`
   - `write_discounts`
   - `read_discounts`
   - `read_checkouts`
   - `write_checkouts`

### 5. Run Development Server

```bash
npm run dev
```

### 6. Start Shopify CLI

In another terminal:

```bash
npm run shopify:dev
```

## Project Structure

```
/
├── app/
│   ├── api/              # API routes
│   │   ├── groups/       # Group management
│   │   ├── invitations/  # Invitation system
│   │   ├── checkout/     # Checkout integration
│   │   ├── customer/     # Customer portal
│   │   ├── admin/        # Admin panel
│   │   └── appointments/ # Appointment booking
│   ├── admin/            # Merchant admin pages
│   └── customer/         # Customer portal pages
├── components/           # React components
├── lib/
│   ├── database/         # Database functions
│   ├── shopify/          # Shopify integration
│   └── email/             # Email service
└── types/                # TypeScript types
```

## Key Features

### Friends & Family System
- Group creation and management
- Member invitation via email
- Tiered discount structure
- Automatic discount at checkout
- Customer portal for group management

### Appointment System
- Multi-branch appointment scheduling
- Availability slot management
- Email notifications
- Admin panel for management

## API Endpoints

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List groups
- `GET /api/groups/[id]` - Get group details
- `PUT /api/groups/[id]` - Update group

### Invitations
- `POST /api/invitations` - Create invitation
- `GET /api/invitations?token=...` - Get invitation
- `POST /api/invitations/[token]/accept` - Accept invitation

### Checkout
- `POST /api/checkout/validate-code` - Validate group code

### Customer
- `GET /api/customer/group` - Get customer's groups
- `POST /api/customer/group/leave` - Leave group

### Admin
- `GET /api/admin/groups` - List all groups
- `POST /api/admin/groups/[id]/suspend` - Suspend/terminate group
- `GET /api/admin/config` - Get discount config
- `PUT /api/admin/config` - Update discount config
- `GET /api/admin/analytics` - Get analytics

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/[id]` - Get appointment
- `PATCH /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Cancel appointment

## Next Steps

1. **Implement Shopify Authentication**: Add proper Shopify OAuth flow
2. **Create Admin UI**: Build merchant admin panel with Polaris
3. **Create Customer Portal**: Build customer-facing group management UI
4. **Checkout Integration**: Implement checkout extension for discount application
5. **Email Templates**: Create professional email templates
6. **Testing**: Add unit and integration tests

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Next.js.

## Support

For issues or questions, refer to the README.md file or create an issue in the repository.

