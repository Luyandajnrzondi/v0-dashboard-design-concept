export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  created_at: string
  updated_at: string
}

export type CategoryType =
  | "general"
  | "media" // Legacy - Movies & TV Shows combined
  | "movies" // Movies only
  | "tvshows" // TV Shows only
  | "music" // Music (Albums, Artists, Tracks)
  | "reading" // Books & Podcasts
  | "goals" // Year Goals / Life Goals
  | "fitness" // Gym & Fitness
  | "games" // Games
  | "travel" // Travel & Places
  | "ideas" // Ideas, Inspiration & Notes
  | "career" // Career / Learning
  | "finance" // Finance
  | "todos" // Todo list

export interface Item {
  id: string
  category_id: string
  name: string
  type: string
  image_url: string
  metadata: ItemMetadata
  rank?: number
  created_at: string
  updated_at: string
}

// Base metadata that all items share
interface BaseMetadata {
  mood?: string
  energy_level?: number
  notes?: string
}

// Media (Movies & TV Shows)
export interface MediaMetadata extends BaseMetadata {
  year?: number
  genre?: string
  status?: "watched" | "watching" | "to_watch"
  rating?: number
  mood_type?: "chill" | "intense" | "inspiring"
  runtime?: string
  themes?: string[]
  director?: string
  platform?: string
  rewatch_value?: "low" | "medium" | "high"
}

// Movies-specific metadata
export interface MoviesMetadata extends BaseMetadata {
  year?: number
  genre?: string
  status?: "watched" | "watching" | "to_watch"
  rating?: number
  mood_type?: "chill" | "intense" | "inspiring"
  runtime?: string
  themes?: string[]
  director?: string
  platform?: string
  rewatch_value?: "low" | "medium" | "high"
}

// TV Shows-specific metadata
export interface TVShowsMetadata extends BaseMetadata {
  year?: number
  genre?: string
  status?: "watched" | "watching" | "to_watch"
  rating?: number
  mood_type?: "chill" | "intense" | "inspiring"
  seasons?: number
  episodes?: number
  themes?: string[]
  creator?: string
  platform?: string
  rewatch_value?: "low" | "medium" | "high"
}

// Music
export interface MusicMetadata extends BaseMetadata {
  artist?: string
  year?: number
  genre?: string
  rating?: number
  replay_value?: "low" | "medium" | "high"
  era?: string
  format?: "streaming" | "vinyl" | "cd"
  standout_tracks?: string[]
  plays_per_week?: number
}

// Books & Podcasts
export interface ReadingMetadata extends BaseMetadata {
  author?: string
  status?: "reading" | "finished" | "planned"
  rating?: number
  key_ideas?: string[]
  quotes?: string[]
  time_spent?: string
  difficulty?: "easy" | "medium" | "hard"
  purpose?: "learning" | "leisure" | "mindset"
  format?: "audio" | "physical" | "pdf"
  revisit_potential?: "low" | "medium" | "high"
}

// Goals
export interface GoalsMetadata extends BaseMetadata {
  category?: "health" | "career" | "personal" | "financial"
  deadline?: string
  progress?: number
  why_it_matters?: string
  milestones?: string[]
  obstacles?: string[]
  linked_habits?: string[]
  success_definition?: string
  motivation_level?: number
}

// Games
export interface GamesMetadata extends BaseMetadata {
  platform?: string
  status?: "playing" | "completed" | "backlog" | "dropped"
  genre?: string
  hours_played?: number
  rating?: number
  completion_percentage?: number
  difficulty?: "easy" | "medium" | "hard" | "extreme"
  multiplayer?: boolean
  favorite_moments?: string
}

// Travel
export interface TravelMetadata extends BaseMetadata {
  status?: "visited" | "planned"
  dates?: string
  budget?: number
  accommodation?: string
  highlights?: string[]
  lessons?: string
  rating?: number
  purpose?: "relax" | "culture" | "adventure" | "business"
}

// Ideas
export interface IdeasMetadata extends BaseMetadata {
  source?: string
  problem_solved?: string
  potential_impact?: "low" | "medium" | "high"
  required_skills?: string[]
  time_estimate?: string
  excitement_level?: number
  linked_projects?: string[]
  next_action?: string
}

// Career & Learning
export interface CareerMetadata extends BaseMetadata {
  skills_learned?: string[]
  courses?: string[]
  tools_used?: string[]
  certifications?: string[]
  feedback?: string
  portfolio_links?: string[]
  career_direction?: string
}

// Finance types
export interface Transaction {
  id: string
  category_id: string
  type: "income" | "expense" | "transfer"
  amount: number
  description: string
  transaction_date: string
  category_name?: string
  payment_method?: string
  is_recurring?: boolean
  recurring_frequency?: string
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  category_id: string
  budget_category: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface SavingsGoal {
  id: string
  category_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date?: string
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  title: string
  description?: string
  is_completed: boolean
  priority: "low" | "medium" | "high"
  due_date?: string
  created_at: string
  updated_at: string
}

export type ItemMetadata =
  | MediaMetadata
  | MoviesMetadata
  | TVShowsMetadata
  | MusicMetadata
  | ReadingMetadata
  | GoalsMetadata
  | GamesMetadata
  | TravelMetadata
  | IdeasMetadata
  | CareerMetadata
  | BaseMetadata

// Workout specific types
export interface WorkoutLog {
  id: string
  category_id: string
  workout_date: string
  workout_type: string
  exercises: Exercise[]
  duration_minutes?: number
  calories_burned?: number
  notes?: string
  rpe?: number
  sleep_quality?: number
  created_at: string
  updated_at: string
}

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  rest_seconds?: number
}

// Category schema definitions for form generation
export const CATEGORY_SCHEMAS: Record<CategoryType, { fields: SchemaField[] }> = {
  general: { fields: [] },
  media: {
    fields: [
      { key: "year", label: "Year", type: "number" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["watched", "watching", "to_watch"] },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "mood_type", label: "Mood", type: "select", options: ["chill", "intense", "inspiring"] },
      { key: "runtime", label: "Runtime", type: "text" },
      { key: "director", label: "Director", type: "text" },
      { key: "platform", label: "Platform", type: "text" },
      { key: "rewatch_value", label: "Rewatch Value", type: "select", options: ["low", "medium", "high"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  movies: {
    fields: [
      { key: "year", label: "Year", type: "number" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["watched", "watching", "to_watch"] },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "mood_type", label: "Mood", type: "select", options: ["chill", "intense", "inspiring"] },
      { key: "runtime", label: "Runtime", type: "text" },
      { key: "director", label: "Director", type: "text" },
      { key: "platform", label: "Platform", type: "text" },
      { key: "rewatch_value", label: "Rewatch Value", type: "select", options: ["low", "medium", "high"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  tvshows: {
    fields: [
      { key: "year", label: "Year", type: "number" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["watched", "watching", "to_watch"] },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "mood_type", label: "Mood", type: "select", options: ["chill", "intense", "inspiring"] },
      { key: "seasons", label: "Seasons", type: "number" },
      { key: "episodes", label: "Episodes", type: "number" },
      { key: "creator", label: "Creator", type: "text" },
      { key: "platform", label: "Platform", type: "text" },
      { key: "rewatch_value", label: "Rewatch Value", type: "select", options: ["low", "medium", "high"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  music: {
    fields: [
      { key: "artist", label: "Artist", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "replay_value", label: "Replay Value", type: "select", options: ["low", "medium", "high"] },
      { key: "era", label: "Era / Life Phase", type: "text" },
      { key: "format", label: "Format", type: "select", options: ["streaming", "vinyl", "cd"] },
      { key: "notes", label: "Personal Meaning", type: "textarea" },
    ],
  },
  reading: {
    fields: [
      { key: "author", label: "Author / Host", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["reading", "finished", "planned"] },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "medium", "hard"] },
      { key: "purpose", label: "Purpose", type: "select", options: ["learning", "leisure", "mindset"] },
      { key: "format", label: "Format", type: "select", options: ["audio", "physical", "pdf"] },
      { key: "revisit_potential", label: "Revisit Potential", type: "select", options: ["low", "medium", "high"] },
      { key: "notes", label: "Key Ideas / Notes", type: "textarea" },
    ],
  },
  goals: {
    fields: [
      { key: "category", label: "Category", type: "select", options: ["health", "career", "personal", "financial"] },
      { key: "deadline", label: "Deadline", type: "date" },
      { key: "progress", label: "Progress %", type: "progress" },
      { key: "why_it_matters", label: "Why It Matters", type: "textarea" },
      { key: "success_definition", label: "Success Definition", type: "textarea" },
      { key: "motivation_level", label: "Motivation Level", type: "rating" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  fitness: {
    fields: [],
  },
  games: {
    fields: [
      { key: "platform", label: "Platform", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["playing", "completed", "backlog", "dropped"] },
      { key: "genre", label: "Genre", type: "text" },
      { key: "hours_played", label: "Hours Played", type: "number" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "completion_percentage", label: "Completion %", type: "progress" },
      { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "medium", "hard", "extreme"] },
      { key: "multiplayer", label: "Multiplayer", type: "checkbox" },
      { key: "notes", label: "Favorite Moments", type: "textarea" },
    ],
  },
  travel: {
    fields: [
      { key: "status", label: "Status", type: "select", options: ["visited", "planned"] },
      { key: "dates", label: "Dates", type: "text" },
      { key: "budget", label: "Budget", type: "number" },
      { key: "accommodation", label: "Accommodation", type: "text" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "purpose", label: "Purpose", type: "select", options: ["relax", "culture", "adventure", "business"] },
      { key: "lessons", label: "Lessons / Mistakes", type: "textarea" },
      { key: "notes", label: "Highlights", type: "textarea" },
    ],
  },
  ideas: {
    fields: [
      { key: "source", label: "Source of Idea", type: "text" },
      { key: "problem_solved", label: "Problem It Solves", type: "textarea" },
      { key: "potential_impact", label: "Potential Impact", type: "select", options: ["low", "medium", "high"] },
      { key: "time_estimate", label: "Time Estimate", type: "text" },
      { key: "excitement_level", label: "Excitement Level", type: "rating" },
      { key: "next_action", label: "Next Action", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  career: {
    fields: [
      { key: "skills_learned", label: "Skills Learned", type: "text" },
      { key: "courses", label: "Courses", type: "text" },
      { key: "tools_used", label: "Tools Used", type: "text" },
      { key: "certifications", label: "Certifications", type: "text" },
      { key: "feedback", label: "Feedback Received", type: "textarea" },
      { key: "career_direction", label: "Career Direction Notes", type: "textarea" },
    ],
  },
  finance: {
    fields: [],
  },
  todos: {
    fields: [],
  },
}

export interface SchemaField {
  key: string
  label: string
  type: "text" | "number" | "textarea" | "select" | "date" | "rating" | "progress" | "checkbox"
  options?: string[]
}
