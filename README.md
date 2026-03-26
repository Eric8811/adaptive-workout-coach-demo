# AI Fitness Coach Demo

An adherence-first gym copilot for casual exercisers who want to stay consistent when real life gets in the way.

Live demo: [adaptive-workout-coach-demo.vercel.app](https://adaptive-workout-coach-demo.vercel.app)  
Repository: [Eric8811/adaptive-workout-coach-demo](https://github.com/Eric8811/adaptive-workout-coach-demo)

## Overview

This project started from a real problem I kept running into myself.

I am not a highly technical gym user or advanced lifter. I want to work out consistently, but the friction usually is not "I do not have a plan." The friction is everything that happens after the plan:

- the machine I need is occupied
- I am not sure how to use a machine confidently
- my energy is low that day
- I only have 20-30 minutes left
- I also swim, play tennis, or do other activities, so gym should fit around the rest of the week
- a general AI can generate a weekly plan, but I still need to re-explain my situation every time

So instead of building another generic workout planner, I built a mobile-first product exploration around a different idea:

> The product should adapt before the habit breaks.

## Product Thesis

Most workout products optimize for ideal plans.  
This concept optimizes for adherence under real-life constraints.

The goal is not to build a perfect training system for advanced athletes.  
The goal is to help normal users keep their gym routine alive when time, energy, equipment, and weekly context change.

## What Makes This Different

This demo is designed to feel less like a static plan generator and more like a lightweight gym copilot:

- It supports onboarding and weekly planning, but the main value is what happens during the workout.
- It handles real execution friction such as occupied equipment, low energy, and shorter available time.
- It treats gym as one part of the week, not the whole system, so activities like swimming and tennis can influence the plan.
- It explains why a session or next week plan changes, instead of just changing it silently.

## Core Experience

The prototype currently supports a full end-to-end loop:

1. Setup
   Build your own plan or start with a sample scenario.
2. Plan
   Review the weekly schedule and the reasoning behind the week structure.
3. Today
   Run the actual session, watch movement demos, swap exercises, or adjust the workout when reality changes.
4. Reflect
   Do a lightweight weekly check-in based on completion, sleep, energy, fatigue, and notes.
5. Progress
   Review a narrative recap focused on consistency, not just raw metrics.

## My Role

This is a solo product exploration and prototype. My work on this project includes:

- product positioning and problem framing
- user flow and interaction design
- feature prioritization and scope decisions
- rules-based adaptation logic for demo behavior
- frontend prototyping in React and TypeScript
- demo packaging for portfolio and product storytelling

## Key Features

- 4-step onboarding flow for goal, plan basics, equipment, and regular activities
- Weekly plan generation based on goal, frequency, duration, location, equipment, and context
- Sample scenarios for fast product walkthroughs
- Daily workout execution flow with `Watch demo`, `Swap`, and in-the-moment adjustment options for time, energy, and equipment friction
- Bottom-sheet exercise demo experience with video and coaching tips
- Weekly reflection that adapts the next week's plan
- Progress surface focused on continuity and "adapted instead of skipped"
- Shareable workout result card
- Local persistence so plan state, adjustments, progress, and completion survive refresh

## Sample Scenarios

The demo includes a few quick-start scenarios to help people experience the product without filling out the full flow:

- `Busy beginner`
  A simpler, lower-friction gym week for someone building a first routine.
- `Swim + tennis week`
  A hybrid activity week where gym load is balanced around other training.
- `Low-energy week`
  A week that prioritizes consistency and lower recovery cost.

## Product Principles

- Optimize for adherence over idealism
- Reduce friction before asking for more discipline
- Make adaptation visible and understandable
- Design for normal users, not only advanced gym users
- Treat completion, recovery, and adjustment as valid outcomes

## What This Prototype Is Trying To Validate

This demo is meant to explore a few product hypotheses:

- Users are more likely to stay consistent if the workout adapts in the moment instead of forcing a restart later.
- Casual gym users benefit from clear guidance and lower decision friction more than from highly complex planning logic.
- Weekly plans feel more realistic when gym is coordinated with other activities such as tennis, swimming, or running.
- Lightweight explanation increases trust in recommendations.

## Current Scope

This is intentionally a frontend product prototype, not a fully built startup product.

Included:

- responsive React prototype
- mobile-first app-like interaction model
- rules-based adaptation logic
- local persistence
- demo scenarios
- share flow

Not included yet:

- authentication
- cloud sync
- backend or database
- wearable integrations
- real coaching history analysis
- production-grade AI orchestration

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS
- localStorage for prototype persistence
- Vercel for deployment

## Running Locally

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Why This Project Matters To Me

This is not just a fitness demo.

It is a product exploration around a behavior problem I think is under-served: people often do not fail because they lack a plan. They fail because the plan does not flex when life changes.

I wanted to prototype something that feels more like "help me keep going today" and less like "here is another perfect weekly routine to ignore."

## Feedback

If you try the demo and have product, UX, or behavior design feedback, I would love to hear it.
