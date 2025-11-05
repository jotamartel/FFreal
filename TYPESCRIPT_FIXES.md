# TypeScript Errors - Fix Guide

## 🔍 Errors Found

The type check found ~60 TypeScript errors related to Polaris component props. These are mostly API differences between Polaris versions.

## 🛠️ Common Fixes Needed

### 1. Badge Component
**Error**: `Property 'status' does not exist`

**Fix**: Change `status` to `tone`
```tsx
// ❌ Wrong
<Badge status="success">Active</Badge>

// ✅ Correct
<Badge tone="success">Active</Badge>
```

### 2. Banner Component
**Error**: `Property 'status' does not exist`

**Fix**: Change `status` to `tone`
```tsx
// ❌ Wrong
<Banner status="success">Message</Banner>

// ✅ Correct
<Banner tone="success">Message</Banner>
```

### 3. Text Component
**Error**: `Property 'as' is missing`

**Fix**: Add `as` prop
```tsx
// ❌ Wrong
<Text>Content</Text>

// ✅ Correct
<Text as="p">Content</Text>
```

### 4. Button Component
**Error**: `Property 'primary' does not exist`

**Fix**: Use `variant` prop
```tsx
// ❌ Wrong
<Button primary>Click</Button>

// ✅ Correct
<Button variant="primary">Click</Button>
```

### 5. Card Component
**Error**: `Property 'sectioned' does not exist`

**Fix**: Remove `sectioned`, use `Section` or remove prop
```tsx
// ❌ Wrong
<Card sectioned>Content</Card>

// ✅ Correct
<Card>
  <Card.Section>Content</Card.Section>
</Card>
```

### 6. TextField Component
**Error**: `Property 'autoComplete' is missing`

**Fix**: Add `autoComplete` prop (can be empty string)
```tsx
// ❌ Wrong
<TextField label="Name" value={name} onChange={setName} />

// ✅ Correct
<TextField label="Name" value={name} onChange={setName} autoComplete="name" />
```

### 7. Select Component
**Error**: `Property 'required' does not exist`

**Fix**: Remove `required` prop (validation should be done in form)
```tsx
// ❌ Wrong
<Select label="Branch" required />

// ✅ Correct
<Select label="Branch" />
```

### 8. EmptyState Component
**Error**: `Property 'image' is missing`

**Fix**: Add `image` prop or remove it
```tsx
// ❌ Wrong
<EmptyState heading="No data" />

// ✅ Correct
<EmptyState heading="No data" image="https://cdn.shopify.com/..." />
```

## 📝 Quick Fix Script

Run this to see all files that need fixes:
```bash
npm run type-check 2>&1 | grep "error TS" | wc -l
```

## 🎯 Priority Fixes

1. **High Priority**: Fix Badge, Banner, Button (used everywhere)
2. **Medium Priority**: Fix Text, Card, TextField
3. **Low Priority**: Fix Select, EmptyState

## ✅ After Fixes

Run again:
```bash
npm run type-check
```

Should return 0 errors.

