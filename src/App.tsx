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

type DemoScenario = {
  id: string
  label: string
  summary: string
  profile: UserProfile
  selectedDayIndex: number
  completedDayIndices: number[]
  adjustment?: 'none' | 'short' | 'tired' | 'machine_taken'
  checkIn?: CheckIn
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STORAGE_KEY = 'ai_fitness_coach_demo_v1'
const REGULAR_ACTIVITY_OPTIONS = [
  'No regular sport',
  'Walking',
  'Running',
  'Cycling',
  'Swim',
  'Tennis',
]

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'busy_beginner',
    label: 'Busy beginner',
    summary: 'A first gym routine with lower friction, simpler movements, and consistency-first guidance.',
    profile: {
      goal: 'stay_consistent',
      experience: 'beginner',
      weeklyDays: 3,
      duration: 35,
      location: 'gym',
      equipment: ['Dumbbells', 'Basic machines', 'Bench'],
      activities: ['No regular sport'],
    },
    selectedDayIndex: 1,
    completedDayIndices: [0],
    adjustment: 'short',
    checkIn: {
      completionRate: 65,
      energy: 3,
      sleepQuality: 3,
      fatigue: 2,
      note: 'Still getting comfortable with the gym flow.',
    },
  },
  {
    id: 'hybrid_week',
    label: 'Swim + tennis week',
    summary: 'Gym volume is balanced around other weekly activity so the plan still feels realistic.',
    profile: {
      goal: 'general_fitness',
      experience: 'returning',
      weeklyDays: 4,
      duration: 40,
      location: 'gym',
      equipment: ['Dumbbells', 'Basic machines', 'Bench'],
      activities: ['Swim', 'Tennis'],
    },
    selectedDayIndex: 2,
    completedDayIndices: [0, 1],
    adjustment: 'machine_taken',
    checkIn: {
      completionRate: 80,
      energy: 3,
      sleepQuality: 3,
      fatigue: 3,
      note: 'Tennis added more upper-body fatigue than expected.',
    },
  },
  {
    id: 'low_energy',
    label: 'Low-energy week',
    summary: 'The plan stays alive even when recovery is off and the week does not go smoothly.',
    profile: {
      goal: 'stay_consistent',
      experience: 'returning',
      weeklyDays: 4,
      duration: 40,
      location: 'gym',
      equipment: ['Dumbbells', 'Basic machines', 'Bench'],
      activities: ['Running'],
    },
    selectedDayIndex: 1,
    completedDayIndices: [0],
    adjustment: 'tired',
    checkIn: {
      completionRate: 55,
      energy: 2,
      sleepQuality: 2,
      fatigue: 4,
      note: 'Running volume was high and recovery slipped.',
    },
  },
]

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
    alternatives: ['Rear Delt Raise', 'Chest-supported Row'],
    tips: ['Pull toward your forehead', 'Keep your elbows high', 'Rotate your hands back at the end of the movement'],
  },
  'Rear Delt Raise': {
    name: 'Rear Delt Raise',
    sets: 3,
    reps: '12–15',
    muscle: 'Shoulders',
    equipment: 'Dumbbell',
    videoUrl: 'https://www.youtube.com/embed/a2S4pCIVZGw',
    backupVideoUrl: 'https://www.youtube.com/watch?v=a2S4pCIVZGw',
    alternatives: ['Face Pulls', 'Chest-supported Row'],
    tips: ['Hinge slightly at the hips and keep a soft bend in the elbows', 'Raise the weights wide rather than pulling backward', 'Pause briefly at shoulder height before lowering'],
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
  'Bench Dips': {
    name: 'Bench Dips',
    sets: 3,
    reps: '10–15',
    muscle: 'Triceps',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/jCrsPTAjlgI',
    backupVideoUrl: 'https://www.youtube.com/watch?v=jCrsPTAjlgI',
    alternatives: ['Overhead Dumbbell Extension', 'Tricep Pushdown'],
    tips: ['Keep your shoulders down and chest lifted', 'Lower until your elbows reach about 90 degrees', 'Press through your palms without shrugging your shoulders'],
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
  'Split Squat': {
    name: 'Split Squat',
    sets: 3,
    reps: '8 each side',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/REflwhg0jNs',
    backupVideoUrl: 'https://www.youtube.com/watch?v=REflwhg0jNs',
    alternatives: ['Step-up', 'Walking Lunge'],
    tips: ['Set your feet hip-width apart instead of walking a tight line', 'Drop straight down with control', 'Drive through the front foot to return to standing'],
  },
  'Step-up': {
    name: 'Step-up',
    sets: 3,
    reps: '8 each side',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/M1SQgm5qA78',
    backupVideoUrl: 'https://www.youtube.com/watch?v=M1SQgm5qA78',
    alternatives: ['Split Squat', 'Walking Lunge'],
    tips: ['Use a stable bench or box', 'Drive through the whole working foot', 'Control the lowering phase instead of dropping down'],
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
    alternatives: ['March in Place', 'Step-up'],
    tips: ['Maintain a steady pace', 'Avoid holding onto the handrails', 'Breathe deeply and consistently'],
  },
  'March in Place': {
    name: 'March in Place',
    sets: 1,
    reps: '8–12 min',
    muscle: 'Cardio',
    equipment: 'Bodyweight',
    videoUrl: 'https://www.youtube.com/embed/giCVVA0KplE',
    backupVideoUrl: 'https://www.youtube.com/watch?v=giCVVA0KplE',
    alternatives: ['Step-up', 'Dead Bug'],
    tips: ['Stay tall and keep your core lightly braced', 'Drive the knees smoothly instead of rushing the motion', 'Use your arms to keep a steady rhythm'],
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
    alternatives: ['Split Squat', 'Step-up'],
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

const MACHINE_FREE_FALLBACKS: Record<string, string[]> = {
  'Machine Chest Press': ['Dumbbell Bench Press', 'Push-ups'],
  'Machine Shoulder Press': ['Dumbbell Shoulder Press', 'Arnold Press'],
  'Lat Pulldown': ['Chest-supported Row', 'Pull-ups'],
  'Seated Row': ['Chest-supported Row', 'Single-arm Dumbbell Row'],
  'Face Pulls': ['Rear Delt Raise', 'Chest-supported Row'],
  'Tricep Pushdown': ['Bench Dips', 'Overhead Dumbbell Extension'],
  'Cable Curl': ['Hammer Curl', 'Bicep Curl'],
  'Cable Lateral Raise': ['Dumbbell Lateral Raise', 'Rear Delt Raise'],
  'Leg Extension': ['Split Squat', 'Step-up'],
  'Leg Curl': ['Glute Bridge', 'Romanian Deadlift'],
  'Incline Walk': ['March in Place', 'Step-up'],
}

function isMachineBasedExercise(exercise: Exercise) {
  return (
    exercise.equipment === 'Machine' ||
    exercise.equipment === 'Cable' ||
    exercise.equipment.toLowerCase().includes('machine') ||
    exercise.equipment.toLowerCase().includes('cable') ||
    exercise.equipment.toLowerCase().includes('treadmill')
  )
}

function getMachineFreeReplacement(exercise: Exercise, usedNames: Set<string>) {
  const candidates = [
    ...(MACHINE_FREE_FALLBACKS[exercise.name] || []),
    ...exercise.alternatives,
  ]

  const nextName = candidates.find((candidate, index) => {
    if (candidate === exercise.name) return false
    if (candidates.indexOf(candidate) !== index) return false
    if (usedNames.has(candidate)) return false
    return Boolean(EXERCISE_LIBRARY[candidate])
  })

  if (!nextName) {
    usedNames.add(exercise.name)
    return exercise
  }

  const replacement = {
    ...EXERCISE_LIBRARY[nextName],
    sets: exercise.sets,
    reps: exercise.reps,
  }

  usedNames.add(replacement.name)
  return replacement
}

function getTodayDayLabel() {
  return DAYS[(new Date().getDay() + 6) % 7]
}

function getTodayDayIndex() {
  return (new Date().getDay() + 6) % 7
}

function isBeginnerProfile(profile: UserProfile) {
  return profile.experience === 'beginner' || profile.activities.includes('No regular sport')
}

function prefersMachineFree(profile: UserProfile) {
  return (
    profile.location === 'home' ||
    profile.equipment.includes('Bodyweight only') ||
    !profile.equipment.includes('Basic machines')
  )
}

function adaptExercisesToProfile(exercises: Exercise[], profile: UserProfile) {
  const usedNames = new Set<string>()
  const needsMachineFree = prefersMachineFree(profile)
  const needsBeginnerFriendly = isBeginnerProfile(profile)

  const beginnerFallbacks: Record<string, string> = {
    'Romanian Deadlift': 'Glute Bridge',
    'Russian Twists': 'Dead Bug',
    'Arnold Press': 'Dumbbell Shoulder Press',
  }

  return exercises.map((exercise) => {
    let nextExercise = exercise

    if (needsMachineFree && isMachineBasedExercise(nextExercise)) {
      nextExercise = getMachineFreeReplacement(nextExercise, usedNames)
    }

    if (needsMachineFree && nextExercise.name === 'Incline Walk') {
      nextExercise = {
        ...EXERCISE_LIBRARY['March in Place'],
        sets: nextExercise.sets,
        reps: nextExercise.reps,
      }
    }

    if (needsBeginnerFriendly && beginnerFallbacks[nextExercise.name]) {
      const fallback = EXERCISE_LIBRARY[beginnerFallbacks[nextExercise.name]]
      nextExercise = {
        ...fallback,
        sets: nextExercise.sets,
        reps: nextExercise.reps,
      }
    }

    usedNames.add(nextExercise.name)
    return nextExercise
  })
}

function getActivityNotes(profile: UserProfile) {
  const notes: string[] = []

  if (isBeginnerProfile(profile)) {
    notes.push('The plan stays simpler so you can learn the gym flow without overthinking every decision.')
  }

  if (profile.activities.includes('Running') || profile.activities.includes('Cycling')) {
    notes.push('Running and cycling already load the legs, so lower-body gym work stays more manageable.')
  }

  if (profile.activities.includes('Swim')) {
    notes.push('Swimming already adds upper-body volume, so gym sessions keep pressing and pulling work tighter.')
  }

  if (profile.activities.includes('Tennis')) {
    notes.push('Tennis adds shoulder and rotation load, so the week keeps at least one lighter gym touchpoint.')
  }

  if (!notes.length) {
    notes.push('The plan stays realistic enough to finish, not just impressive on paper.')
  }

  return notes
}

function getPrototypeNarrative(profile: UserProfile) {
  if (profile.activities.includes('Swim') || profile.activities.includes('Tennis')) {
    return 'Built for people who want gym to work with the rest of their week, not compete with it.'
  }

  if (isBeginnerProfile(profile)) {
    return 'Built for people who want a coach-like guide through gym friction, not another perfect plan to ignore.'
  }

  return 'Built for casual exercisers who want help staying consistent when time, energy, or equipment changes.'
}

function getWeeklyPlanMessaging(profile: UserProfile, weeklyPlan: WeekItem[]) {
  if (weeklyPlan.some((item) => item.title.includes('(Light)'))) {
    return {
      title: 'This week protects momentum.',
      body: 'Recovery markers were mixed, so the plan stays lighter to keep the habit alive without pushing fatigue higher.',
      why: 'The product is optimizing for continuity, not forcing a harder week.',
    }
  }

  if (profile.activities.includes('Swim') || profile.activities.includes('Tennis')) {
    return {
      title: 'This gym week is balanced around your other training.',
      body: getActivityNotes(profile).slice(0, 2).join(' '),
      why: 'Gym is one part of the week, not the whole system.',
    }
  }

  if (isBeginnerProfile(profile)) {
    return {
      title: 'This week keeps the bar realistic.',
      body: 'The split stays simpler and lower-friction so you can learn the flow, finish sessions, and build confidence first.',
      why: 'For beginners, consistency beats complexity.',
    }
  }

  return {
    title: 'This week is built to stay finishable.',
    body: 'The plan keeps a strong training signal while leaving room for normal life interruptions and lower-energy days.',
    why: 'The product is optimizing for follow-through, not ideal routines.',
  }
}

function getTodaySessionMessaging(profile: UserProfile, workout: WeekItem | null) {
  if (!workout) {
    return {
      title: 'Built to help you keep going.',
      body: 'Today should feel clear, not overwhelming.',
    }
  }

  if (workout.title.includes('Recovery') || workout.intensity === 'recovery') {
    return {
      title: 'Today protects the routine without asking for much friction.',
      body: 'Recovery sessions still count because they keep the habit moving when energy or load is already high.',
    }
  }

  if ((profile.activities.includes('Running') || profile.activities.includes('Cycling')) && workout.title === 'Lower Body') {
    return {
      title: 'This lower-body day stays realistic around the rest of your week.',
      body: 'You already have leg-heavy activity, so today focuses on enough stimulus without overloading recovery.',
    }
  }

  if ((profile.activities.includes('Swim') || profile.activities.includes('Tennis')) && ['Upper Body', 'Push', 'Pull'].includes(workout.title)) {
    return {
      title: 'This session fits around your other upper-body load.',
      body: 'The goal is to support progress without treating gym as the only training stress in your week.',
    }
  }

  if (isBeginnerProfile(profile)) {
    return {
      title: 'Today is designed to feel straightforward.',
      body: 'The lineup stays simpler so you can focus on finishing the session instead of figuring everything out on the fly.',
    }
  }

  return {
    title: 'Today is built to survive real-life friction.',
    body: 'If time, energy, or equipment changes, the product should help you keep going instead of restarting next week.',
  }
}

function getAdjustmentMessaging(adjustment: 'none' | 'short' | 'tired' | 'machine_taken') {
  switch (adjustment) {
    case 'short':
      return {
        title: 'We kept the high-value moves.',
        body: 'When time is short, the fastest win is preserving the main movement pattern and trimming accessory volume.',
      }
    case 'tired':
      return {
        title: 'Today shifts from progression to consistency.',
        body: 'Low-energy days still count. This version lowers recovery cost so the routine does not break.',
      }
    case 'machine_taken':
      return {
        title: 'The training intent stays the same.',
        body: 'These swaps keep a similar push, pull, or lower-body pattern without waiting around for a machine to open up.',
      }
    default:
      return null
  }
}

function getAppliedWorkoutMessaging(workout: WeekItem | null) {
  if (!workout || !workout.exercises || !workout.originalExercises) return null
  if (JSON.stringify(workout.exercises) === JSON.stringify(workout.originalExercises)) return null

  if (workout.exercises.length < workout.originalExercises.length) {
    return 'This session was shortened to keep the highest-value work when time gets tight.'
  }

  const originalMachineCount = workout.originalExercises.filter((exercise) => isMachineBasedExercise(exercise)).length
  const currentMachineCount = workout.exercises.filter((exercise) => isMachineBasedExercise(exercise)).length

  if (currentMachineCount < originalMachineCount) {
    return 'This lineup was adapted to easier-to-access equipment so you can keep moving without waiting.'
  }

  if (workout.exercises.every((exercise) => ['Cardio', 'Core'].includes(exercise.muscle))) {
    return 'This session was softened to reduce recovery cost while keeping the routine alive.'
  }

  return 'Today has already been adapted to match your current constraints.'
}

function getReflectMessaging(checkIn: CheckIn, profile: UserProfile) {
  const activityContext = getActivityNotes(profile)[0]

  if (checkIn.fatigue >= 4 || checkIn.energy <= 2 || checkIn.sleepQuality <= 2) {
    return {
      title: 'Next week should feel easier to complete.',
      recommendation: 'Recovery markers were lower this week, so the plan should reduce friction before trying to add more load.',
      reason: `${activityContext} The next block should protect continuity first.`,
    }
  }

  if (checkIn.completionRate >= 80 && checkIn.fatigue <= 2) {
    return {
      title: 'You have room to progress a little.',
      recommendation: 'Consistency and recovery both looked solid, so next week can add a small amount of volume without changing the overall structure.',
      reason: 'The product only progresses the plan when the current week looks sustainable.',
    }
  }

  return {
    title: 'The right move is to keep the bar realistic.',
    recommendation: 'This week suggests the plan is close, but still benefits from staying steady before asking for more.',
    reason: 'The goal is to help you repeat a doable week, not chase a perfect one.',
  }
}

function getAdaptedSessionCount(weeklyPlan: WeekItem[]) {
  return weeklyPlan.filter((item) => JSON.stringify(item.exercises) !== JSON.stringify(item.originalExercises)).length
}

function getProgressMessaging(profile: UserProfile, weeklyPlan: WeekItem[]) {
  const activeWorkouts = weeklyPlan.filter((item) => item.intensity !== 'rest')
  const completedCount = weeklyPlan.filter((item) => item.completed).length
  const completionRate = activeWorkouts.length ? Math.round((completedCount / activeWorkouts.length) * 100) : 0
  const adaptedCount = getAdaptedSessionCount(weeklyPlan)

  if (adaptedCount > 0) {
    return {
      headline: `You adapted ${adaptedCount} session${adaptedCount > 1 ? 's' : ''} instead of skipping them.`,
      body: 'That is the core behavior this product is built to support: keep the routine alive when the original plan stops fitting the day.',
      nextFocus: 'Keep one easy fallback in play for busy or low-energy days.',
      note: 'A good week is not perfect. It is repeatable.',
      highlightLabel: 'Adjusted',
      highlightValue: String(adaptedCount),
    }
  }

  if (completionRate >= 75) {
    return {
      headline: 'You kept the routine moving this week.',
      body: 'Completion stayed strong, which matters more than building the most aggressive plan on paper.',
      nextFocus: profile.activities.includes('Tennis') || profile.activities.includes('Swim')
        ? 'Keep balancing gym volume around your other training load.'
        : 'Keep protecting the times of day that make training easiest to repeat.',
      note: 'Consistency compounds faster than occasional perfect weeks.',
      highlightLabel: 'Weekly Goal',
      highlightValue: `${completionRate}%`,
    }
  }

  return {
    headline: 'The opportunity is making next week easier to finish.',
    body: 'Lower completion is useful signal. It means the plan should reduce friction before it asks for more discipline.',
    nextFocus: 'Use the adjustment tools earlier instead of waiting for the session to fall apart.',
    note: 'The product should meet the user where the week actually is.',
    highlightLabel: 'Weekly Goal',
    highlightValue: `${completionRate}%`,
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.quadraticCurveTo(x, y, x + safeRadius, y)
  ctx.closePath()
}

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
) {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(tentative).width <= maxWidth) {
      currentLine = tentative
      return
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)

  if (lines.length <= maxLines) return lines

  const trimmed = lines.slice(0, maxLines)
  trimmed[maxLines - 1] = `${trimmed[maxLines - 1].replace(/\s+\S*$/, '')}…`
  return trimmed
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

function generateWeeklyPlan(profile: UserProfile, options?: { startFromToday?: boolean }): WeekItem[] {
  let workoutTemplates: { title: string; duration: number; intensity: WeekItem['intensity'] }[] = []
  const beginnerBase = isBeginnerProfile(profile)

  if (beginnerBase && profile.weeklyDays === 2) {
    workoutTemplates = [
      { title: 'Full Body', duration: Math.max(25, profile.duration - 5), intensity: 'light' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Full Body', duration: Math.max(25, profile.duration - 5), intensity: 'full' },
    ]
  } else if (beginnerBase && profile.weeklyDays === 3) {
    workoutTemplates = [
      { title: 'Full Body', duration: Math.max(25, profile.duration - 5), intensity: 'full' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Upper Body', duration: Math.max(25, profile.duration - 5), intensity: 'light' },
      { title: 'Light Activity', duration: 20, intensity: 'light' },
    ]
  } else if (beginnerBase && profile.weeklyDays >= 4) {
    workoutTemplates = [
      { title: 'Upper Body', duration: Math.max(25, profile.duration - 5), intensity: 'full' },
      { title: 'Lower Body', duration: Math.max(25, profile.duration - 10), intensity: 'light' },
      { title: 'Recovery', duration: 20, intensity: 'recovery' },
      { title: 'Full Body', duration: Math.max(25, profile.duration - 5), intensity: 'light' },
      { title: 'Light Activity', duration: 20, intensity: 'light' },
    ]
  } else if (profile.weeklyDays === 2) {
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
      ['Upper Body', 'Push', 'Pull'].includes(item.title)
        ? {
            ...item,
            duration: Math.max(25, item.duration - 5),
            intensity: item.intensity === 'full' ? 'light' : item.intensity,
          }
        : item
    )
  }

  if (profile.activities.includes('Running') || profile.activities.includes('Cycling')) {
    workoutTemplates = workoutTemplates.map((item) =>
      item.title === 'Lower Body'
        ? {
            ...item,
            duration: Math.max(25, item.duration - 5),
            intensity: item.intensity === 'full' ? 'light' : item.intensity,
          }
        : item
    )
  }

  if (profile.activities.includes('Tennis')) {
    workoutTemplates = workoutTemplates.map((item, index) => {
      const isLastTrainingDay = index === workoutTemplates.length - 1

      if (['Push', 'Upper Body'].includes(item.title)) {
        return {
          ...item,
          duration: Math.max(25, item.duration - 5),
          intensity: item.intensity === 'full' ? 'light' : item.intensity,
        }
      }

      return isLastTrainingDay
        ? {
            title: 'Light Activity',
            duration: 20,
            intensity: 'light',
          }
        : item
    })
  }

  const startFromToday = options?.startFromToday ?? false
  const startIndex = startFromToday ? getTodayDayIndex() : 0
  const remainingDays = DAYS.length - startIndex
  let scheduledTemplates = workoutTemplates

  if (startFromToday && remainingDays < scheduledTemplates.length) {
    scheduledTemplates = scheduledTemplates.slice(0, remainingDays)

    if (remainingDays <= 3) {
      scheduledTemplates = scheduledTemplates.map((item, index) =>
        index === scheduledTemplates.length - 1 && item.intensity === 'full'
          ? {
              title: 'Light Activity',
              duration: 20,
              intensity: 'light',
            }
          : item
      )
    }
  }

  const week: WeekItem[] = DAYS.map((day, index) => {
    if (startFromToday && index < startIndex) {
      return {
        day,
        title: 'Earlier this week',
        duration: 0,
        intensity: 'rest',
        completed: false,
        exercises: [],
        originalExercises: [],
      }
    }

    const templateIndex = index - startIndex

    if (templateIndex >= 0 && templateIndex < scheduledTemplates.length) {
      const template = scheduledTemplates[templateIndex]
      const exercises = adaptExercisesToProfile(getWorkoutExercises(template.title), profile)
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
          const exercises = adaptExercisesToProfile(getWorkoutExercises(item.title.replace(' (Light)', '')), profile)
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
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved).activeScenarioId || null
    return null
  })

  const [onboardingStep, setOnboardingStep] = useState(1)
  const [setupMode, setSetupMode] = useState<'entry' | 'build' | 'scenario'>('entry')
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [modalExercise, setModalExercise] = useState<Exercise | null>(null)
  const [isSharingWorkout, setIsSharingWorkout] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [todayActionNote, setTodayActionNote] = useState('')

  useEffect(() => {
    const data = {
      activeTab,
      profile,
      weeklyPlan,
      adjustment,
      checkIn,
      progress,
      selectedDay,
      activeScenarioId,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [activeTab, profile, weeklyPlan, adjustment, checkIn, progress, selectedDay, activeScenarioId])

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
  const activeScenario = useMemo(() => DEMO_SCENARIOS.find((scenario) => scenario.id === activeScenarioId) || null, [activeScenarioId])
  const showMobileHeaderBack = activeTab === 'setup' && setupMode !== 'entry'

  const planMessaging = useMemo(() => getWeeklyPlanMessaging(profile, weeklyPlan), [profile, weeklyPlan])
  const reflectMessaging = useMemo(() => getReflectMessaging(checkIn, profile), [checkIn, profile])
  const progressMessaging = useMemo(() => getProgressMessaging(profile, weeklyPlan), [profile, weeklyPlan])
  const prototypeNarrative = useMemo(() => getPrototypeNarrative(profile), [profile])
  const activityNotes = useMemo(() => getActivityNotes(profile), [profile])
  const activeWorkoutCount = useMemo(() => weeklyPlan.filter((item) => item.intensity !== 'rest').length, [weeklyPlan])
  const completedWorkoutCount = useMemo(() => weeklyPlan.filter((item) => item.completed).length, [weeklyPlan])
  const currentWeekCompletionRate = activeWorkoutCount ? Math.round((completedWorkoutCount / activeWorkoutCount) * 100) : 0
  const adaptedSessionCount = useMemo(() => getAdaptedSessionCount(weeklyPlan), [weeklyPlan])

  const todayWorkout = useMemo(() => {
    if (!weeklyPlan || weeklyPlan.length === 0) return null

    if (selectedDay) {
      const selected = weeklyPlan.find((item) => item.day === selectedDay)
      if (selected) return selected
    }

    const todayIndex = getTodayDayIndex()
    const exactToday = weeklyPlan[todayIndex]

    if (exactToday && exactToday.intensity !== 'rest') {
      return exactToday
    }

    const nextUpcoming = weeklyPlan.slice(todayIndex + 1).find((item) => item.intensity !== 'rest' && !item.completed)
    if (nextUpcoming) return nextUpcoming

    const latestAvailable = [...weeklyPlan.slice(0, todayIndex)].reverse().find((item) => item.intensity !== 'rest')
    if (latestAvailable) return latestAvailable

    const firstWorkout = weeklyPlan.find((item) => item.intensity !== 'rest')
    return firstWorkout || weeklyPlan[0]
  }, [weeklyPlan, selectedDay])

  const todayMessaging = useMemo(() => getTodaySessionMessaging(profile, todayWorkout), [profile, todayWorkout])
  const adjustmentMessaging = useMemo(() => getAdjustmentMessaging(adjustment), [adjustment])
  const appliedWorkoutMessaging = useMemo(() => getAppliedWorkoutMessaging(todayWorkout), [todayWorkout])

  const adjustedExercises = useMemo(() => {
    if (adjustment === 'none' || !todayWorkout || !todayWorkout.exercises) return []

    if (adjustment === 'short') {
      return todayWorkout.exercises.slice(0, 3)
    }

    if (adjustment === 'tired') {
      return adaptExercisesToProfile(getWorkoutExercises('Recovery'), profile)
    }

    if (adjustment === 'machine_taken') {
      const usedNames = new Set<string>()

      return todayWorkout.exercises.map((exercise: Exercise) => {
        if (!isMachineBasedExercise(exercise)) {
          usedNames.add(exercise.name)
          return exercise
        }

        return getMachineFreeReplacement(exercise, usedNames)
      })
    }

    return []
  }, [adjustment, todayWorkout, profile])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) return

    const timeoutId = window.setTimeout(() => {
      setToastMessage('')
    }, 2400)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  useEffect(() => {
    setTodayActionNote('')
  }, [todayWorkout?.day])

  useEffect(() => {
    if (!isMobile) return

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [isMobile, activeTab, setupMode, onboardingStep])

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
      if (item === 'No regular sport') {
        const exists = prev.activities.includes(item)
        return {
          ...prev,
          activities: exists ? [] : ['No regular sport'],
        }
      }

      const activities = prev.activities.filter((entry) => entry !== 'No regular sport')
      const exists = activities.includes(item)

      return {
        ...prev,
        activities: exists
          ? activities.filter((x) => x !== item)
          : [...activities, item],
      }
    })
  }

  function handleGenerateWeek() {
    const newPlan = generateWeeklyPlan(profile, { startFromToday: true })
    setWeeklyPlan(newPlan)
    setSelectedDay(null)
    setAdjustment('none')
    setTodayActionNote('')
    setActiveScenarioId(null)
    setSetupMode('entry')
    setActiveTab('plan')
    setOnboardingStep(1)
  }

  function handleResetDemo() {
    localStorage.removeItem(STORAGE_KEY)
    setOnboardingStep(1)
    window.location.reload()
  }

  function handleMobileHeaderBack() {
    if (activeTab !== 'setup') return

    if (setupMode === 'build') {
      if (onboardingStep > 1) {
        setOnboardingStep((prev) => prev - 1)
        return
      }

      setSetupMode('entry')
      return
    }

    if (setupMode === 'scenario') {
      setSetupMode('entry')
    }
  }

  function applyDemoScenario(scenario: DemoScenario) {
    const todayIndex = getTodayDayIndex()
    const completedIndices = scenario.completedDayIndices.filter((index) => index < todayIndex)
    const samplePlan = generateWeeklyPlan(scenario.profile).map((item, index) => ({
      ...item,
      completed: completedIndices.includes(index),
    }))

    setProfile(scenario.profile)
    setWeeklyPlan(samplePlan)
    setProgress({
      totalCompleted: completedIndices.length,
      streak: completedIndices.length,
    })
    setSelectedDay(null)
    setAdjustment('none')
    setCheckIn(scenario.checkIn || {
      completionRate: 80,
      energy: 3,
      sleepQuality: 3,
      fatigue: 2,
      note: '',
    })
    setTodayActionNote('')
    setActiveScenarioId(scenario.id)
    setSetupMode('entry')
    setActiveTab('plan')
    setOnboardingStep(1)
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
    setAdjustment('none')
    setTodayActionNote('')
    setSetupMode('entry')
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

  function getWorkoutShareMessaging() {
    if (!todayWorkout) {
      return {
        eyebrow: 'today',
        hook: 'the plan changed. the workout still happened.',
        subcopy: 'Built around real-life consistency, not ideal routines.',
        shareText: 'Today the plan changed, but the workout still happened.\n\nBuilt this concept around real-life consistency, not perfect routines.',
        footerTitle: 'adaptive workout coach demo',
        footerMeta: 'for days that do not go exactly to plan',
      }
    }

    const isAdjusted = JSON.stringify(todayWorkout.exercises) !== JSON.stringify(todayWorkout.originalExercises)
    const isRecoveryStyle = todayWorkout.intensity === 'recovery' || todayWorkout.title === 'Recovery'
    const shareUrl = window.location.href
    const shareLink = shareUrl.includes('127.0.0.1') || shareUrl.includes('localhost') ? '' : shareUrl

    const eyebrow = isAdjusted ? 'today' : isRecoveryStyle ? 'small win' : 'showed up'

    const hook = isAdjusted
      ? 'the plan changed. the workout still happened.'
      : isRecoveryStyle
        ? 'recovery day still counts.'
        : 'showing up is the whole point.'

    const subcopy = isAdjusted
      ? 'Short on time, low energy, no machine. The flow adapts so the routine still fits real life.'
      : isRecoveryStyle
        ? 'Not every session needs to feel intense. The routine just needs to keep moving.'
        : 'Working on a workout concept that adapts before motivation disappears.'

    const shareTextLines = [
      isRecoveryStyle
        ? 'Recovery day, but the routine stayed alive.'
        : `Today the ${todayWorkout.title.toLowerCase()} workout still happened.`,
      isAdjusted
        ? 'The idea behind this demo: when time, energy, or equipment changes, the product should adapt instead of letting the habit break.'
        : 'Built this concept around adherence first, not perfect plans on paper.',
      shareLink,
    ].filter(Boolean)

    return {
      eyebrow,
      hook,
      subcopy,
      shareText: shareTextLines.join('\n\n'),
      footerTitle: 'adaptive workout coach demo',
      footerMeta: shareLink || 'for real-life consistency',
    }
  }

  async function createWorkoutShareImage() {
    if (!todayWorkout) return null

    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const { eyebrow, hook, subcopy, footerTitle, footerMeta } = getWorkoutShareMessaging()
    const exerciseList = (todayWorkout.exercises && todayWorkout.exercises.length > 0
      ? todayWorkout.exercises
      : adaptExercisesToProfile(getWorkoutExercises(todayWorkout.title.replace(' (Light)', '')), profile)
    ).slice(0, 3)

    const workoutLabel = `${todayWorkout.day} session`
    const workoutTitle = todayWorkout.title
    const stats = [
      `${todayWorkout.duration} min`,
      todayWorkout.intensity.charAt(0).toUpperCase() + todayWorkout.intensity.slice(1),
      `${todayWorkout.exercises?.length || 0} exercises`,
    ]

    const backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    backgroundGradient.addColorStop(0, '#f8f5ef')
    backgroundGradient.addColorStop(1, '#f1ece4')
    ctx.fillStyle = backgroundGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'rgba(183, 204, 247, 0.26)'
    ctx.beginPath()
    ctx.arc(926, 212, 138, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(212, 232, 219, 0.34)'
    ctx.beginPath()
    ctx.arc(168, 1450, 184, 0, Math.PI * 2)
    ctx.fill()

    const safeX = 92
    const contentWidth = 896
    const hookY = 306
    const hookLineHeight = 92

    ctx.fillStyle = '#162032'
    ctx.font = '700 30px Inter, system-ui, sans-serif'
    ctx.fillText('AI Fitness Coach', safeX, 118)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.84)'
    drawRoundedRect(ctx, safeX, 148, 126, 54, 27)
    ctx.fill()

    ctx.fillStyle = '#6f86b6'
    ctx.font = '700 22px Inter, system-ui, sans-serif'
    ctx.fillText(eyebrow.toUpperCase(), safeX + 24, 183)

    ctx.fillStyle = '#162032'
    ctx.font = '700 76px Inter, system-ui, sans-serif'
    const hookLines = getWrappedLines(ctx, hook, contentWidth, 3)
    hookLines.forEach((line, index) => {
      ctx.fillText(line, safeX, hookY + index * hookLineHeight)
    })

    ctx.fillStyle = '#667085'
    ctx.font = '500 34px Inter, system-ui, sans-serif'
    const subcopyLines = getWrappedLines(ctx, subcopy, contentWidth - 12, 3)
    const subcopyY = hookY + hookLines.length * hookLineHeight + 24
    const subcopyLineHeight = 46
    subcopyLines.forEach((line, index) => {
      ctx.fillText(line, safeX, subcopyY + index * subcopyLineHeight)
    })

    const storyCardX = 78
    const storyCardY = subcopyY + subcopyLines.length * subcopyLineHeight + 88
    const storyCardWidth = 924
    const storyCardHeight = 934

    ctx.fillStyle = 'rgba(22, 32, 50, 0.08)'
    drawRoundedRect(ctx, storyCardX, storyCardY + 18, storyCardWidth, storyCardHeight, 54)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.97)'
    drawRoundedRect(ctx, storyCardX, storyCardY, storyCardWidth, storyCardHeight, 54)
    ctx.fill()

    ctx.strokeStyle = 'rgba(22, 32, 50, 0.08)'
    ctx.lineWidth = 2
    drawRoundedRect(ctx, storyCardX, storyCardY, storyCardWidth, storyCardHeight, 54)
    ctx.stroke()

    const heroInset = 34
    const heroX = storyCardX + heroInset
    const heroY = storyCardY + heroInset
    const heroWidth = storyCardWidth - heroInset * 2
    const heroHeight = 250

    const heroGradient = ctx.createLinearGradient(heroX, heroY, heroX + heroWidth, heroY + heroHeight)
    heroGradient.addColorStop(0, '#18253d')
    heroGradient.addColorStop(1, '#213454')
    ctx.fillStyle = heroGradient
    drawRoundedRect(ctx, heroX, heroY, heroWidth, heroHeight, 40)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.64)'
    ctx.font = '700 18px Inter, system-ui, sans-serif'
    ctx.fillText(workoutLabel.toUpperCase(), heroX + 30, heroY + 44)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 56px Inter, system-ui, sans-serif'
    const titleLines = getWrappedLines(ctx, workoutTitle, heroWidth - 60, 2)
    titleLines.forEach((line, index) => {
      ctx.fillText(line, heroX + 30, heroY + 116 + index * 60)
    })

    stats.forEach((stat, index) => {
      const pillWidth = index === 2 ? 194 : 156
      const pillX = heroX + 30 + [0, 176, 352][index]
      const pillY = heroY + heroHeight - 86

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      drawRoundedRect(ctx, pillX, pillY, pillWidth, 54, 27)
      ctx.fill()

      ctx.fillStyle = '#f8fafc'
      ctx.font = '600 22px Inter, system-ui, sans-serif'
      ctx.fillText(stat, pillX + 24, pillY + 34)
    })

    const sheetX = heroX
    const sheetY = heroY + 212
    const sheetWidth = heroWidth
    const sheetHeight = storyCardHeight - (sheetY - storyCardY) - 34

    ctx.fillStyle = '#fffdfa'
    drawRoundedRect(ctx, sheetX, sheetY, sheetWidth, sheetHeight, 36)
    ctx.fill()

    ctx.strokeStyle = 'rgba(22, 32, 50, 0.05)'
    ctx.lineWidth = 2
    drawRoundedRect(ctx, sheetX, sheetY, sheetWidth, sheetHeight, 36)
    ctx.stroke()

    ctx.fillStyle = '#e8f1ea'
    drawRoundedRect(ctx, sheetX + 28, sheetY + 30, 170, 48, 24)
    ctx.fill()

    ctx.fillStyle = '#4f7b60'
    ctx.font = '700 20px Inter, system-ui, sans-serif'
    ctx.fillText('workout done', sheetX + 54, sheetY + 61)

    ctx.fillStyle = '#9aa3af'
    ctx.font = '700 18px Inter, system-ui, sans-serif'
    ctx.fillText('TODAY\'S LINE-UP', sheetX + 28, sheetY + 124)

    const rowX = sheetX + 24
    const rowWidth = sheetWidth - 48
    const rowHeight = 124
    const rowGap = 18
    const firstRowY = sheetY + 150

    exerciseList.forEach((exercise, index) => {
      const top = firstRowY + index * (rowHeight + rowGap)

      ctx.fillStyle = '#f6f1e9'
      drawRoundedRect(ctx, rowX, top, rowWidth, rowHeight, 28)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      drawRoundedRect(ctx, rowX + 2, top + 2, rowWidth - 4, rowHeight - 4, 26)
      ctx.fill()

      ctx.fillStyle = '#e7f0e8'
      ctx.beginPath()
      ctx.arc(rowX + 38, top + 42, 17, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#5f876f'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(rowX + 30, top + 42)
      ctx.lineTo(rowX + 36, top + 48)
      ctx.lineTo(rowX + 47, top + 34)
      ctx.stroke()

      ctx.fillStyle = '#162032'
      ctx.font = '700 30px Inter, system-ui, sans-serif'
      const exerciseNameLines = getWrappedLines(ctx, exercise.name, 500, 1)
      ctx.fillText(exerciseNameLines[0], rowX + 72, top + 50)

      ctx.fillStyle = '#a1a7b3'
      ctx.font = '700 16px Inter, system-ui, sans-serif'
      ctx.fillText(`${exercise.muscle.toUpperCase()}  ${exercise.equipment.toUpperCase()}`, rowX + 72, top + 82)

      ctx.fillStyle = '#5e6f92'
      ctx.font = '700 24px Inter, system-ui, sans-serif'
      const repsText = `${exercise.sets} x ${exercise.reps}`
      const repsWidth = ctx.measureText(repsText).width
      ctx.fillText(repsText, rowX + rowWidth - repsWidth - 32, top + 52)
    })

    const noteY = firstRowY + exerciseList.length * (rowHeight + rowGap) + 12
    ctx.fillStyle = '#f2f5fb'
    drawRoundedRect(ctx, rowX, noteY, rowWidth, 136, 30)
    ctx.fill()

    ctx.fillStyle = '#162032'
    ctx.font = '700 24px Inter, system-ui, sans-serif'
    ctx.fillText('the goal is not the perfect plan.', rowX + 28, noteY + 50)

    ctx.fillStyle = '#667085'
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    const noteLines = getWrappedLines(ctx, 'It is keeping the routine alive when time, energy, or equipment changes mid-week.', rowWidth - 56, 2)
    noteLines.forEach((line, index) => {
      ctx.fillText(line, rowX + 28, noteY + 88 + index * 28)
    })

    const stickerY = storyCardY + storyCardHeight + 56
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    drawRoundedRect(ctx, 78, stickerY, 430, 112, 32)
    ctx.fill()

    ctx.strokeStyle = 'rgba(22, 32, 50, 0.08)'
    ctx.lineWidth = 2
    drawRoundedRect(ctx, 78, stickerY, 430, 112, 32)
    ctx.stroke()

    ctx.fillStyle = '#162032'
    ctx.font = '700 28px Inter, system-ui, sans-serif'
    ctx.fillText(footerTitle, 114, stickerY + 46)

    ctx.fillStyle = '#6b7280'
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    const footerLines = getWrappedLines(ctx, footerMeta, 360, 2)
    footerLines.forEach((line, index) => {
      ctx.fillText(line, 114, stickerY + 78 + index * 24)
    })

    ctx.fillStyle = '#162032'
    drawRoundedRect(ctx, 544, stickerY + 12, 458, 88, 44)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 24px Inter, system-ui, sans-serif'
    ctx.fillText('built for real-life consistency', 584, stickerY + 56)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  async function handleShareWorkout() {
    if (!todayWorkout) return

    setIsSharingWorkout(true)
    setToastMessage('')

    try {
      const blob = await createWorkoutShareImage()
      const { shareText } = getWorkoutShareMessaging()
      const shareUrl = window.location.href

      if (!blob) {
        if (navigator.share) {
          await navigator.share({ title: 'AI Fitness Coach', text: shareText, url: shareUrl })
          setToastMessage('Shared.')
        }
        return
      }

      const file = new File([blob], 'ai-fitness-coach-session.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'AI Fitness Coach',
          text: shareText,
          files: [file],
          url: shareUrl,
        })
        setToastMessage('Shared.')
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'ai-fitness-coach-session.png'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)

      if (navigator.clipboard && shareUrl && !shareUrl.includes('127.0.0.1') && !shareUrl.includes('localhost')) {
        await navigator.clipboard.writeText(shareUrl)
        setToastMessage('Image downloaded and link copied.')
      } else {
        setToastMessage('Image downloaded.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setToastMessage('Share cancelled.')
      } else {
        setToastMessage('Could not open share. Try downloading instead.')
      }
    } finally {
      setIsSharingWorkout(false)
    }
  }

  function handleWatchDemo(exercise: Exercise) {
    setModalExercise(exercise)
  }

  function handleSwapExercise(index: number) {
    if (!todayWorkout) return
    let swapNote = ''

    setWeeklyPlan((prev) =>
      prev.map((item) => {
        if (item.day !== todayWorkout.day) return item
        
        const exercises = (item.exercises && item.exercises.length > 0)
          ? [...item.exercises]
          : [...getWorkoutExercises(item.title.replace(' (Light)', ''))]

        const current = exercises[index]
        if (!current) return item
        
        // Find the next alternative to cycle through
        if (!current.alternatives || current.alternatives.length === 0) return { ...item, exercises }

        const nextAltName = current.alternatives[0]
        const remainingAlts = [...current.alternatives.slice(1), current.name]

        let nextExercise: Exercise

        if (EXERCISE_LIBRARY[nextAltName]) {
          nextExercise = {
            ...EXERCISE_LIBRARY[nextAltName],
            sets: current.sets,
            reps: current.reps,
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

        exercises[index] = nextExercise
        swapNote = `Swapped ${current.name} for ${nextExercise.name} to keep the ${current.muscle.toLowerCase()} focus with equipment that is easier to use right now.`
        return { ...item, exercises }
      })
    )

    if (swapNote) {
      setTodayActionNote(swapNote)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'setup':
        if (isMobile) {
          if (setupMode === 'entry') {
            return (
              <div className="onboarding-layout">
                <div className="prototype-intro card">
                  <div className="prototype-kicker">Adherence-first prototype</div>
                  <p>{prototypeNarrative}</p>
                </div>

                <div className="setup-entry-card card">
                  <h2>How do you want to start?</h2>
                  <p className="description">Choose a guided setup for your own routine, or preview a realistic sample week.</p>

                  <div className="setup-path-grid">
                    <button className="setup-path-card" onClick={() => { setSetupMode('build'); setOnboardingStep(1) }}>
                      <strong>Build my own plan</strong>
                      <span>Answer a few questions and build a gym plan that starts from where this week actually is.</span>
                    </button>
                    <button className="setup-path-card" onClick={() => setSetupMode('scenario')}>
                      <strong>Quick start</strong>
                      <span>Preview sample scenarios like busy beginner, hybrid sports week, or a lower-energy week.</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          if (setupMode === 'scenario') {
            return (
              <div className="onboarding-layout">
                <div className="prototype-intro card">
                  <div className="prototype-kicker">Quick start</div>
                  <p>Pick a sample scenario to preview how the product balances the week before you jump into today.</p>
                </div>

                <div className="setup-entry-card card">
                  <h2>Choose a sample week</h2>
                  <p className="description">These are demo personas designed to show different product behaviors.</p>

                  <div className="scenario-grid">
                    {DEMO_SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        className={`scenario-preview-card ${activeScenarioId === scenario.id ? 'active' : ''}`}
                        onClick={() => applyDemoScenario(scenario)}
                      >
                        <strong>{scenario.label}</strong>
                        <span>{scenario.summary}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="onboarding-layout">
              <div className="onboarding-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(onboardingStep / 4) * 100}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
                  <div className="progress-text" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>STEP {onboardingStep} OF 4</div>
                  <div className="compact-summary" style={{ fontSize: '10px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {profile.goal.replace('_', ' ')} · {profile.weeklyDays} days/week · {profile.duration} min
                  </div>
                </div>
              </div>

              <div className="prototype-intro card">
                <div className="prototype-kicker">Adherence-first prototype</div>
                <p>{prototypeNarrative}</p>
              </div>

              <div className="onboarding-card card">
                {onboardingStep === 1 && (
                  <div className="onboarding-step">
                    <h2>What's your goal?</h2>
                    <p className="description">Choose the focus that best fits your training intent.</p>

                    <div className="option-grid">
                      {[
                        { id: 'build_muscle', label: 'Build Muscle', desc: 'Focus on strength and growth' },
                        { id: 'lose_fat', label: 'Lose Fat', desc: 'Sustainable weight management' },
                        { id: 'stay_consistent', label: 'Stay Consistent', desc: 'Build the habit of showing up' },
                        { id: 'general_fitness', label: 'General Fitness', desc: 'All-around health and energy' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          className={`option-card ${profile.goal === opt.id ? 'active' : ''}`}
                          onClick={() => setProfile(prev => ({ ...prev, goal: opt.id as Goal }))}
                        >
                          <div className="option-label">{opt.label}</div>
                          <div className="option-desc">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="onboarding-step">
                    <h2>Plan basics</h2>
                    <p className="description">How much time do you have each week?</p>
                    
                    <div className="form-group">
                      <label>Training stage</label>
                      <select
                        value={profile.experience}
                        onChange={(e) => setProfile(prev => ({ ...prev, experience: e.target.value as Experience }))}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="returning">Returning</option>
                        <option value="some_experience">Some experience</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                      <label>Days per week</label>
                      <select
                        value={profile.weeklyDays}
                        onChange={(e) => setProfile(prev => ({ ...prev, weeklyDays: Number(e.target.value) }))}
                      >
                        <option value={2}>2 days</option>
                        <option value={3}>3 days</option>
                        <option value={4}>4 days</option>
                        <option value={5}>5 days</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                      <label>Session duration</label>
                      <select
                        value={profile.duration}
                        onChange={(e) => setProfile(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      >
                        <option value={30}>30 min</option>
                        <option value={35}>35 min</option>
                        <option value={40}>40 min</option>
                        <option value={45}>45 min</option>
                      </select>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="onboarding-step">
                    <h2>Equipment</h2>
                    <p className="description">What do you have access to?</p>

                    <div className="form-group">
                      <label>Location</label>
                      <select
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value as Location }))}
                      >
                        <option value="gym">Gym</option>
                        <option value="home">Home</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    <div className="chip-section" style={{ marginTop: '24px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '12px' }}>Equipment available</label>
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
                  </div>
                )}

                {onboardingStep === 4 && (
                  <div className="onboarding-step">
                    <h2>Daily life</h2>
                    <p className="description">Other regular activities your gym week should fit around.</p>

                    <div className="chip-section">
                      <div className="chip-row">
                        {REGULAR_ACTIVITY_OPTIONS.map((item) => (
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

                    <div className="summary-card" style={{ marginTop: '32px', background: 'var(--bg-soft)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>What the plan will optimize for</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.55' }}>
                        {profile.weeklyDays} days/week • {profile.duration} min • {profile.location}
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.55' }}>
                        {activityNotes[0]}
                      </p>
                    </div>
                  </div>
                )}

                <div className="onboarding-actions" style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                  {!isMobile && onboardingStep > 1 && (
                    <button className="secondary" style={{ flex: 1 }} onClick={() => setOnboardingStep(prev => prev - 1)}>Back</button>
                  )}
                  {onboardingStep < 4 ? (
                    <button className="primary-cta" style={{ flex: isMobile ? 1 : 2 }} onClick={() => setOnboardingStep(prev => prev + 1)}>Continue</button>
                  ) : (
                    <button className="primary-cta" style={{ flex: isMobile ? 1 : 2 }} onClick={handleGenerateWeek}>Build My Plan</button>
                  )}
                </div>
              </div>
            </div>
          )
        }

        if (setupMode === 'entry') {
          return (
            <div className="tab-layout">
              <section className="card main-card">
                <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>How do you want to start?</h2>
                <p className="description">Build your own plan, or jump into a realistic sample scenario first.</p>

                <div className="setup-path-grid desktop-setup-path-grid">
                  <button className="setup-path-card" onClick={() => { setSetupMode('build'); setOnboardingStep(1) }}>
                    <strong>Build my own plan</strong>
                    <span>Answer a few questions and create a plan that adapts to this week’s remaining time, energy, and equipment.</span>
                  </button>
                  <button className="setup-path-card" onClick={() => setSetupMode('scenario')}>
                    <strong>Quick start</strong>
                    <span>Preview three sample weeks that show how the product behaves for different personas and constraints.</span>
                  </button>
                </div>
              </section>

              <section className="side-card">
                <h3>Why this prototype exists</h3>
                <div className="side-card-content">
                  <p className="workout-meta" style={{ margin: 0, lineHeight: '1.65' }}>
                    {prototypeNarrative}
                  </p>
                </div>
              </section>
            </div>
          )
        }

        if (setupMode === 'scenario') {
          return (
            <div className="tab-layout">
              <section className="card main-card">
                <button className="ghost setup-back-link" onClick={() => setSetupMode('entry')}>Back</button>
                <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Choose a sample week</h2>
                <p className="description">Use a sample scenario to preview the product before configuring your own plan.</p>

                <div className="scenario-grid desktop-scenario-grid">
                  {DEMO_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      className={`scenario-preview-card ${activeScenarioId === scenario.id ? 'active' : ''}`}
                      onClick={() => applyDemoScenario(scenario)}
                    >
                      <strong>{scenario.label}</strong>
                      <span>{scenario.summary}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="side-card">
                <h3>What Quick Start shows</h3>
                <div className="side-card-content">
                  <p className="workout-meta" style={{ margin: 0, lineHeight: '1.65' }}>
                    Sample scenarios are there to show how the product behaves across beginner friction, hybrid training weeks, and lower-energy recovery periods.
                  </p>
                </div>
              </section>
            </div>
          )
        }

        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Build your plan</h2>
              <p className="description">
                Build a gym plan that stays doable when time, energy, or equipment changes.
              </p>
              <button className="ghost setup-back-link" onClick={() => setSetupMode('entry')}>Back</button>

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
                  {REGULAR_ACTIVITY_OPTIONS.map((item) => (
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
              <h3>Why this prototype exists</h3>
              <div className="side-card-content">
                <p className="workout-meta" style={{ margin: '0 0 18px', lineHeight: '1.65' }}>
                  {prototypeNarrative}
                </p>
                <div className="form-group" style={{ gap: '12px' }}>
                  <div className="workout-meta">Goal: <strong style={{ color: 'var(--primary)' }}>{profile.goal.replace('_', ' ')}</strong></div>
                  <div className="workout-meta">Stage: <strong style={{ color: 'var(--primary)' }}>{profile.experience.replace('_', ' ')}</strong></div>
                  <div className="workout-meta">Volume: <strong style={{ color: 'var(--primary)' }}>{profile.weeklyDays} days / week</strong></div>
                  <div className="workout-meta">Other load: <strong style={{ color: 'var(--primary)' }}>{profile.activities.join(', ') || 'None'}</strong></div>
                </div>
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)' }}>Design principle</h4>
                  <p className="workout-meta" style={{ margin: 0, lineHeight: '1.6' }}>
                    Reduce friction before asking for more discipline.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'plan':
        if (isMobile) {
          return (
            <div className="plan-mobile-layout">
              <section className="insight-hero card">
                <h3>{planMessaging.title}</h3>
                <p className="workout-meta" style={{ margin: 0, lineHeight: '1.6', fontSize: '15px' }}>
                  {planMessaging.body}
                </p>
              </section>

              <section className="plan-why card">
                <div className="reason-kicker">Why this week looks like this</div>
                <p>{planMessaging.why}</p>
              </section>

              {activeScenario && (
                <section className="plan-scenario card">
                  <div className="reason-kicker">Sample scenario</div>
                  <h3>{activeScenario.label}</h3>
                  <p>{activeScenario.summary}</p>
                  <button className="secondary" style={{ marginTop: '14px', width: '100%' }} onClick={() => {
                    setSelectedDay(null)
                    setAdjustment('none')
                    setActiveTab('today')
                  }}>
                    See today’s session
                  </button>
                </section>
              )}

              <div className="schedule-agenda">
                {weeklyPlan.map((item) => {
                  const isToday = !selectedDay && item.day === getTodayDayLabel()
                  const isPast = item.title === 'Earlier this week'
                  const isInteractive = item.intensity !== 'rest' && !item.completed && !isPast
                  const status = item.completed ? 'Done' : isPast ? 'Past' : item.intensity === 'rest' ? 'Rest' : isToday ? 'Today' : item.intensity === 'light' ? 'Light' : ''

                  return (
                    <div
                      key={item.day}
                      className={`agenda-item ${isInteractive ? 'clickable' : 'rest'} ${item.completed ? 'completed' : ''} ${isToday ? 'active' : ''}`}
                      onClick={() => {
                        if (isInteractive) {
                          setSelectedDay(item.day)
                          setActiveTab('today')
                        }
                      }}
                    >
                      <div className="agenda-day">
                        <div className="day-name">{item.day}</div>
                        {isToday && <div className="today-dot"></div>}
                      </div>
                      <div className="agenda-content">
                        <div className="agenda-title">{item.title}</div>
                        {item.intensity !== 'rest' && (
                          <div className="agenda-meta">{item.duration}m • {item.intensity}</div>
                        )}
                      </div>
                      {status && status !== 'Today' && (
                        <div className={`agenda-status ${status.toLowerCase()}`}>{status}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Your weekly plan</h2>
              <p className="description" style={{ marginBottom: '10px' }}>{weekSummary}</p>
              <p className="workout-meta" style={{ margin: '0 0 32px', lineHeight: '1.65' }}>{planMessaging.body}</p>

              {activeScenario && (
                <div style={{ marginBottom: '24px', padding: '22px 24px', borderRadius: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Sample scenario</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>{activeScenario.label}</div>
                  <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{activeScenario.summary}</p>
                  <button className="secondary" onClick={() => {
                    setSelectedDay(null)
                    setAdjustment('none')
                    setActiveTab('today')
                  }}>
                    See today’s session
                  </button>
                </div>
              )}

              <div className="schedule-list">
                {weeklyPlan.map((item) => {
                  const isToday = !selectedDay && item.day === getTodayDayLabel()
                  const isPast = item.title === 'Earlier this week'
                  const isInteractive = item.intensity !== 'rest' && !item.completed && !isPast
                  const status = item.completed ? 'Done' : isPast ? 'Past' : item.intensity === 'rest' ? 'Rest' : isToday ? 'Today' : item.intensity === 'light' ? 'Light' : ''

                  return (
                    <div
                      key={item.day}
                      className={`schedule-item ${isInteractive ? 'clickable' : 'rest'} ${item.completed ? 'completed' : ''} ${isToday ? 'is-today' : ''}`}
                      onClick={() => {
                        if (isInteractive) {
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
                  {planMessaging.why}
                </p>
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)' }}>Activity-aware notes</h4>
                  <p className="workout-meta" style={{ margin: 0, lineHeight: '1.6' }}>
                    {activityNotes.slice(0, 2).join(' ')}
                  </p>
                </div>
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
        const isPastSession = todayWorkout.title === 'Earlier this week'
        const isReadOnlySession = todayWorkout.completed || isPastSession || todayWorkout.intensity === 'rest'
        if (isMobile) {
          return (
            <div className="today-mobile-layout">
              <div className="today-hero">
                <div className="session-label">{todayWorkout.day} SESSION</div>
                <h1 className="workout-name">{todayWorkout.title}</h1>
                <div className="workout-meta-row">
                  <span className="today-meta-pill">{todayWorkout.duration} min</span>
                  <span className="today-meta-pill">
                    {todayWorkout.intensity.charAt(0).toUpperCase() + todayWorkout.intensity.slice(1)}
                  </span>
                  <span className="today-meta-pill">{todayWorkout.exercises?.length || 0} exercises</span>
                </div>
              </div>

              <div className="mobile-actions-container">
                <div className="today-reasoning card">
                  <div className="reason-kicker">Why today looks like this</div>
                  <h3>{todayMessaging.title}</h3>
                  <p>{todayMessaging.body}</p>
                  {(todayActionNote || appliedWorkoutMessaging) && (
                    <div className="today-inline-note">{todayActionNote || appliedWorkoutMessaging}</div>
                  )}
                </div>

                {todayWorkout.completed ? (
                  <div className="completion-panel session-state-panel card">
                    <div className="session-state-title">
                      <div className="completion-check">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <strong>Workout completed</strong>
                    </div>
                    <p className="session-state-body">You kept the session alive today. Share the card if you want to show the product in action.</p>
                    <button className="secondary completion-share-btn" onClick={handleShareWorkout} disabled={isSharingWorkout}>
                      {isSharingWorkout ? 'Preparing share card...' : 'Share today’s result'}
                    </button>
                  </div>
                ) : isPastSession ? (
                  <div className="readonly-session-panel session-state-panel card">
                    <strong className="session-state-heading">Earlier this week</strong>
                    <p className="session-state-body">This session is shown as part of the weekly timeline, but it is no longer editable or actionable.</p>
                  </div>
                ) : (
                  <button
                    className="primary-cta large"
                    onClick={handleMarkDone}
                  >
                    Complete workout
                  </button>
                )}

                {!isReadOnlySession && (
                  <div className="mobile-adjust-section card">
                    <h3>Adjust today's session</h3>
                    <div className="chip-row">
                      {[
                        { id: 'short', label: 'Only 20 min' },
                        { id: 'tired', label: 'Low energy' },
                        { id: 'machine_taken', label: 'Machine occupied' }
                      ].map((adj) => (
                        <button
                          key={adj.id}
                          className={adjustment === adj.id ? 'chip active-chip' : 'chip'}
                          onClick={() => setAdjustment(adjustment === adj.id ? 'none' : adj.id as any)}
                        >
                          {adj.label}
                        </button>
                      ))}
                    </div>
                    {adjustment !== 'none' && (
                      <div className="mobile-adjusted-preview">
                        <div className="preview-header">
                          <span>New line-up</span>
                          <button className="ghost" onClick={() => setAdjustment('none')}>Cancel</button>
                        </div>
                        {adjustmentMessaging && (
                          <div className="adjustment-why">
                            <strong>{adjustmentMessaging.title}</strong>
                            <p>{adjustmentMessaging.body}</p>
                          </div>
                        )}
                        <div className="preview-list">
                          {adjustedExercises.map((ex, i) => (
                            <div key={i} className="preview-line-item">
                              <span>{ex.name}</span>
                              <span>{ex.sets}×{ex.reps}</span>
                            </div>
                          ))}
                        </div>
                        <button className="primary-cta small" onClick={() => {
                          setWeeklyPlan((prev) => prev.map((item) => item.day === todayWorkout.day ? { ...item, exercises: adjustedExercises } : item))
                          setTodayActionNote(adjustmentMessaging?.body || '')
                          setAdjustment('none')
                        }}>Apply adjustment</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="exercise-feed">
                {(() => {
                  const exercises = todayWorkout.exercises && todayWorkout.exercises.length > 0
                    ? todayWorkout.exercises
                    : adaptExercisesToProfile(getWorkoutExercises(todayWorkout.title.replace(' (Light)', '')), profile)

                  return exercises.map((exercise: Exercise, index: number) => {
                    return (
                      <div key={`${exercise.name}-${index}`} className={`mobile-exercise-card card ${isReadOnlySession ? 'readonly' : ''}`}>
                        <div className="ex-header">
                          <div className="ex-info">
                            <h3>{exercise.name}</h3>
                            <div className="ex-tags">
                              <span>{exercise.muscle}</span>
                              <span>{exercise.equipment}</span>
                            </div>
                          </div>
                          <div className="ex-reps">
                            {exercise.sets}×{exercise.reps}
                          </div>
                        </div>
                        {!isReadOnlySession && (
                          <div className="ex-actions">
                            <button className="ghost ex-text-action" onClick={() => handleWatchDemo(exercise)}>
                              Watch demo
                            </button>
                            <button className="secondary ex-secondary-action" onClick={() => handleSwapExercise(index)}>
                              Swap
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
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
                  {!isReadOnlySession && JSON.stringify(todayWorkout.exercises) !== JSON.stringify(todayWorkout.originalExercises) && (
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
                  {todayWorkout.completed ? (
                    <div className="completion-panel session-state-panel card" style={{ padding: '22px' }}>
                      <div className="completion-panel-header">
                        <div className="completion-check">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="completion-copy">
                          <strong>Workout completed</strong>
                          <p>This session is now locked. You can share the result, but not edit the workout.</p>
                        </div>
                      </div>
                      <button className="secondary completion-share-btn" style={{ marginTop: '16px' }} onClick={handleShareWorkout} disabled={isSharingWorkout}>
                        {isSharingWorkout ? 'Preparing share card...' : 'Share today’s result'}
                      </button>
                    </div>
                  ) : isPastSession ? (
                    <div className="readonly-session-panel session-state-panel card" style={{ padding: '22px' }}>
                      <strong>Earlier this week</strong>
                      <p>This session is shown as a timeline reference only. It is no longer editable from Today.</p>
                    </div>
                  ) : (
                    <button
                      className="primary-cta"
                      onClick={handleMarkDone}
                      style={{
                        height: '60px',
                        fontSize: '18px',
                        background: 'var(--primary)',
                        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)',
                      }}
                    >
                      Complete workout
                    </button>
                  )}

                  <div style={{ marginTop: '20px', padding: '20px 22px', borderRadius: '16px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px' }}>Why today looks like this</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>{todayMessaging.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{todayMessaging.body}</p>
                    {(todayActionNote || appliedWorkoutMessaging) && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.55' }}>
                        {todayActionNote || appliedWorkoutMessaging}
                      </div>
                    )}
                  </div>

                  {!isReadOnlySession && (
                  <div className="adjustment-section" style={{ marginTop: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700' }}>Adjust today's workout</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Adapt your session based on time, energy, or equipment constraints.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {[
                        { id: 'short', label: 'Only 20 min' },
                        { id: 'tired', label: 'Low energy' },
                        { id: 'machine_taken', label: 'Machine occupied' }
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
                        {adjustmentMessaging && (
                          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.14)' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>{adjustmentMessaging.title}</div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.55' }}>{adjustmentMessaging.body}</p>
                          </div>
                        )}
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
                            setTodayActionNote(adjustmentMessaging?.body || '')
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
                  )}
                </div>

                <div className="exercise-list" style={{ gap: '20px' }}>
                  {(() => {
                    const exercises = todayWorkout.exercises && todayWorkout.exercises.length > 0
                      ? todayWorkout.exercises
                      : adaptExercisesToProfile(getWorkoutExercises(todayWorkout.title.replace(' (Light)', '')), profile)

                    return exercises.map((exercise: Exercise, index: number) => {
                      const hasCuratedAlt = exercise.alternatives && exercise.alternatives.length > 0 && EXERCISE_LIBRARY[exercise.alternatives[0]]
                      
                      return (
                        <div key={`${exercise.name}-${index}`} className={`exercise-card ${isReadOnlySession ? 'readonly' : ''}`} style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
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

                          {!isReadOnlySession && (
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
                          )}
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
                  {todayMessaging.body}
                </div>
                <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                  <p className="workout-meta" style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)' }}>
                    {todayActionNote || appliedWorkoutMessaging || 'Use Watch demo when confidence is low, and adjust early instead of skipping late.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'reflect':
        if (isMobile) {
          return (
            <div className="reflect-mobile-layout">
              <section className="reflect-hero card">
                <h2>Weekly Reflection</h2>
                <p className="description">Review what actually happened this week so next week stays more finishable.</p>
              </section>

              <div className="reflect-form card">
                <div className="form-group mobile-completion-group">
                  <label className="mobile-completion-label">Completion: {checkIn.completionRate}%</label>
                  <input
                    className="mobile-completion-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={checkIn.completionRate}
                    onChange={(e) => setCheckIn(prev => ({ ...prev, completionRate: Number(e.target.value) }))}
                  />
                </div>

                <div className="mobile-select-grid">
                  <div className="form-group mobile-reflect-field">
                    <label>Energy</label>
                    <select value={checkIn.energy} onChange={(e) => setCheckIn(prev => ({ ...prev, energy: Number(e.target.value) }))}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group mobile-reflect-field">
                    <label>Sleep</label>
                    <select value={checkIn.sleepQuality} onChange={(e) => setCheckIn(prev => ({ ...prev, sleepQuality: Number(e.target.value) }))}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group mobile-reflect-field">
                    <label>Fatigue</label>
                    <select value={checkIn.fatigue} onChange={(e) => setCheckIn(prev => ({ ...prev, fatigue: Number(e.target.value) }))}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <textarea
                  className="mobile-note"
                  value={checkIn.note}
                  onChange={(e) => setCheckIn(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Any wins or challenges?"
                />

                <div className="recommendation-preview" style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-soft)', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--accent)' }}>Coach recommendation</h4>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>{reflectMessaging.title}</div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                    {reflectMessaging.recommendation}
                  </p>
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Why next week changes</div>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.55', color: 'var(--text-muted)' }}>
                      {reflectMessaging.reason}
                    </p>
                  </div>
                  {checkIn.note && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-main)' }}>
                      You flagged: {checkIn.note}
                    </div>
                  )}
                </div>

                <div className="plan-why card" style={{ marginTop: '14px' }}>
                  <div className="reason-kicker">Product view</div>
                  <p>We are not trying to rescue the week with more discipline. We are adjusting the next one so it is easier to repeat.</p>
                </div>

                <button className="primary-cta large" style={{ marginTop: '18px' }} onClick={handleGenerateNextWeek}>
                  Update next week’s plan
                </button>
              </div>
            </div>
          )
        }
        return (
          <div className="tab-layout">
            <section className="card main-card">
              <h2 style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>Weekly Reflection</h2>
              <p className="description">Reflect on what actually happened this week so the next plan stays more doable.</p>

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
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--primary)' }}>{reflectMessaging.title}</h4>
                <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {reflectMessaging.recommendation}
                </p>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)' }}>Why your next week changed</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {reflectMessaging.reason}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )

      case 'progress':
        if (isMobile) {
          return (
            <div className="progress-mobile-layout">
              <div className="metrics-hero">
                <div className="metric-item">
                  <span className="val">{progress?.totalCompleted || 0}</span>
                  <span className="lab">Sessions</span>
                </div>
                <div className="metric-item highlight">
                  <span className="val">{progress?.streak || 0}</span>
                  <span className="lab">Streak</span>
                </div>
                <div className="metric-item">
                  <span className="val">{progressMessaging.highlightValue}</span>
                  <span className="lab">{progressMessaging.highlightLabel}</span>
                </div>
              </div>

              <section className="mobile-insight card">
                <h3>This week’s story</h3>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
                  {progressMessaging.headline}
                </p>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>Why it matters</div>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {progressMessaging.body}
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>Next focus</div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {progressMessaging.nextFocus}
                  </p>
                </div>
              </section>

              <section className="mobile-habit card">
                <h3>Coach Note</h3>
                <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  "{progressMessaging.note}"
                </p>
              </section>
            </div>
          )
        }
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
                  <span className="metric-value" style={{ fontSize: '40px', letterSpacing: '-0.05em' }}>{progressMessaging.highlightValue}</span>
                  <span className="metric-label" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{progressMessaging.highlightLabel}</span>
                </div>
              </div>

              <div className="insight-section" style={{ background: 'var(--bg)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '12px', fontWeight: '700' }}>This week’s story</h3>
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.6', fontSize: '15px' }}>
                  <strong>{progressMessaging.headline}</strong> {progressMessaging.body}
                </p>
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>Next focus</div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.55', fontSize: '14px' }}>
                    {progressMessaging.nextFocus}
                  </p>
                </div>
              </div>
            </section>

            <section className="side-card">
              <h3>Weekly insight</h3>
              <div className="side-card-content" style={{ padding: '24px' }}>
                <p className="workout-meta" style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  {progressMessaging.note}
                </p>
                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)' }}>Snapshot</h4>
                  <p className="workout-meta" style={{ margin: 0, lineHeight: '1.6' }}>
                    {completedWorkoutCount} of {activeWorkoutCount} planned sessions completed. {adaptedSessionCount > 0 ? `${adaptedSessionCount} adjusted to stay on track.` : `Current weekly completion is ${currentWeekCompletionRate}%.`}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )
    }
  }

  return (
    <>
      {!isMobile ? (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <span className="demo-label">Prototype / product exploration demo</span>
            <span>{prototypeNarrative}</span>
          </div>
          <div className="demo-actions">
            <button className="demo-action-btn" onClick={handleResetDemo}>Start fresh</button>
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
      ) : (
        <div className="mobile-app-header">
          <div className="mobile-header-slot">
            {showMobileHeaderBack ? (
              <button className="header-nav-btn" onClick={handleMobileHeaderBack} aria-label="Go back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : (
              <div className="header-nav-spacer" />
            )}
          </div>
          <div className="mobile-title-area">
            <h1>AI Fitness Coach</h1>
            <p>Consistency-first gym copilot</p>
          </div>
          <button className="demo-menu-trigger" onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)} aria-label="Help">
            {isDemoMenuOpen ? '✕' : '?'}
          </button>
          {isDemoMenuOpen && (
            <div className="mobile-demo-menu card">
              <div className="menu-header">Help</div>
              <button onClick={() => { handleResetDemo(); setIsDemoMenuOpen(false); }}>Start fresh</button>
              <a href="https://tally.so/r/68RRv5" target="_blank" rel="noopener noreferrer" onClick={() => setIsDemoMenuOpen(false)}>Share feedback</a>
            </div>
          )}
        </div>
      )}

      <div className="app-container">
        {!isMobile && (
          <header className="app-header">
            <h1>AI Fitness Coach</h1>
            <p>Adherence-first workouts for casual exercisers dealing with real-life gym friction.</p>
          </header>
        )}

      {!isMobile && (
        <nav className="nav-tabs">
          <button
            className={activeTab === 'setup' ? 'active' : ''}
            onClick={() => { setSetupMode('entry'); setActiveTab('setup') }}
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
      )}

      {renderContent()}
      </div>

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {isMobile && (
        <nav className="mobile-bottom-nav">
          {[
            { id: 'setup', label: 'Setup', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            )},
            { id: 'plan', label: 'Plan', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            )},
            { id: 'today', label: 'Today', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            )},
            { id: 'reflect', label: 'Reflect', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.38 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            )},
            { id: 'progress', label: 'Progress', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            )}
          ].map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => {
                if (tab.id === 'setup') {
                  setSetupMode('entry')
                }
                setActiveTab(tab.id as TabKey)
              }}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {modalExercise && (
        <div className="modal-overlay" onClick={() => setModalExercise(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', zIndex: 1000, padding: isMobile ? '0' : '20px' }}>
          <div className={`card modal-content ${isMobile ? 'mobile-sheet' : ''}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '0', borderRadius: isMobile ? '24px 24px 0 0' : 'var(--radius-lg)', animation: isMobile ? 'slideUp 0.3s ease-out' : 'none' }}>
            {isMobile && (
              <div className="sheet-handle-area">
                <div className="sheet-handle"></div>
              </div>
            )}
            {!isMobile && (
              <button className="modal-close" onClick={() => setModalExercise(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', zIndex: 10 }}>×</button>
            )}
            
            <div className={`video-container ${isMobile ? 'sheet-video' : ''}`} style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
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
                <div className="sheet-video-fallback">
                  <h3>Open movement demo</h3>
                  <p>Watch the full exercise reference on YouTube.</p>
                  <a
                    href={modalExercise.videoUrl || modalExercise.backupVideoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(modalExercise.name + ' exercise demo')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary sheet-link-action"
                    style={{ display: 'inline-block', width: 'auto', textDecoration: 'none' }}
                  >
                    Open in YouTube
                  </a>
                </div>
              )}
            </div>

            <div className={isMobile ? 'sheet-body' : ''} style={{ padding: isMobile ? '24px 20px 40px' : '32px' }}>
              <div className="sheet-badges" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <span className="badge badge-accent" style={{ fontSize: '10px' }}>{modalExercise.muscle}</span>
                <span className="badge badge-dark" style={{ fontSize: '10px' }}>{modalExercise.equipment}</span>
              </div>
              <h2 className={isMobile ? 'sheet-title' : ''} style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '4px', color: 'var(--primary)', letterSpacing: '-0.02em' }}>{modalExercise.name}</h2>
              <div className={`workout-meta ${isMobile ? 'sheet-meta' : ''}`} style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-muted)' }}>
                Targeting: <strong style={{ color: 'var(--primary)' }}>{modalExercise.sets} sets × {modalExercise.reps}</strong>
              </div>

              <div className="tips-section" style={{ background: 'var(--bg-soft)', padding: '20px', borderRadius: '12px' }}>
                <h3 className={isMobile ? 'sheet-section-title' : ''} style={{ fontSize: '14px', marginBottom: '16px', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Coaching Tips
                </h3>
                <div className="tips-list">
                  {(modalExercise.tips && modalExercise.tips.length > 0 ? modalExercise.tips : ['Focus on controlled movement', 'Maintain proper form throughout', 'Breathe consistently during the set']).map((tip, i) => (
                    <div key={i} className={`tip-item ${isMobile ? 'sheet-tip-item' : ''}`} style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span className={`tip-number ${isMobile ? 'sheet-tip-number' : ''}`} style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, fontWeight: '700', marginTop: '2px' }}>{i+1}</span>
                      <span className={isMobile ? 'sheet-tip-text' : ''} style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={isMobile ? 'sheet-footer' : ''} style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button className={isMobile ? 'secondary sheet-close-action' : 'primary-cta'} onClick={() => setModalExercise(null)} style={{ flex: 1, height: '48px', fontSize: '15px', borderRadius: '10px' }}>
                  {isMobile ? 'Done' : 'Back to workout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
