# ProID - Ngee Ann Polytechnic Hall of Fame

A full-stack web application showcasing Ngee Ann Polytechnic's Hall of Fame, featuring distinguished alumni, outstanding staff, and exemplary students. The platform includes an interactive timeline, community canvas for engagement, and a comprehensive admin panel for managing profiles and achievements.

## 🌟 Features

### Hall of Fame

- **Multi-Category Display**: Showcase distinguished alumni, outstanding staff, and exemplary students
- **School-Based Organization**: Filter and view profiles across 8 different schools
- **Achievement Tracking**: Detailed records of academic excellence, competitions, scholarships, and awards
- **Rich Profiles**: Profile images, LinkedIn integration, and comprehensive biographies

### Interactive Timeline

- **Year-Based Navigation**: Browse achievements and milestones by academic year
- **Detailed Information Pages**: In-depth information for each timeline year
- **Visual Timeline Interface**: Engaging chronological display of accomplishments

### Community Canvas

- **Real-Time Collaboration**: WebSocket-powered community engagement
- **Interactive Canvas**: Community message board for students and alumni

### Admin Panel

- **Profile Management**: Add and manage person profiles
- **Achievement Recording**: Track multiple achievements per person
- **Media Gallery**: Upload and manage photos, videos, and documents
- **Audit Logging**: Complete tracking of all changes

## 🛠️ Technology Stack

### Frontend

- **React 19.2** - Modern UI library with latest features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Socket.io Client** - Real-time WebSocket connection
- **React QR Code** - QR code generation

### Backend

- **Node.js with Express 5** - Web server framework
- **Oracle Database 23ai** - Enterprise-grade database
- **Socket.io** - WebSocket server for real-time features
- **Oracle Cloud Infrastructure SDK** - Cloud storage integration
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Oracle Database 23ai** instance
- Oracle Cloud Infrastructure account (for object storage)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProIDProject
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Environment Configuration

#### Frontend Environment (.env)

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
```

#### Backend Environment (server/.env)

Create a `.env` file in the `server` directory with your Oracle DB and OCI credentials:

```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECTION_STRING=your_connection_string
OCI_NAMESPACE=your_oci_namespace
OCI_BUCKET=your_bucket_name
OCI_REGION=your_region
```

### 5. Database Setup

Run the database schema and seed data:

```bash
# Connect to your Oracle DB and run:
sqlplus user/password@connection_string @np_database_schema.sql
```

This will create:

- 8 Schools reference data
- 3 Categories (Alumni, Staff, Students)
- Achievement types for each category
- Person and achievement tracking tables
- CCA activities and awards tables
- Media gallery and audit logging
- Sample seed data for demonstration

## 🏃 Running the Application

### Development Mode

#### Terminal 1 - Frontend Dev Server

```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

#### Terminal 2 - Backend Server

```bash
cd server
npm run dev
```

The backend will run at `http://localhost:3000`

### Production Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview

# Run backend in production
cd server
npm start
```

## 📁 Project Structure

```
ProIDProject/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── admin/               # Admin panel components
│   │   │   └── NewPerson.tsx
│   │   ├── canvas/              # Community canvas
│   │   │   └── CommunityCanvas.tsx
│   │   ├── common/              # Shared components
│   │   │   └── TopNav.tsx
│   │   ├── hof/                 # Hall of Fame components
│   │   │   └── HallOfFame.tsx
│   │   └── timeline/            # Timeline components
│   │       ├── NPTimeline.tsx
│   │       └── info/
│   │           └── TimelineInfoPage.tsx
│   ├── App.tsx                  # Main app with routing
│   ├── App.css
│   ├── index.css                # Global styles
│   └── main.tsx                 # App entry point
│
├── server/                       # Backend server
│   ├── controllers/             # API controllers
│   ├── routes/                  # Express routes
│   ├── models/                  # Database models
│   ├── middleware/              # Custom middleware
│   ├── services/                # Business logic
│   ├── server.js                # Server entry point
│   └── config                   # Configuration
│
├── public/                       # Static assets
├── np_database_schema.sql       # Database schema
├── mockdata.sql                 # Additional seed data
├── np_timeline_sql.sql          # Timeline data
├── package.json
└── vite.config.ts
```

## 🗄️ Database Schema

The application uses a person-centric modular design:

### Core Tables

- **persons** - Core person information (one record per person)
- **achievement_records** - Multiple achievements per person
- **schools** - 8 NP schools reference data
- **categories** - Alumni, Staff, Students
- **achievement_types** - Various achievement categories

### Additional Tables

- **cca_activities** - Co-curricular activities
- **cca_awards** - Awards linked to CCA activities
- **media_gallery** - Photos, videos, documents
- **audit_log** - Change tracking

### Schools Included

1. School of Business & Accountancy
2. School of Design & Environment
3. School of Engineering
4. School of Film & Media Studies
5. School of Health Sciences
6. School of Humanities & Interdisciplinary Studies
7. School of Infocomm Technology
8. School of Life Sciences & Chemical Technology

## 🔌 API Routes

The backend provides REST and WebSocket APIs:

### REST Endpoints

- `GET /api/persons` - List all persons
- `POST /api/persons` - Create new person
- `GET /api/achievements/:personId` - Get person's achievements
- `GET /api/timeline` - Get timeline data
- `GET /api/schools` - List all schools

### WebSocket Events

- Real-time updates for Community Canvas
- Live notifications for new achievements

## 🎨 Key Components

### HallOfFame

Main showcase featuring filterable grid of profiles with school and category filters.

### NPTimeline

Interactive timeline visualization with year-based navigation and detailed info pages.

### CommunityCanvas

Real-time collaborative canvas using Socket.io for community engagement.

### NewPerson (Admin)

Admin interface for adding new profiles with achievement tracking, media upload, and CCA management.

## 🧪 Linting

```bash
# Run ESLint
npm run lint
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed for Ngee Ann Polytechnic.

## 🙏 Acknowledgments

- Ngee Ann Polytechnic for project inspiration
- All featured alumni, staff, and students
- Oracle Database 23ai for robust data management
- React and Vite teams for excellent developer experience

---

**Built with ❤️ for Ngee Ann Polytechnic Community**
