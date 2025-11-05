# Technical Notes

## Database Schema

### Friends & Family Tables

1. **ff_groups**: Main group table
   - Stores group information, owner, invite code, status
   - Tracks current/max members

2. **ff_group_members**: Group membership
   - Links customers to groups
   - Tracks status (pending/active/removed)
   - Email verification support

3. **ff_invitations**: Invitation system
   - Token-based invitations
   - Expiration tracking
   - Status tracking

4. **ff_discount_config**: Merchant configuration
   - Discount tiers (JSONB)
   - Rules (product inclusions/exclusions, etc.)
   - Fraud prevention settings

5. **ff_code_usage**: Code usage tracking (optional)
   - For one-time use codes if needed

### Appointments Tables

1. **appointments**: Appointment bookings
   - No dependency on chatbot/conversations
   - Links to branches and Shopify customers
   - Status tracking

2. **branches**: Store branches/locations
   - Merchant-specific branches
   - Active/inactive status

3. **availability_slots**: Available time slots
   - Day-of-week based
   - Branch-specific
   - Max appointments per slot

## Key Design Decisions

### 1. Removed Chatbot Dependency
- Appointments no longer require conversations
- Direct customer-to-appointment relationship
- Optional Shopify customer ID linking

### 2. Merchant Isolation
- All tables include `merchant_id` for multi-tenant support
- Queries filtered by merchant where applicable

### 3. Email Verification
- Members can have pending/active status
- Verification tokens with expiration
- Email verification required for active status

### 4. Discount Calculation
- Tier-based system stored as JSONB
- Calculated dynamically based on member count
- Supports percentage or fixed amount

### 5. Invitation System
- Token-based (not just code)
- Expiration support
- Status tracking (pending/accepted/declined/expired)

## Security Considerations

1. **Invite Codes**: Unique, randomly generated
2. **Verification Tokens**: Cryptographically secure
3. **Rate Limiting**: Should be implemented at API level
4. **Email Verification**: Required for active membership
5. **Owner Protection**: Owners cannot leave groups (must transfer)

## Integration Points

### Shopify Customer Accounts API
- Link customers to groups via `customer_id`
- Store group membership in customer metafields
- Sync customer data

### Checkout Extensions
- Validate group codes at checkout
- Apply discounts automatically
- Show discount breakdown

### Discount Codes API
- Generate dynamic discount codes per group
- Or apply discount programmatically at checkout

## Future Enhancements

1. **Webhooks**: Listen for customer/order events
2. **Metafields**: Store group data on customer objects
3. **Admin UI**: Full Polaris-based admin interface
4. **Customer Portal**: Embedded app for group management
5. **Analytics**: Revenue tracking, conversion metrics
6. **Fraud Prevention**: Rate limiting, IP tracking, cooling periods
7. **Multi-language**: i18n support
8. **Push Notifications**: For mobile apps

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried fields indexed
2. **Triggers**: Automatic member count updates
3. **JSONB**: For flexible tier/rule storage
4. **Connection Pooling**: Using pg Pool for efficiency

## Testing Strategy

1. **Unit Tests**: Database functions
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Critical user flows
4. **Load Testing**: Concurrent group operations
5. **Security Testing**: Token validation, rate limiting

