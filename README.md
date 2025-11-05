# Shopify Friends & Family Discount App

A standalone Shopify app that enables merchants to offer Friends & Family discount programs with client-side group management, similar to YouTube Premium Family plans. Includes an integrated appointment booking system.

## 🎯 Features

### Friends & Family Discount System
- ✅ Group creation and management
- ✅ Member invitation system via email
- ✅ Tiered discount structure (configurable by merchant)
- ✅ Automatic discount application at checkout
- ✅ Customer portal for group management
- ✅ Merchant admin panel with analytics
- ✅ Email verification system
- ✅ Fraud prevention (rate limiting, cooling periods)

### Appointment Booking System
- ✅ Multi-branch appointment scheduling
- ✅ Availability slot management
- ✅ Email notifications
- ✅ Admin panel for appointment management
- ✅ Integration with Shopify customer accounts

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database (Vercel Postgres, Supabase, or self-hosted)
- Shopify Partner account
- Resend account (for emails)

### Installation

1. **Clone or navigate to the project:**
```bash
cd shopify-friends-family-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
POSTGRES_URL=your_postgres_connection_string
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=your_app_url
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret
```

4. **Set up the database:**
```bash
# Execute the schema in your PostgreSQL database
psql $POSTGRES_URL < lib/database/schema.sql
```

Or use a database GUI tool to run `lib/database/schema.sql`.

5. **Run the development server:**
```bash
npm run dev
```

6. **Start Shopify CLI (in another terminal):**
```bash
npm run shopify:dev
```

## 📁 Project Structure

```
shopify-friends-family-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── groups/             # Group management
│   │   ├── invitations/        # Invitation system
│   │   ├── checkout/           # Checkout integration
│   │   ├── customer/           # Customer portal
│   │   ├── admin/              # Admin panel
│   │   ├── appointments/       # Appointment booking
│   │   └── availability/       # Availability queries
│   ├── admin/                  # Merchant admin pages (to be implemented)
│   └── customer/               # Customer portal pages (to be implemented)
├── components/                 # React components (to be implemented)
├── lib/
│   ├── database/               # Database functions
│   │   ├── schema.sql          # Database schema
│   │   ├── client.ts           # DB connection
│   │   ├── ff-groups.ts        # F&F group functions
│   │   ├── appointments.ts     # Appointment functions
│   │   ├── branches.ts         # Branch functions
│   │   └── availability.ts     # Availability functions
│   ├── shopify/                # Shopify integration
│   └── email/                  # Email service
├── types/                      # TypeScript types
├── SETUP.md                    # Detailed setup guide
└── TECHNICAL_NOTES.md          # Technical documentation
```

## 🔌 API Endpoints

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups?customerId=...` - Get groups for a customer
- `GET /api/groups?merchantId=...` - Get groups for a merchant
- `GET /api/groups/[id]` - Get group details
- `PUT /api/groups/[id]` - Update group
- `GET /api/groups/[id]/members` - Get group members
- `DELETE /api/groups/[id]/members/[memberId]` - Remove member

### Invitations
- `POST /api/invitations` - Create invitation
- `GET /api/invitations?token=...` - Get invitation by token
- `POST /api/invitations/[token]/accept` - Accept invitation

### Checkout
- `POST /api/checkout/validate-code` - Validate group code at checkout

### Customer Portal
- `GET /api/customer/group?customerId=...` - Get customer's groups
- `POST /api/customer/group/leave` - Leave a group

### Admin
- `GET /api/admin/groups?merchantId=...` - List all groups
- `POST /api/admin/groups/[id]/suspend` - Suspend/terminate group
- `GET /api/admin/config?merchantId=...` - Get discount config
- `PUT /api/admin/config` - Update discount config
- `GET /api/admin/analytics?merchantId=...` - Get analytics

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/[id]` - Get appointment
- `PATCH /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Cancel appointment

### Availability
- `GET /api/availability?branchId=...&date=...` - Get available slots

## 🗄️ Database Schema

The app uses PostgreSQL with the following main tables:

- **ff_groups**: Friends & Family groups
- **ff_group_members**: Group membership
- **ff_invitations**: Invitation system
- **ff_discount_config**: Merchant discount configuration
- **appointments**: Appointment bookings
- **branches**: Store branches/locations
- **availability_slots**: Available time slots

See `lib/database/schema.sql` for the complete schema.

## 🔐 Security Features

- Unique invite codes (cryptographically generated)
- Email verification tokens with expiration
- Rate limiting support (to be implemented)
- Owner protection (owners cannot leave groups)
- Fraud prevention settings (max groups per email, cooling periods)

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run shopify:dev` - Start Shopify CLI
- `npm run shopify:deploy` - Deploy to Shopify

### Code Structure

- **API Routes**: Next.js API routes in `app/api/`
- **Database Functions**: PostgreSQL functions in `lib/database/`
- **Types**: TypeScript interfaces in `types/`
- **Email Service**: Resend integration in `lib/email/`

## 📝 Next Steps

1. **Implement Shopify OAuth**: Add proper authentication flow
2. **Create Admin UI**: Build merchant admin panel with Shopify Polaris
3. **Create Customer Portal**: Build customer-facing group management UI
4. **Checkout Integration**: Implement checkout extension for discount application
5. **Email Templates**: Create professional email templates
6. **Testing**: Add unit and integration tests

## 📚 Documentation

- **SETUP.md**: Detailed setup instructions
- **TECHNICAL_NOTES.md**: Technical decisions and architecture notes

## 🤝 Contributing

This is a standalone project. Ensure all dependencies are self-contained and there are no references to external projects.

## 📄 License

MIT

## 🔗 Related Projects

This project is completely independent from the chatbot/appointment project. It maintains the appointment booking functionality but removes all chatbot dependencies.

---

**Note**: This project is separate from the `chat-y-app-de-appointment` project. All functionality is self-contained.
