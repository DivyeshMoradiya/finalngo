Create a single comprehensive data flow diagram for HopeNest NGO platform showing all major processes in one view:
**External Entities:** Users, Admins, Email System, File Storage
**Core Processes:**
1. User Authentication (login/signup/reset)
2. Campaign Management (CRUD operations)
3. Donation Processing (payment + email receipt)
4. Crowdfunding Workflow (apply → upload docs → email verify → admin approve)
5. Volunteer Registration (signup + campaign assignment)
6. Email Notifications (automated system)
7. File Management (document uploads)
**Data Stores:** Users DB, Campaigns DB, Donations DB, Volunteers DB, File Storage
**Key Data Flows:**
- Users ↔ Authentication ↔ Users DB
- Users → Donations → Campaigns DB → Email System
- Users → Crowdfunding → File Storage → Admin Approval → Campaigns DB
- Users → Volunteer Registration → Volunteers DB
- All processes → Email System for notifications

**Visual Style:** Standard DFD notation with circles for processes, rectangles for entities, open rectangles for data stores. Use different colors for user actions (blue), admin actions (red), and system processes (green).