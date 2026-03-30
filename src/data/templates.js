/**
 * Curated Habit Template Packs
 */

const TEMPLATES = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start every day with intention and energy.',
    emoji: '🌅',
    color: '#F97316',
    habits: [
      { title: 'Wake Up Early', description: 'Rise before 7 AM', category: 'Personal', kind: 'build', icon: 'alarm' },
      { title: 'Morning Meditation', description: '10 minutes of mindfulness', category: 'Wellness', kind: 'build', icon: 'self_improvement' },
      { title: 'Exercise', description: '20-30 min workout', category: 'Fitness', kind: 'build', icon: 'fitness_center' },
      { title: 'Healthy Breakfast', description: 'Fuel your body right', category: 'Wellness', kind: 'build', icon: 'restaurant' },
    ],
  },
  {
    id: 'fitness-starter',
    name: 'Fitness Starter',
    description: 'Build a solid fitness foundation.',
    emoji: '💪',
    color: '#EF4444',
    habits: [
      { title: 'Daily Workout', description: '30 min workout session', category: 'Fitness', kind: 'build', icon: 'fitness_center' },
      { title: 'Hydration Goal', description: 'Drink 8 glasses of water', category: 'Wellness', kind: 'build', icon: 'local_drink' },
      { title: 'Stretching', description: '10 min morning stretch', category: 'Fitness', kind: 'build', icon: 'accessibility' },
    ],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness & Calm',
    description: 'Reduce stress and find inner peace.',
    emoji: '🧘',
    color: '#14B8A6',
    habits: [
      { title: 'Meditation', description: '15 minutes of guided meditation', category: 'Wellness', kind: 'build', icon: 'self_improvement' },
      { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', category: 'Personal', kind: 'build', icon: 'menu_book' },
      { title: 'Digital Detox', description: 'No screens 1 hour before bed', category: 'Personal', kind: 'quit', icon: 'phonelink_off' },
    ],
  },
  {
    id: 'atomic-habits',
    name: 'Atomic Habits Starter',
    description: 'Based on James Clear\'s best practices.',
    emoji: '⚛️',
    color: '#8B5CF6',
    habits: [
      { title: '2-Minute Rule', description: 'Start any habit for just 2 minutes', category: 'Personal', kind: 'build', icon: 'timer' },
      { title: 'Habit Stacking', description: 'Pair a new habit with an existing one', category: 'Personal', kind: 'build', icon: 'layers' },
      { title: 'Environment Design', description: 'Make good habits obvious', category: 'Personal', kind: 'build', icon: 'design_services' },
    ],
  },
  {
    id: 'student-life',
    name: 'Student Life',
    description: 'Stay on top of academics and self-care.',
    emoji: '📚',
    color: '#3B82F6',
    habits: [
      { title: 'Study Session', description: '1 hour of focused study', category: 'Learning', kind: 'build', icon: 'school' },
      { title: 'Reading', description: 'Read 20 pages daily', category: 'Learning', kind: 'build', icon: 'menu_book' },
      { title: 'Review Notes', description: 'Revise today\'s class notes', category: 'Learning', kind: 'build', icon: 'note' },
      { title: 'Sleep by 11 PM', description: 'Consistent sleep schedule', category: 'Wellness', kind: 'build', icon: 'bedtime' },
    ],
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: 'Reclaim your attention and time.',
    emoji: '📵',
    color: '#EC4899',
    habits: [
      { title: 'No Social Media', description: 'Avoid scrolling social feeds', category: 'Personal', kind: 'quit', icon: 'phonelink_off' },
      { title: 'Read a Book Instead', description: 'Replace screen time with reading', category: 'Learning', kind: 'build', icon: 'menu_book' },
      { title: 'Outdoor Walk', description: '20 min walk without phone', category: 'Wellness', kind: 'build', icon: 'directions_walk' },
    ],
  },
];

module.exports = { TEMPLATES };
