## 📅 NextDue – Bill & Reminder Management App

A React-based bill and reminder management application designed to help users track upcoming payments, recurring bills, and important reminders.

### 🚀 Live Demo

https://nextdues.firebaseapp.com/

### 🛠️ Tech Stack

- Frontend: React
- Backend/Cloud: Firebase
- Database: Cloud Firestore
- Authentication: Firebase
- Hosting: Firebase
- Build Tools: Webpack, Babel

### ✨ Features

- Add and manage bill reminders
- Track upcoming due dates
- Recurring bill reminders
- Calendar-based due-date management
- Notification/reminder functionality
- Persistent cloud data storage
- User-specific data
- Firebase integration
- Responsive React interface

### 🏗️ Architecture

```text
              User
                │
                ▼
       ┌─────────────────┐
       │  React Frontend │
       │   JavaScript    │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Firebase        │
       │ Authentication  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Cloud Firestore │
       │                 │
       │ Bills           │
       │ Reminders       │
       │ Due Dates       │
       │ User Data       │
       └─────────────────┘
                │
                ▼
       Firebase Hosting
