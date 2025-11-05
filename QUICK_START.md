# Quick Start - Testing Guide

## 🚀 Setup for Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Setup Database
```bash
# Execute schema in your PostgreSQL database
psql $POSTGRES_URL < lib/database/schema.sql
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Verify Structure
```bash
./scripts/check-structure.sh
```

### 6. Test API (optional)
```bash
# Start server first, then:
./scripts/test-api.sh
```

## 📋 Quick Test Checklist

### ✅ Basic Checks
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (`.env`)
- [ ] Database schema executed
- [ ] Development server runs (`npm run dev`)
- [ ] No TypeScript errors (`npm run type-check`)

### ✅ Admin Panel
- [ ] Visit http://localhost:3000/admin
- [ ] Dashboard loads
- [ ] Can navigate to all sections
- [ ] No console errors

### ✅ Customer Portal
- [ ] Visit http://localhost:3000/customer
- [ ] Dashboard loads
- [ ] Can create group
- [ ] Can view appointments

### ✅ API Endpoints
- [ ] Test create group endpoint
- [ ] Test get groups endpoint
- [ ] Test create invitation endpoint
- [ ] Test appointments endpoint

## 🐛 Common Issues

### Dependencies not installed
```bash
npm install
```

### Database connection error
- Check `POSTGRES_URL` in `.env`
- Verify database is accessible
- Check SSL settings

### TypeScript errors
```bash
npm run type-check
# Fix any errors reported
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

## 📝 Next Steps

1. ✅ Complete setup steps above
2. ✅ Run structure check
3. ✅ Test admin panel
4. ✅ Test customer portal
5. ✅ Test API endpoints
6. ✅ Fix any issues found
7. ✅ Ready for development!

