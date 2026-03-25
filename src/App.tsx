import { useEffect, useMemo, useState, useRef } from 'react'
import './App.css'

type TabKey = 'setup' | 'plan' | 'today' | 'reflect' | 'progress'
type Goal =
  | 'build_muscle'
  | 'lose_fat'
  | 'stay_consistent'
  | 'general_fitness'
type Experience = 'beginner' | 'returning' | 'some_experience'
type Location = 'gym' | 'home' | 'both'

type CheckIn = {
  completionRate: number
  energy: number
  sleepQuality: number
  fatigue: number
  note: string
}

type UserProfile = {
  goal: Goal
  experience: Experience
  weeklyDays: number
  duration: number
  location: Location
  equipment: string[]
  activities: string[]
}

type WeekItem = {
  day: string
  title: string
  duration: number
  intensity: 'full' | 'light' | 'recovery' | 'rest'
  completed?: boolean
  exercises?: Exercise[]
  originalExercises?: Exercise[]
}

type Exercise = {
  name: string
  sets: number
  reps: string
  muscle: string
  equipment: string
  videoUrl?: string
  backupVideoUrl?: string
  searchQuery?: string
  alternatives: string[]
  tips?: string[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STORAGE_KEY = 'ai_fitness_coach_demo_v1'

const EXERCISE_LIBRARY: Record<string, Exercise> = {
  // --- CHEST ---
  'Machine Chest Press': {
    name: 'Machine Chest Press',
    sets: 3,
    reps: '8–12',
    muscle: 'Chest',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/sqNwDkUU_Ps',
    backupVideoUrl: 'https://www.youtube.com/watch?v=nw6mRAtxreM',
    alternatives: ['Dumbbell Bench Press', 'Push-ups'],
    tips: ['Keep your back flat against the pad', 'Avoid locking your elbows at the top', 'Control the movement on the way back'],
  },
  'Dumbbell Bench Press': {
    name: 'Dumbbell Bench Press',
    sets: 3,
    reps: '8–12',
    muscle: 'Chest',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/VmByAnVvstg',
    alternatives: ['Machine Chest Press', 'Incline Dumbbell Press'],
    tips: ['Plant your feet firmly on the ground', 'Keep your shoulder blades retracted', 'Press in a slight arc over your chest'],
  },
  'Incline Dumbbell Press': {
    name: 'Incline Dumbbell Press',
    sets: 3,
    reps: '10–12',
    muscle: 'Chest',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
    alternatives: ['Dumbbell Bench Press', 'Push-ups'],
    tips: ['Set bench to a 30-45 degree angle', 'Focus on the upper chest contraction', 'Lower weights to the top of your chest'],
  },
  'Push-ups': {
    name: 'Push-ups',
    sets: 3,
    reps: '10–15',
    muscle: 'Chest',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
    backupVideoUrl: 'https://www.youtube.com/watch?v=v9LABVJz8pg',
    alternatives: ['Machine Chest Press', 'Dumbbell Floor Press'],
    tips: ['Maintain a straight line from head to heels', 'Keep your core engaged', 'Elbows should be at a 45-degree angle'],
  },
  'Dumbbell Floor Press': {
    name: 'Dumbbell Floor Press',
    sets: 3,
    reps: '8–12',
    muscle: 'Chest',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/uUGDRwge4F8',
    alternatives: ['Push-ups', 'Machine Chest Press'],
    tips: ['Keep your elbows at 45 degrees', 'Press the weights until arms are straight', 'Lower until elbows touch the floor lightly'],
  },

  // --- SHOULDERS ---
  'Dumbbell Shoulder Press': {
    name: 'Dumbbell Shoulder Press',
    sets: 3,
    reps: '8–12',
    muscle: 'Shoulders',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
    backupVideoUrl: 'https://www.youtube.com/watch?v=HzIiNhHhhtA',
    alternatives: ['Arnold Press', 'Machine Shoulder Press'],
    tips: ['Keep your core tight', 'Don\'t let the dumbbells touch at the top', 'Keep your elbows slightly in front of your body'],
  },
  'Arnold Press': {
    name: 'Arnold Press',
    sets: 3,
    reps: '10–12',
    muscle: 'Shoulders',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/6VBAWssP_Ik',
    alternatives: ['Dumbbell Shoulder Press', 'Machine Shoulder Press'],
    tips: ['Rotate your palms as you press up', 'Maintain a slow and controlled tempo', 'Keep your back firmly against the bench'],
  },
  'Machine Shoulder Press': {
    name: 'Machine Shoulder Press',
    sets: 3,
    reps: '10–12',
    muscle: 'Shoulders',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/WvLp9bv90G0',
    alternatives: ['Dumbbell Shoulder Press', 'Arnold Press'],
    tips: ['Keep your back against the pad', 'Don\'t lock your elbows', 'Control the downward phase'],
  },
  'Dumbbell Lateral Raise': {
    name: 'Dumbbell Lateral Raise',
    sets: 3,
    reps: '12–15',
    muscle: 'Shoulders',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
    backupVideoUrl: 'https://www.youtube.com/watch?v=WJm9JqD_Zsc',
    alternatives: ['Cable Lateral Raise', 'Lean-away Raise'],
    tips: ['Lead with your elbows', 'Keep a slight bend in your arms', 'Only raise to shoulder height'],
  },
  'Cable Lateral Raise': {
    name: 'Cable Lateral Raise',
    sets: 3,
    reps: '12–15',
    muscle: 'Shoulders',
    equipment: 'Cable',
    videoUrl: 'https://www.youtube.com/embed/PPrzBWZDOhA',
    alternatives: ['Dumbbell Lateral Raise', 'Lean-away Raise'],
    tips: ['Keep your core stable', 'Maintain constant tension on the cable', 'Pull slightly away from your body'],
  },

  // --- BACK ---
  'Lat Pulldown': {
    name: 'Lat Pulldown',
    sets: 3,
    reps: '8–12',
    muscle: 'Back',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
    backupVideoUrl: 'https://www.youtube.com/watch?v=lueEJGjTuPQ',
    alternatives: ['Seated Row', 'Single-arm Dumbbell Row'],
    tips: ['Pull the bar to your upper chest', 'Avoid using momentum or leaning back excessively', 'Focus on driving with your elbows'],
  },
  'Seated Row': {
    name: 'Seated Row',
    sets: 3,
    reps: '10–12',
    muscle: 'Back',
    equipment: 'Cable',
    videoUrl: 'https://www.youtube.com/embed/GZbfZ033f74',
    backupVideoUrl: 'https://www.youtube.com/watch?v=UCXxvVItLoM',
    alternatives: ['Lat Pulldown', 'Single-arm Dumbbell Row'],
    tips: ['Keep your chest up and back straight', 'Pull your shoulder blades together', 'Avoid rocking your torso'],
  },
  'Single-arm Dumbbell Row': {
    name: 'Single-arm Dumbbell Row',
    sets: 3,
    reps: '10–12',
    muscle: 'Back',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/pYcpY20QaE8',
    backupVideoUrl: 'https://www.youtube.com/watch?v=dFzUjzfih7k',
    alternatives: ['Chest-supported Row', 'Lat Pulldown'],
    tips: ['Keep your back flat and parallel to the floor', 'Pull the dumbbell toward your hip', 'Don\'t let your shoulder drop at the bottom'],
  },
  'Chest-supported Row': {
    name: 'Chest-supported Row',
    sets: 3,
    reps: '10–12',
    muscle: 'Back',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/H75im9fAUMc',
    alternatives: ['Single-arm Dumbbell Row', 'Seated Row'],
    tips: ['Keep your chest firmly against the bench', 'Squeeze your shoulder blades at the top', 'Focus on the middle back muscles'],
  },
  'Face Pulls': {
    name: 'Face Pulls',
    sets: 3,
    reps: '12–15',
    muscle: 'Back',
    equipment: 'Cable',
    videoUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
    alternatives: ['Dumbbell Lateral Raise', 'Seated Row'],
    tips: ['Pull toward your forehead', 'Keep your elbows high', 'Rotate your hands back at the end of the movement'],
  },

  // --- ARMS ---
  'Bicep Curl': {
    name: 'Bicep Curl',
    sets: 3,
    reps: '10–12',
    muscle: 'Biceps',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
    backupVideoUrl: 'https://www.youtube.com/watch?v=in7P1Vsu6Gg',
    alternatives: ['Hammer Curl', 'Cable Curl'],
    tips: ['Keep your elbows pinned to your sides', 'Avoid swinging your body', 'Full range of motion: all the way down, all the way up'],
  },
  'Hammer Curl': {
    name: 'Hammer Curl',
    sets: 3,
    reps: '10–12',
    muscle: 'Biceps',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/7jqi2qWAUzQ',
    alternatives: ['Bicep Curl', 'Cable Curl'],
    tips: ['Keep palms facing each other', 'Squeeze at the top of the movement', 'Don\'t use momentum to swing the weights'],
  },
  'Cable Curl': {
    name: 'Cable Curl',
    sets: 3,
    reps: '12–15',
    muscle: 'Biceps',
    equipment: 'Cable',
    videoUrl: 'https://www.youtube.com/embed/AsAVbj7puKo',
    alternatives: ['Bicep Curl', 'Hammer Curl'],
    tips: ['Constant tension throughout the movement', 'Keep your core stable', 'Control the descent'],
  },
  'Tricep Pushdown': {
    name: 'Tricep Pushdown',
    sets: 3,
    reps: '10–15',
    muscle: 'Triceps',
    equipment: 'Cable',
    videoUrl: 'https://www.youtube.com/embed/2-LAMcpzODU',
    backupVideoUrl: 'https://www.youtube.com/watch?v=6Fzep104f0s',
    alternatives: ['Overhead Dumbbell Extension', 'Bench Dips'],
    tips: ['Keep your elbows tucked at your sides', 'Avoid leaning forward too much', 'Squeeze your triceps at the bottom'],
  },
  'Overhead Dumbbell Extension': {
    name: 'Overhead Dumbbell Extension',
    sets: 3,
    reps: '10–12',
    muscle: 'Triceps',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/_9p8V8Uj0uY',
    alternatives: ['Tricep Pushdown', 'Bench Dips'],
    tips: ['Keep your upper arms stationary', 'Extend your arms fully overhead', 'Engage your core to avoid arching your back'],
  },

  // --- LEGS ---
  'Goblet Squat': {
    name: 'Goblet Squat',
    sets: 3,
    reps: '10–12',
    muscle: 'Legs',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/6xwGFn-J_Q0',
    backupVideoUrl: 'https://www.youtube.com/watch?v=MeIiGibT6X0',
    alternatives: ['Bodyweight Squat', 'Leg Press'],
    tips: ['Keep the dumbbell close to your chest', 'Keep your chest up and core engaged', 'Drive through your heels to stand back up'],
  },
  'Leg Press': {
    name: 'Leg Press',
    sets: 3,
    reps: '10–12',
    muscle: 'Legs',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ',
    alternatives: ['Goblet Squat', 'Bodyweight Squat'],
    tips: ['Keep your back flat against the seat', 'Don\'t lock your knees at the top', 'Control the weight on the way down'],
  },
  'Bodyweight Squat': {
    name: 'Bodyweight Squat',
    sets: 3,
    reps: '15–20',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/UXJrBgI2RxM',
    backupVideoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    alternatives: ['Goblet Squat', 'Split Squat'],
    tips: ['Keep your weight on your heels', 'Lower your hips until they are below your knees', 'Keep your chest up'],
  },
  'Romanian Deadlift': {
    name: 'Romanian Deadlift',
    sets: 3,
    reps: '8–10',
    muscle: 'Hamstrings',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/2SHsk9AzdjA',
    backupVideoUrl: 'https://www.youtube.com/watch?v=hCDzSR6bW10',
    alternatives: ['Leg Curl', 'Glute Bridge'],
    tips: ['Hinge at the hips, not the waist', 'Keep the weights close to your legs', 'Only go as low as your hamstrings allow without rounding your back'],
  },
  'Leg Curl': {
    name: 'Leg Curl',
    sets: 3,
    reps: '12–15',
    muscle: 'Hamstrings',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/ELOCsoSyz8E',
    alternatives: ['Romanian Deadlift', 'Glute Bridge'],
    tips: ['Keep your hips pressed into the pad', 'Squeeze at the top of the movement', 'Control the return phase'],
  },
  'Glute Bridge': {
    name: 'Glute Bridge',
    sets: 3,
    reps: '12–15',
    muscle: 'Glutes',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/wPM8icPu6H8',
    alternatives: ['Romanian Deadlift', 'Hip Hinge Drill'],
    tips: ['Squeeze your glutes at the top', 'Keep your feet flat on the floor', 'Avoid over-arching your lower back'],
  },
  'Walking Lunge': {
    name: 'Walking Lunge',
    sets: 3,
    reps: '8 each side',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U',
    backupVideoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
    alternatives: ['Split Squat', 'Step-up'],
    tips: ['Take a large step forward', 'Keep your torso upright', 'Your back knee should almost touch the floor'],
  },

  // --- CORE & CARDIO ---
  'Plank': {
    name: 'Plank',
    sets: 3,
    reps: '30–45 sec',
    muscle: 'Core',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw',
    backupVideoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    alternatives: ['Dead Bug', 'Bird Dog'],
    tips: ['Keep your body in a straight line', 'Squeeze your glutes and core', 'Don\'t let your hips sag'],
  },
  'Dead Bug': {
    name: 'Dead Bug',
    sets: 3,
    reps: '10 each side',
    muscle: 'Core',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws',
    alternatives: ['Plank', 'Bird Dog'],
    tips: ['Keep your lower back pressed into the floor', 'Move slowly and with control', 'Exhale as you extend your arm and leg'],
  },
  'Bird Dog': {
    name: 'Bird Dog',
    sets: 3,
    reps: '10 each side',
    muscle: 'Core',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/wiFNA3sqjCA',
    alternatives: ['Plank', 'Dead Bug'],
    tips: ['Keep your back neutral', 'Extend your opposite arm and leg simultaneously', 'Engage your core to maintain balance'],
  },
  'Incline Walk': {
    name: 'Incline Walk',
    sets: 1,
    reps: '8–12 min',
    muscle: 'Cardio',
    equipment: 'Treadmill',
    videoUrl: 'https://www.youtube.com/embed/JjB2JbdyRs0',
    alternatives: ['Flat Walk', 'Bike'],
    tips: ['Maintain a steady pace', 'Avoid holding onto the handrails', 'Breathe deeply and consistently'],
  },
  'Pull-ups': {
    name: 'Pull-ups',
    sets: 3,
    reps: 'AMRAP',
    muscle: 'Back',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
    alternatives: ['Lat Pulldown', 'Seated Row'],
    tips: ['Pull until your chin is over the bar', 'Keep your core engaged', 'Control the descent'],
  },
  'Dips': {
    name: 'Dips',
    sets: 3,
    reps: '8–12',
    muscle: 'Triceps',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As',
    alternatives: ['Tricep Pushdown', 'Machine Chest Press'],
    tips: ['Keep your elbows tucked', 'Lower until arms are at 90 degrees', 'Push back up forcefully'],
  },
  'Leg Extension': {
    name: 'Leg Extension',
    sets: 3,
    reps: '12–15',
    muscle: 'Legs',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/YyvSfVjQZgc',
    alternatives: ['Goblet Squat', 'Leg Press'],
    tips: ['Pause at the top for a second', 'Keep your back against the seat', 'Control the weight on the way down'],
  },
  'Calf Raise': {
    name: 'Calf Raise',
    sets: 3,
    reps: '15–20',
    muscle: 'Calves',
    equipment: 'Machine',
    videoUrl: 'https://www.youtube.com/embed/gwLzBJYoWl4',
    alternatives: ['Single-leg Calf Raise', 'Jump Rope'],
    tips: ['Full range of motion: deep stretch at bottom', 'Push through the balls of your feet', 'Pause at the top'],
  },
  'Russian Twists': {
    name: 'Russian Twists',
    sets: 3,
    reps: '20 total',
    muscle: 'Core',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw',
    alternatives: ['Plank', 'Dead Bug'],
    tips: ['Rotate your entire torso', 'Keep your feet off the ground if possible', 'Follow your hands with your eyes'],
  },
}

function getWorkoutExercises(workoutTitle: string): Exercise[] {
  switch (workoutTitle) {
    case 'Push':
      return [
        EXERCISE_LIBRARY['Machine Chest Press'],
        EXERCISE_LIBRARY['Dumbbell Shoulder Press'],
        EXERCISE_LIBRARY['Dumbbell Lateral Raise'],
        EXERCISE_LIBRARY['Tricep Pushdown'],
      ]
    case 'Pull':
      return [
        EXERCISE_LIBRARY['Lat Pulldown'],
        EXERCISE_LIBRARY['Single-arm Dumbbell Row'],
        EXERCISE_LIBRARY['Face Pulls'],
        EXERCISE_LIBRARY['Bicep Curl'],
      ]
    case 'Lower Body':
      return [
        EXERCISE_LIBRARY['Goblet Squat'],
        EXERCISE_LIBRARY['Romanian Deadlift'],
        EXERCISE_LIBRARY['Leg Extension'],
        EXERCISE_LIBRARY['Plank'],
      ]
    case 'Upper Body':
      return [
        EXERCISE_LIBRARY['Incline Dumbbell Press'],
        EXERCISE_LIBRARY['Lat Pulldown'],
        EXERCISE_LIBRARY['Dumbbell Shoulder Press'],
        EXERCISE_LIBRARY['Bicep Curl'],
      ]
    case 'Full Body':
      return [
        EXERCISE_LIBRARY['Goblet Squat'],
        EXERCISE_LIBRARY['Machine Chest Press'],
        EXERCISE_LIBRARY['Single-arm Dumbbell Row'],
        EXERCISE_LIBRARY['Russian Twists'],
      ]
    case 'Recovery':
    case 'Light Activity':
      return [
        EXERCISE_LIBRARY['Incline Walk'],
        EXERCISE_LIBRARY['Dead Bug'],
      ]
    default:
      return [EXERCISE_LIBRARY['Incline Walk']]
  }
}

function generateWeeklyPlan(profile: UserProfile): WeekItem[] {
  let workoutTemplates: { title: string; duration: number; intensity: WeekItem['intensity'] }[] = []

  if (profile.weeklyDays === 2) {
    workoutTemplates = [
      { title: 'Full Body', duration: profile.duration, intensity: 'full' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Full Body', duration: profile.duration, intensity: 'full' },
    ]
  } else if (profile.weeklyDays === 3) {
    workoutTemplates = [
      { title: 'Upper Body', duration: profile.duration, intensity: 'full' },
      { title: 'Lower Body', duration: profile.duration - 5, intensity: 'full' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Full Body', duration: profile.duration, intensity: 'light' },
    ]
  } else if (profile.weeklyDays === 4) {
    workoutTemplates = [
      { title: 'Upper Body', duration: profile.duration, intensity: 'full' },
      { title: 'Lower Body', duration: profile.duration - 5, intensity: 'full' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Push', duration: profile.duration, intensity: 'full' },
      { title: 'Light Activity', duration: 20, intensity: 'light' },
    ]
  } else {
    workoutTemplates = [
      { title: 'Push', duration: profile.duration, intensity: 'full' },
      { title: 'Pull', duration: profile.duration, intensity: 'full' },
      { title: 'Lower Body', duration: profile.duration - 5, intensity: 'full' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Full Body', duration: profile.duration, intensity: 'light' },
    ]
  }

  if (profile.activities.includes('Swim')) {
    workoutTemplates = workoutTemplates.map((item) =>
      item.title === 'Lower Body'
        ? {
            ...item,
            duration: Math.max(25, item.duration - 10),
            intensity: 'light',
          }
        : item
    )
  }

  if (profile.activities.includes('Tennis')) {
    workoutTemplates = workoutTemplates.map((item, index) => {
      const isLastTrainingDay = index === workoutTemplates.length - 1

      return isLastTrainingDay
        ? {
            title: 'Light Activity',
            duration: 20,
            intensity: 'light',
          }
        : item
    })
  }

  const week: WeekItem[] = DAYS.map((day, index) => {
    if (index < workoutTemplates.length) {
      const template = workoutTemplates[index]
      const exercises = getWorkoutExercises(template.title)
      return {
        day,
        ...template,
        completed: false,
        exercises: exercises,
        originalExercises: exercises,
      }
    }

    return {
      day,
      title: 'Rest',
      duration: 0,
      intensity: 'rest',
      completed: false,
      exercises: [],
      originalExercises: [],
    }
  })

  return week
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.activeTab === 'start') return 'setup'
      if (parsed.activeTab === 'checkin') return 'reflect'
      return parsed.activeTab === 'week' ? 'plan' : (parsed.activeTab || 'setup')
    }
    return 'setup'
  })

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).profile
    return {
      goal: 'stay_consistent',
      experience: 'returning',
      weeklyDays: 4,
      duration: 40,
      location: 'gym',
      equipment: ['Dumbbells', 'Basic machines'],
      activities: ['Swim'],
    }
  })

  const [weeklyPlan, setWeeklyPlan] = useState<WeekItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const plan: WeekItem[] = JSON.parse(saved).weeklyPlan
      // Backfill exercises for existing plans that don't have them
      return plan.map(item => {
        if (item.intensity !== 'rest' && (!item.exercises || item.exercises.length === 0)) {
          const exercises = getWorkoutExercises(item.title.replace(' (Light)', ''))
          return {
            ...item,
            exercises: exercises,
            originalExercises: item.originalExercises || exercises,
          }
        }
        return item
      })
    }
    return generateWeeklyPlan(profile)
  })

  const [adjustment, setAdjustment] = useState<'none' | 'short' | 'tired' | 'machine_taken'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).adjustment
    return 'none'
  })

  const [checkIn, setCheckIn] = useState<CheckIn>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).checkIn
    return {
      completionRate: 80,
      energy: 3,
      sleepQuality: 3,
      fatigue: 2,
      note: '',
    }
  })

  const [progress, setProgress] = useState<{ totalCompleted: number; streak: number }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.progress || { totalCompleted: 0, streak: 0 }
    }
    return { totalCompleted: 0, streak: 0 }
  })

  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).selectedDay || null
    return null
  })

  const [modalExercise, setModalExercise] = useState<Exercise | null>(null)

  useEffect(() => {
    const data = {
      activeTab,
      profile,
      weeklyPlan,
      adjustment,
      checkIn,
      progress,
      selectedDay,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [activeTab, profile, weeklyPlan, adjustment, checkIn, progress, selectedDay])

  const isFirstRender = useRef(true)

  const weekSummary = useMemo(() => {
    const focusMap = {
      build_muscle: 'Focus: build muscle with manageable weekly volume',
      lose_fat: 'Focus: stay active consistently and keep the plan sustainable',
      stay_consistent: 'Focus: consistency first',
      general_fitness: 'Focus: general strength, energy, and routine',
    }

    return focusMap[profile.goal]
  }, [profile.goal])

  const todayWorkout = useMemo(() => {
    if (!weeklyPlan || weeklyPlan.length === 0) return null

    if (selectedDay) {
      const selected = weeklyPlan.find((item) => item.day === selectedDay)
      if (selected) return selected
    }

    const firstWorkout = weeklyPlan.find((item) => item.intensity !== 'rest')
    return firstWorkout || weeklyPlan[0]
  }, [weeklyPlan, selectedDay])

  const adjustedExercises = useMemo(() => {
    if (adjustment === 'none' || !todayWorkout || !todayWorkout.exercises) return []

    if (adjustment === 'short') {
      return todayWorkout.exercises.slice(0, 3)
    }

    if (adjustment === 'tired') {
      return getWorkoutExercises('Recovery')
    }

    if (adjustment === 'machine_taken') {
      return todayWorkout.exercises.map((ex: Exercise) => {
        const isMachine =
          ex.equipment === 'Machine' ||
          ex.equipment === 'Cable' ||
          ex.equipment.toLowerCase().includes('machine') ||
          ex.equipment.toLowerCase().includes('cable') ||
          ex.equipment.toLowerCase().includes('treadmill')

        if (isMachine) {
          const nextAltName = ex.alternatives[0]
          if (!nextAltName) return ex

          if (EXERCISE_LIBRARY[nextAltName]) {
            return {
              ...EXERCISE_LIBRARY[nextAltName],
              sets: ex.sets,
              reps: ex.reps,
            }
          }

          return {
            name: nextAltName,
            sets: ex.sets,
            reps: ex.reps,
            muscle: ex.muscle,
            equipment:
              nextAltName.toLowerCase().includes('push') ||
              nextAltName.toLowerCase().includes('dip') ||
              nextAltName.toLowerCase().includes('bodyweight') ||
              nextAltName.toLowerCase().includes('plank')
                ? 'Bodyweight'
                : 'Dumbbell',
            alternatives: [ex.name],
            tips: ['Focus on controlled movement', 'Maintain proper form throughout', 'Breathe consistently during the set'],
            searchQuery: `${nextAltName} exercise demo`,
          }
        }
        return ex
      })
    }

    return []
  }, [adjustment, todayWorkout])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
  }, [])

  function updateEquipment(item: string) {
    setProfile((prev) => {
      const exists = prev.equipment.includes(item)
      return {
        ...prev,
        equipment: exists
          ? prev.equipment.filter((x) => x !== item)
          : [...prev.equipment, item],
      }
    })
  }

  function updateActivities(item: string) {
    setProfile((prev) => {
      const exists = prev.activities.includes(item)
      return {
        ...prev,
        activities: exists
          ? prev.activities.filter((x) => x !== item)
          : [...prev.activities, item],
      }
    })
  }

  function handleGenerateWeek() {
    const newPlan = generateWeeklyPlan(profile)
    setWeeklyPlan(newPlan)
    setSelectedDay(null)
    setActiveTab('plan')
  }

  function handleResetDemo() {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  function handleTrySampleScenario() {
    const sampleProfile: UserProfile = {
      goal: 'build_muscle',
      experience: 'some_experience',
      weeklyDays: 4,
      duration: 45,
      location: 'gym',
      equipment: ['Dumbbells', 'Basic machines', 'Bench'],
      activities: ['Running'],
    }
    const samplePlan = generateWeeklyPlan(sampleProfile)
    // Mark first workout as done to show some progress
    samplePlan[0].completed = true
    
    setProfile(sampleProfile)
    setWeeklyPlan(samplePlan)
    setProgress({ totalCompleted: 1, streak: 1 })
    setSelectedDay(samplePlan[1].day) // Select the second day as "today"
    setActiveTab('today')
  }

  function handleGenerateNextWeek() {
    let nextPlan = generateWeeklyPlan(profile)

    if (checkIn.fatigue >= 4) {
      // High fatigue: reduce volume and intensity
      nextPlan = nextPlan.map((item) => {
        if (item.intensity === 'full') {
          const newTitle = `${item.title} (Light)`
          const recoveryExercises = getWorkoutExercises('Recovery')
          return {
            ...item,
            title: newTitle,
            duration: Math.max(20, item.duration - 10),
            intensity: 'light',
            exercises: recoveryExercises,
            originalExercises: recoveryExercises,
          }
        }
        return item
      })
    } else if (checkIn.completionRate >= 80 && checkIn.fatigue <= 2) {
      // Good progress: keep or progress
      nextPlan = nextPlan.map((item) => {
        if (item.intensity === 'full') {
          return {
            ...item,
            duration: Math.min(60, item.duration + 5),
          }
        }
        return item
      })
    }

    setWeeklyPlan(nextPlan)
    setSelectedDay(null)
    setActiveTab('plan')
    // Reset check-in for next time
    setCheckIn({
      completionRate: 100,
      energy: 3,
      sleepQuality: 3,
      fatigue: 2,
      note: '',
    })
  }

  function handleMarkDone() {
    if (!todayWorkout || todayWorkout.completed) return

    setWeeklyPlan((prev) =>
      prev.map((item) =>
        item.day === todayWorkout.day ? { ...item, completed: true } : item
      )
    )

    setProgress((prev) => ({
      totalCompleted: (prev?.totalCompleted || 0) + 1,
      streak: (prev?.streak || 0) + (todayWorkout.intensity !== 'rest' ? 1 : 0),
    }))
  }

  function handleWatchDemo(exercise: Exercise) {
    setModalExercise(exercise)
  }

  function handleSwapExercise(index: number) {
    if (!todayWorkout) return

    setWeeklyPlan((prev) =>
      prev.map((item) => {
        if (item.day !== todayWorkout.day || !item.exercises) return item

        const updated = [...item.exercises]
        const current = updated[index]
        
        // Find the next alternative to cycle through
        // If we have alternatives, pick the first one and move it to the end for next time
        if (!current.alternatives || current.alternatives.length === 0) return item

        const nextAltName = current.alternatives[0]
        const remainingAlts = [...current.alternatives.slice(1), current.name]

        let nextExercise: Exercise

        if (EXERCISE_LIBRARY[nextAltName]) {
          nextExercise = {
            ...EXERCISE_LIBRARY[nextAltName],
            sets: current.sets,
            reps: current.reps,
            // Keep the cycle going
            alternatives: remainingAlts
          }
        } else {
          nextExercise = {
            name: nextAltName,
            sets: current.sets,
            reps: current.reps,
            muscle: current.muscle,
            equipment: nextAltName.toLowerCase().includes('push') || nextAltName.toLowerCase().includes('dip')
              ? 'Bodyweight'
              : nextAltName.toLowerCase().includes('machine')
              ? 'Machine'
              : 'Dumbbell',
            alternatives: remainingAlts,
            tips: ['Focus on controlled movement', 'Maintain proper form throughout', 'Breathe consistently during the set'],
            searchQuery: `${nextAltName} exercise demo`,
          }
        }

        updated[index] = nextExercise
        return { ...item, exercises: updated }
      })
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Build your plan</h2>
              <p className="description">
                Customize your training experience based on your goals and schedule.
              </p>

              <div className="form-section-title">Goals</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Main goal</label>
                  <select
                    value={profile.goal}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        goal: e.target.value as Goal,
                      }))
                    }
                  >
                    <option value="build_muscle">Build muscle</option>
                    <option value="lose_fat">Lose fat</option>
                    <option value="stay_consistent">Stay consistent</option>
                    <option value="general_fitness">General fitness</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Training stage</label>
                  <select
                    value={profile.experience}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        experience: e.target.value as Experience,
                      }))
                    }
                  >
                    <option value="beginner">Beginner</option>
                    <option value="returning">Returning</option>
                    <option value="some_experience">Some experience</option>
                  </select>
                </div>
              </div>

              <div className="form-section-title">Preferences</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Days per week</label>
                  <select
                    value={profile.weeklyDays}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        weeklyDays: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={4}>4 days</option>
                    <option value={5}>5 days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Session duration</label>
                  <select
                    value={profile.duration}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        duration: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={30}>30 min</option>
                    <option value={35}>35 min</option>
                    <option value={40}>40 min</option>
                    <option value={45}>45 min</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Location</label>
                <select
                  value={profile.location}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      location: e.target.value as Location,
                    }))
                  }
                >
                  <option value="gym">Gym</option>
                  <option value="home">Home</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="chip-section">
                <div className="form-section-title">Equipment</div>
                <div className="chip-row">
                  {['Dumbbells', 'Basic machines', 'Bench', 'Bodyweight only'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={profile.equipment.includes(item) ? 'chip active-chip' : 'chip'}
                      onClick={() => updateEquipment(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chip-section">
                <div className="form-section-title">Regular activities</div>
                <div className="chip-row">
                  {['Swim', 'Tennis', 'Running'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={profile.activities.includes(item) ? 'chip active-chip' : 'chip'}
                      onClick={() => updateActivities(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cta-row" style={{ marginTop: '40px' }}>
                <button className="primary-cta" onClick={handleGenerateWeek}>
                  Build My Plan
                </button>
              </div>
            </section>

            <section className="side-card">
              <h3>Live Summary</h3>
              <div className="side-card-content">
                <div className="form-group" style={{ gap: '12px' }}>
                  <div className="workout-meta">Goal: <strong style={{ color: 'var(--primary)' }}>{profile.goal.replace('_', ' ')}</strong></div>
                  <div className="workout-meta">Stage: <strong style={{ color: 'var(--primary)' }}>{profile.experience.replace('_', ' ')}</strong></div>
                  <div className="workout-meta">Volume: <strong style={{ color: 'var(--primary)' }}>{profile.weeklyDays} days / week</strong></div>
                  <div className="workout-meta">Location: <strong style={{ color: 'var(--primary)' }}>{profile.location}</strong></div>
                </div>
              </div>
            </section>
          </div>
        )

      case 'plan':
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Your weekly plan</h2>
              <p className="description" style={{ marginBottom: '32px' }}>{weekSummary}</p>

              <div className="schedule-list">
                {weeklyPlan.map((item) => {
                  const isToday = !selectedDay && item.day === DAYS[new Date().getDay() - 1]
                  const status = item.completed ? 'Done' : item.intensity === 'rest' ? 'Rest' : isToday ? 'Today' : item.intensity === 'light' ? 'Light' : ''

                  return (
                    <div
                      key={item.day}
                      className={`schedule-item ${item.intensity !== 'rest' ? 'clickable' : 'rest'} ${item.completed ? 'completed' : ''} ${isToday ? 'is-today' : ''}`}
                      onClick={() => {
                        if (item.intensity !== 'rest') {
                          setSelectedDay(item.day)
                          setActiveTab('today')
                        }
                      }}
                      style={{ padding: '20px 24px', marginBottom: '8px' }}
                    >
                      <div className="day-info">
                        <div className="day-name" style={{ color: isToday ? 'var(--accent)' : 'var(--text-light)' }}>{item.day}</div>
                        <div>
                          <div className="workout-title" style={{ fontSize: '16px', fontWeight: '600' }}>{item.title}</div>
                          {item.duration > 0 && (
                            <div className="workout-meta" style={{ marginTop: '2px' }}>
                              {item.duration} min • {item.intensity.charAt(0).toUpperCase() + item.intensity.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      {status && (
                        <span className={`status-badge ${status.toLowerCase()}`} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}>
                          {status}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="side-card">
              <h3>Coach Insights</h3>
              <div className="side-card-content">
                <p className="workout-meta" style={{ margin: 0, lineHeight: '1.6' }}>
                  {weeklyPlan.some(item => item.title.includes('(Light)')) 
                    ? "Next week's plan has been adjusted for recovery based on your recent fatigue levels."
                    : weeklyPlan.some(item => item.duration > profile.duration)
                      ? "Your plan has been progressed with increased volume to match your high consistency."
                      : `This plan is balanced for your ${profile.goal.replace('_', ' ')} goal. Focus on consistent execution.`}
                </p>
              </div>
            </section>
          </div>
        )

      case 'today':
        if (!todayWorkout) {
          return (
            <div className="tab-layout">
              <section className="card main-card">
                <h2>Ready to start?</h2>
                <p>Go to the Setup tab to build your custom training plan.</p>
              </section>
            </div>
          )
        }
        return (
          <div className="tab-layout">
            <div className="main-column">
              <section className="card main-card" style={{ padding: '40px' }}>
                <div className="today-focus-header" style={{ marginBottom: '40px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-accent" style={{ fontSize: '11px', fontWeight: '800' }}>{todayWorkout.day} SESSION</span>
                      {todayWorkout.intensity === 'light' && <span className="badge badge-dark" style={{ fontSize: '11px' }}>RECOVERY</span>}
                    </div>
                    <h2 style={{ fontSize: '32px', letterSpacing: '-0.04em', margin: '0 0 12px' }}>{todayWorkout.title}</h2>
                    
                    <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>⏱️ {todayWorkout.duration}m</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ {todayWorkout.intensity}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💪 {todayWorkout.exercises?.length || 0} exercises</span>
                    </div>
                  </div>
                  {JSON.stringify(todayWorkout.exercises) !== JSON.stringify(todayWorkout.originalExercises) && (
                    <button
                      className="ghost"
                      style={{ fontSize: '13px', padding: '0' }}
                      onClick={() => {
                        setWeeklyPlan((prev) =>
                          prev.map((item) =>
                            item.day === todayWorkout.day
                              ? { ...item, exercises: item.originalExercises }
                              : item
                          )
                        )
                      }}
                    >
                      Reset workout
                    </button>
                  )}
                </div>

                <div className="today-primary-actions" style={{ marginBottom: '48px' }}>
                  <button
                    className="primary-cta"
                    onClick={handleMarkDone}
                    disabled={todayWorkout.completed}
                    style={{
                      height: '60px',
                      fontSize: '18px',
                      background: todayWorkout.completed ? 'var(--success)' : 'var(--primary)',
                      boxShadow: todayWorkout.completed ? 'none' : '0 10px 15px -3px rgba(15, 23, 42, 0.15)',
                    }}
                  >
                    {todayWorkout.completed ? '✓ Workout Completed' : 'Complete workout'}
                  </button>

                  <div className="adjustment-section" style={{ marginTop: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700' }}>Adjust today's workout</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Adapt your session based on time, energy, or equipment constraints.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {[
                        { id: 'short', label: 'Short on time' },
                        { id: 'tired', label: 'Low energy' },
                        { id: 'machine_taken', label: 'No machine' }
                      ].map((adj) => (
                        <button
                          key={adj.id}
                          className={adjustment === adj.id ? 'chip active-chip' : 'chip'}
                          onClick={() => setAdjustment(adjustment === adj.id ? 'none' : adj.id as any)}
                          style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                          {adj.label}
                        </button>
                      ))}
                    </div>

                    {adjustment !== 'none' && (
                      <div className="adjusted-preview" style={{ marginTop: '20px', padding: '24px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--accent)' }}>Recommended adjustment</h4>
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent)' }}>{adjustment.replace('_', ' ')}</span>
                        </div>
                        <div className="exercise-list" style={{ gap: '8px' }}>
                          {adjustedExercises.map((exercise, index) => (
                            <div key={`adj-${exercise.name}-${index}`} style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{exercise.name}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{exercise.sets}×{exercise.reps}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          className="primary-cta"
                          style={{ marginTop: '20px', background: 'var(--accent)', height: '44px', fontSize: '14px' }}
                          onClick={() => {
                            setWeeklyPlan((prev) =>
                              prev.map((item) =>
                                item.day === todayWorkout.day
                                  ? { ...item, exercises: adjustedExercises }
                                  : item
                              )
                            )
                            setAdjustment('none')
                          }}
                        >
                          Use this version
                        </button>
                      </div>
                    )}

                    {adjustment === 'none' && todayWorkout && todayWorkout.exercises && JSON.stringify(todayWorkout.exercises) !== JSON.stringify(todayWorkout.originalExercises) && (
                      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>
                        Session has been adapted for {
                          todayWorkout.exercises.length < (todayWorkout.originalExercises?.length || 0) 
                            ? "shorter duration" 
                            : todayWorkout.exercises.every(ex => ex.muscle === 'Cardio' || ex.muscle === 'Core')
                              ? "recovery"
                              : "equipment availability"
                        }.
                      </div>
                    )}
                  </div>
                </div>

                <div className="exercise-list" style={{ gap: '20px' }}>
                  {(() => {
                    const exercises = todayWorkout.exercises && todayWorkout.exercises.length > 0
                      ? todayWorkout.exercises
                      : getWorkoutExercises(todayWorkout.title.replace(' (Light)', ''))

                    return exercises.map((exercise: Exercise, index: number) => {
                      const hasCuratedAlt = exercise.alternatives && exercise.alternatives.length > 0 && EXERCISE_LIBRARY[exercise.alternatives[0]]
                      
                      return (
                        <div key={`${exercise.name}-${index}`} className="exercise-card" style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                          <div className="exercise-header" style={{ marginBottom: '16px' }}>
                            <div className="exercise-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>{exercise.name}</h3>
                                {EXERCISE_LIBRARY[exercise.name] && (
                                  <span style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Curated</span>
                                )}
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{exercise.muscle} • {exercise.equipment}</p>
                            </div>
                            <div className="exercise-reps" style={{ background: 'var(--bg)', padding: '6px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}>
                              {exercise.sets} × {exercise.reps}
                            </div>
                          </div>

                          <div className="exercise-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button className="ghost" style={{ padding: '0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }} onClick={() => handleWatchDemo(exercise)}>Watch demo</button>
                            {exercise.alternatives && exercise.alternatives.length > 0 && (
                              <button 
                                className="secondary" 
                                style={{ marginLeft: 'auto', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
                                onClick={() => handleSwapExercise(index)}
                              >
                                {hasCuratedAlt ? `Swap for ${exercise.alternatives[0]}` : 'Swap exercise'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </section>
            </div>

            <section className="side-card">
              <h3>Guidance</h3>
              <div className="side-card-content" style={{ padding: '24px' }}>
                <div className="workout-meta" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  Today's session is focused on <strong>{todayWorkout.title}</strong> with <strong>{todayWorkout.intensity}</strong> effort.
                </div>
                <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                  <p className="workout-meta" style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: 'var(--text-main)' }}>
                    "Quality over quantity. Focus on the mind-muscle connection for every single rep."
                  </p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'reflect':
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Weekly Reflection</h2>
              <p className="description">Reflect on your past week to optimize your next training block.</p>

              <div className="form-grid" style={{ marginTop: '24px', rowGap: '32px' }}>
                <div className="form-group">
                  <label>How much of your plan did you complete?</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={checkIn.completionRate}
                      onChange={(e) =>
                        setCheckIn((prev) => ({
                          ...prev,
                          completionRate: Number(e.target.value),
                        }))
                      }
                      style={{ flex: 1, padding: 0 }}
                    />
                    <span style={{ minWidth: '45px', fontWeight: '700', color: 'var(--accent)' }}>{checkIn.completionRate}%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>How was your energy this week?</label>
                  <select
                    value={checkIn.energy}
                    onChange={(e) =>
                      setCheckIn((prev) => ({
                        ...prev,
                        energy: Number(e.target.value),
                      }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? 'Very Low' : n === 2 ? 'Low' : n === 3 ? 'Moderate' : n === 4 ? 'High' : 'Peak Energy'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>How well did you sleep?</label>
                  <select
                    value={checkIn.sleepQuality}
                    onChange={(e) =>
                      setCheckIn((prev) => ({
                        ...prev,
                        sleepQuality: Number(e.target.value),
                      }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? 'Restless' : n === 2 ? 'Poor' : n === 3 ? 'Okay' : n === 4 ? 'Good' : 'Deeply Rested'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>How fatigued do you feel right now?</label>
                  <select
                    value={checkIn.fatigue}
                    onChange={(e) =>
                      setCheckIn((prev) => ({
                        ...prev,
                        fatigue: Number(e.target.value),
                      }))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? 'Fresh' : n === 2 ? 'Light' : n === 3 ? 'Moderate' : n === 4 ? 'Heavy' : 'Exhausted'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '32px' }}>
                <label>Personal notes (Optional)</label>
                <textarea
                  value={checkIn.note}
                  onChange={(e) =>
                    setCheckIn((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Any wins, challenges, or focus areas for next week?"
                  style={{ minHeight: '100px', background: 'var(--bg)', border: '1px solid var(--border)' }}
                />
              </div>

              <div className="cta-row" style={{ marginTop: '40px' }}>
                <button className="primary-cta" onClick={handleGenerateNextWeek} style={{ height: '54px' }}>
                  Update next week’s plan
                </button>
              </div>
            </section>

            <section className="side-card">
              <h3>Coach recommendation</h3>
              <div className="side-card-content" style={{ padding: '24px' }}>
                {checkIn.fatigue >= 4 ? (
                  <div style={{ color: '#b91c1c' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Recovery Priority</h4>
                    <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                      Based on your high fatigue, we'll shift next week to a <strong>Deload Phase</strong> with reduced intensity to help you recover.
                    </p>
                  </div>
                ) : checkIn.completionRate >= 80 ? (
                  <div style={{ color: '#15803d' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Progressive Overload</h4>
                    <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                      Excellent consistency! We'll maintain your current momentum and slightly increase volume to keep you progressing.
                    </p>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-main)' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Build Momentum</h4>
                    <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                      We'll keep the plan steady for next week to help you lock in a consistent routine before we increase the challenge.
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)' }}>Why your next week changed</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {checkIn.fatigue >= 4 
                      ? "Lower completion + low energy + high fatigue led to a lighter week."
                      : checkIn.completionRate >= 80 
                        ? "High completion + good recovery led to a slight increase in volume."
                        : "Steady completion and moderate fatigue suggest maintaining current volume."
                    }
                  </p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'progress':
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Your Progress</h2>
              <p className="description">Tracking your consistency and growth over time.</p>

              <div className="metrics-grid" style={{ marginBottom: '48px', gap: '16px' }}>
                <div className="metric-card" style={{ padding: '32px 24px' }}>
                  <span className="metric-value" style={{ fontSize: '40px', letterSpacing: '-0.05em' }}>{progress?.totalCompleted || 0}</span>
                  <span className="metric-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sessions</span>
                </div>
                <div className="metric-card" style={{ padding: '32px 24px' }}>
                  <span className="metric-value" style={{ fontSize: '40px', letterSpacing: '-0.05em' }}>{progress?.streak || 0}</span>
                  <span className="metric-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Streak</span>
                </div>
                <div className="metric-card" style={{ padding: '32px 24px' }}>
                  <span className="metric-value" style={{ fontSize: '40px', letterSpacing: '-0.05em' }}>{(() => {
                    const activeWorkouts = weeklyPlan.filter(item => item.intensity !== 'rest')
                    if (activeWorkouts.length === 0) return 0
                    return Math.round((weeklyPlan.filter(item => item.completed).length / activeWorkouts.length) * 100)
                  })()}%</span>
                  <span className="metric-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Goal</span>
                </div>
              </div>

              <div className="insight-section" style={{ background: 'var(--bg)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '12px', fontWeight: '700' }}>Supporting Insight</h3>
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.6', fontSize: '15px' }}>
                  You've completed <strong>{progress?.totalCompleted || 0}</strong> sessions. Every workout is a deposit into your long-term health. Keep showing up—the hardest part is starting.
                </p>
              </div>
            </section>

            <section className="side-card">
              <h3>Weekly insight</h3>
              <div className="side-card-content" style={{ padding: '24px' }}>
                <p className="workout-meta" style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  {progress?.totalCompleted > 5 
                    ? "Your consistency is building real momentum. Focus on maintaining your current streak to solidify these habits."
                    : "Every session is a step toward your goal. Focus on showing up consistently this week to build your foundation."}
                </p>
              </div>
            </section>
          </div>
        )
    }
  }

  return (
    <>
      <div className="demo-banner">
        <div className="demo-banner-content">
          <span className="demo-label">Prototype / product exploration demo</span>
          <span>New here? You can try the flow from scratch anytime.</span>
        </div>
        <div className="demo-actions">
          <button className="demo-action-btn" onClick={handleResetDemo}>Start fresh</button>
          <button className="demo-action-btn" onClick={handleTrySampleScenario}>Try sample scenario</button>
          <a 
            href="https://tally.so/r/68RRv5" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="demo-action-btn secondary" 
            style={{ textDecoration: 'none' }}
          >
            Share feedback
          </a>
        </div>
      </div>
      <div className="app-container">
        <header className="app-header">
          <h1>AI Fitness Coach</h1>
          <p>Workout plans that adapt to real life</p>
        </header>

      <nav className="nav-tabs">
        <button
          className={activeTab === 'setup' ? 'active' : ''}
          onClick={() => setActiveTab('setup')}
        >
          Setup
        </button>
        <button
          className={activeTab === 'plan' ? 'active' : ''}
          onClick={() => setActiveTab('plan')}
        >
          Plan
        </button>
        <button
          className={activeTab === 'today' ? 'active' : ''}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button
          className={activeTab === 'reflect' ? 'active' : ''}
          onClick={() => setActiveTab('reflect')}
        >
          Reflect
        </button>
        <button
          className={activeTab === 'progress' ? 'active' : ''}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
      </nav>

      {renderContent()}
      </div>

      {modalExercise && (
        <div className="modal-overlay" onClick={() => setModalExercise(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '0' }}>
            <button className="modal-close" onClick={() => setModalExercise(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', zIndex: 10 }}>×</button>
            
            <div className="video-container" style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
              {modalExercise.videoUrl && modalExercise.videoUrl.includes('embed') ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={modalExercise.videoUrl}
                  title={`${modalExercise.name} Demo`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                ></iframe>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center', background: 'var(--bg-soft)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
                  <h3 style={{ marginBottom: '8px' }}>Curated Demo Available</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>We've curated a high-quality demonstration for this exercise.</p>
                  <a
                    href={modalExercise.videoUrl || modalExercise.backupVideoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(modalExercise.name + ' exercise demo')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-cta"
                    style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', textDecoration: 'none' }}
                  >
                    Watch on YouTube →
                  </a>
                </div>
              )}
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-accent">{modalExercise.muscle}</span>
                <span className="badge badge-dark">{modalExercise.equipment}</span>
              </div>
              <h2 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--primary)' }}>{modalExercise.name}</h2>
              <div className="workout-meta" style={{ fontSize: '16px', marginBottom: '24px', color: 'var(--text-muted)' }}>
                Targeting: <strong>{modalExercise.sets} sets × {modalExercise.reps}</strong>
              </div>

              <div className="tips-section" style={{ background: 'var(--bg-soft)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>💡</span> Coaching Tips
                </h3>
                <div className="tips-list">
                  {(modalExercise.tips && modalExercise.tips.length > 0 ? modalExercise.tips : ['Focus on controlled movement', 'Maintain proper form throughout', 'Breathe consistently during the set']).map((tip, i) => (
                    <div key={i} className="tip-item" style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <span className="tip-number" style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, fontWeight: '700' }}>{i+1}</span>
                      <span style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: '1.6' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                <button className="primary-cta" onClick={() => setModalExercise(null)} style={{ flex: 1 }}>Got it, let's work</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
