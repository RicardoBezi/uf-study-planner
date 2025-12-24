# UF Study Planner

A smart, AI-powered study planner that helps students create personalized weekly schedules based on their tasks, deadlines, and available study time. Built with a modern full-stack architecture featuring a Python FastAPI backend and React Native mobile frontend.

## Overview

UF Study Planner uses an intelligent greedy scheduling algorithm to prioritize tasks based on urgency, difficulty, and estimated effort. The system automatically generates optimal weekly study plans and provides AI-powered explanations powered by Google's Gemini 2.5 Flash model.

## Features

- **Intelligent Task Scheduling**: Greedy algorithm that prioritizes tasks based on:
  - Urgency (days until due date)
  - Difficulty level (1-5 scale)
  - Estimated time commitment
  - Overdue status bonus
- **Personalized Availability**: Configure different study times for weekdays and weekends
- **Flexible Time Chunks**: Customizable study session durations (10-120 minutes)
- **AI Explanations**: Get detailed explanations of your study plan from Gemini AI
- **Offline-First Mobile App**: Work seamlessly offline with local SQLite storage and sync
- **Cross-Platform**: React Native app runs on iOS, Android, and Web
- **Task Types**: Support for assignments, exams, readings, projects, and more
- **Real-time Updates**: Track task progress and remaining time

## Tech Stack

### Backend

**Framework & Server:**
- [FastAPI](https://fastapi.tiangolo.com/) (0.126.0) - Modern, async Python web framework
- [Uvicorn](https://www.uvicorn.org/) (0.38.0) - ASGI server with standard extras
- [Starlette](https://www.starlette.io/) (0.50.0) - ASGI framework foundation

**Database & ORM:**
- [SQLModel](https://sqlmodel.tiangolo.com/) (0.0.27) - ORM combining SQLAlchemy + Pydantic
- [SQLAlchemy](https://www.sqlalchemy.org/) (2.0.45) - SQL toolkit and ORM
- SQLite - Lightweight, file-based database

**Data Validation:**
- [Pydantic](https://docs.pydantic.dev/) (2.12.5) - Data validation using Python type hints
- Pydantic Core (2.41.5) - High-performance validation engine

**AI Integration:**
- [Google Generative AI](https://ai.google.dev/) - Gemini 2.5 Flash model for plan explanations

**Utilities:**
- [python-dotenv](https://pypi.org/project/python-dotenv/) - Environment variable management
- Click (8.3.1) - CLI framework
- h11 (0.16.0) - HTTP/1.1 protocol implementation
- Greenlet (3.3.0) - Lightweight concurrency

### Frontend

**Core Framework:**
- [React Native](https://reactnative.dev/) (0.81.5) - Cross-platform mobile framework
- [React](https://react.dev/) (19.1.0) - Latest React version
- [Expo](https://expo.dev/) (~54.0.30) - React Native development platform
- [Expo Router](https://docs.expo.dev/router/introduction/) (~6.0.21) - File-based routing system
- [TypeScript](https://www.typescriptlang.org/) (~5.9.2) - Type-safe development

**Styling & UI:**
- [Tailwind CSS](https://tailwindcss.com/) (^3.4.19) - Utility-first CSS framework
- [NativeWind](https://www.nativewind.dev/) (^4.2.1) - Tailwind CSS for React Native
- [PostCSS](https://postcss.org/) (^8.5.6) - CSS transformation tool

**Navigation:**
- [@react-navigation/native](https://reactnavigation.org/) (^7.1.8) - Navigation library
- @react-navigation/bottom-tabs (^7.4.0) - Tab-based navigation
- @react-navigation/elements (^2.6.3) - Navigation UI elements

**Animation & Gestures:**
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (~4.1.1) - High-performance animations
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) (~2.28.0) - Native gesture handling
- React Native Worklets (0.5.1) - JavaScript worklet execution

**Local Storage:**
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (~16.0.10) - Local SQLite database
- Offline-first architecture with sync flags

**UI Components:**
- [@expo/vector-icons](https://docs.expo.dev/guides/icons/) - Icon library
- React Native Safe Area Context - Safe area handling
- React Native Screens - Native screen optimization

**Development Tools:**
- [ESLint](https://eslint.org/) (^9.25.0) - Code linting
- Autoprefixer - CSS vendor prefixes
- Expo development tools

## Project Structure

```
uf-study-planner/
├── app/                          # Backend (FastAPI)
│   ├── main.py                   # API routes and application entry
│   ├── db.py                     # Database configuration
│   ├── models.py                 # SQLModel data models
│   ├── planner.py                # Greedy scheduling algorithm
│   ├── ai_gemini.py              # Gemini AI integration
│   └── .env                      # Environment variables (GEMINI_API_KEY)
│
├── mobile/                       # Frontend (React Native + Expo)
│   ├── app/                      # Expo Router file-based routing
│   │   ├── (tabs)/               # Tab-based navigation
│   │   │   ├── _layout.tsx       # Tab layout configuration
│   │   │   ├── index.tsx         # Home screen
│   │   │   └── explore.tsx       # Explore screen
│   │   └── _layout.tsx           # Root layout with theme provider
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # API client with CRUD methods
│   │   ├── components/
│   │   │   └── Home.tsx          # Main UI component
│   │   └── db/
│   │       └── index.ts          # Local SQLite operations
│   │
│   ├── app.json                  # Expo app configuration
│   ├── babel.config.js           # Babel configuration
│   ├── tailwind.config.js        # Tailwind theme customization
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json              # Frontend dependencies
│
├── requirements.txt              # Backend Python dependencies
└── studyplanner.db              # SQLite database file
```

## Installation

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/uf-study-planner.git
cd uf-study-planner
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cd app
# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

5. Run the backend server:
```bash
cd app
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### Frontend Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint (optional):
```bash
# Create .env file if you need to change the default API URL
echo "EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000" > .env
```

4. Start the Expo development server:
```bash
npx expo start
```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your phone

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Tasks
- `POST /tasks` - Create a new task
- `GET /tasks?user_id={user_id}` - List user's tasks
- `PATCH /tasks/{task_id}` - Update task details
- `DELETE /tasks/{task_id}` - Delete a task

### Availability
- `POST /availability` - Set/update study availability preferences
- `GET /availability?user_id={user_id}` - Get user's availability settings

### Plan Generation
- `POST /plan/generate` - Generate weekly study plan
  - Request body: `{ "user_id": "string" }`
  - Returns: Array of scheduled tasks for the week

### AI
- `POST /ai/explain-plan` - Get AI explanation of generated plan
  - Request body: `{ "plan_data": [...], "tasks": [...] }`
  - Returns: AI-generated explanation using Gemini

## Scheduling Algorithm

The planner uses a greedy algorithm with the following priority scoring:

```python
score = 100 * urgency * difficulty_weight + overdue_bonus - effort_penalty

where:
  urgency = 1.0 / (days_until_due + 1)
  difficulty_weight = difficulty / 5.0
  overdue_bonus = 50 if overdue else 0
  effort_penalty = remaining_minutes / 60
```

**How it works:**
1. Recalculates task priorities daily based on due dates
2. Sorts tasks by priority score (highest first)
3. Splits tasks into manageable chunks (configurable duration)
4. Allocates chunks to available study time slots
5. Respects weekday vs. weekend availability differences
6. Tracks remaining time for partially completed tasks

## Data Models

### Task
```typescript
{
  id: number
  user_id: string
  title: string
  course: string
  due_at: datetime
  est_minutes: number          // Original estimate
  remaining_minutes: number    // Time left
  difficulty: 1-5              // Difficulty level
  task_type: string            // assignment/exam/reading/project/other
  status: string               // active/done
}
```

### Availability
```typescript
{
  user_id: string
  weekday_minutes: number      // Default: 120
  weekend_minutes: number      // Default: 240
  chunk_minutes: number        // Default: 50
}
```

## Configuration

### Backend Environment Variables

Create `app/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend Environment Variables

Create `mobile/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Development

### Backend Development

The backend uses FastAPI's auto-reload feature:
```bash
cd app
uvicorn main:app --reload
```

Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

### Frontend Development

Run the Expo development server with auto-reload:
```bash
cd mobile
npx expo start
```

**Key development features:**
- Hot module replacement (HMR)
- TypeScript type checking
- ESLint code quality checks
- NativeWind for Tailwind styling
- React DevTools support

## Database

The application uses SQLite for both backend and frontend:

- **Backend**: `studyplanner.db` - Persistent storage for all users
- **Frontend**: Local Expo SQLite - Offline-first storage with sync flags

**Sync Architecture:**
- Local database tracks pending changes (create/update/delete)
- Optimistic UI updates
- Background sync when online
- Conflict resolution with server as source of truth

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built for University of Florida students
- Powered by Google Gemini AI
- Uses the Expo ecosystem for cross-platform development
- Inspired by the need for intelligent study planning

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

## Roadmap

- [ ] User authentication and multi-user support
- [ ] Cloud database integration
- [ ] Push notifications for upcoming deadlines
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Study session tracking and analytics
- [ ] Pomodoro timer integration
- [ ] Collaborative study groups
- [ ] Dark mode support
- [ ] Export study plans to PDF
- [ ] Integration with learning management systems (Canvas, Blackboard)
