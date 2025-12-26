# Navigation Map (APK-Faithful)

## User App
- Root Stack:
  - Login
  - MainDrawer
- MainDrawer items (example; must match spec/screens):
  - Home
  - Sales Entry
  - Sales > Edit/Delete
  - Sales > Upload Queue
  - Reports
  - Results
  - Profile/Logout (if present)

## Admin App
- Root Stack:
  - Login
  - AdminDrawer
- AdminDrawer items:
  - Dashboard
  - Masters (sections, schemes, groups/books, users, blocks, credit)
  - Result Publish
  - Reports/Exports
  - Logout

Rules
- Back press on Home exits with toast (if APK does)
- Drawer labels and icons must match spec/screens
