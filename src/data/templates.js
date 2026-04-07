/**
 * Curated Habit Template Packs
 * "The Best of the Best" - Top 20 Industry-Standard Routine Packs
 */

const TEMPLATES = [
  {
    id: 'morning-ritual',
    name: 'The Morning Ritual',
    description: 'A scientifically-backed sequence to own your morning and win the day.',
    emoji: '🌅',
    color: '#F97316',
    habits: [
      { title: 'Hydrate (500ml)', description: 'Drink water immediately to kickstart metabolism', category: 'Wellness', kind: 'build', icon: 'water_drop', targetValue: 500, targetMetric: 'ml' },
      { title: 'Sunlight Exposure', description: '10-20 mins of natural light for circadian health', category: 'Wellness', kind: 'build', icon: 'wb_sunny', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Intention Setting', description: 'Journal your top 3 objectives for today', category: 'Personal', kind: 'build', icon: 'edit_note' },
      { title: 'Movement', description: 'Light stretching or a 10-min walk', category: 'Fitness', kind: 'build', icon: 'directions_walk', targetValue: 10, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'deep-work-protocol',
    name: 'Deep Work Protocol',
    description: 'Based on Cal Newport\'s framework for high-intensity cognitive focus.',
    emoji: '🧠',
    color: '#6366F1',
    habits: [
      { title: '90-Min Deep Session', description: 'Uninterrupted work on your hardest task', category: 'Career', kind: 'build', icon: 'psychology', targetValue: 90, targetMetric: 'minutes' },
      { title: 'Phone in Airplane Mode', description: 'Eliminate digital distractions during deep blocks', category: 'Personal', kind: 'build', icon: 'airplanemode_active' },
      { title: 'Inbox Zero (Batching)', description: 'Process emails only at scheduled times', category: 'Career', kind: 'build', icon: 'mail' },
      { title: 'Shutdown Ritual', description: 'Formally close out the workday to prevent burnout', category: 'Career', kind: 'build', icon: 'power_settings_new' }
    ],
  },
  {
    id: 'atomic-consistency',
    name: 'Atomic Consistency',
    description: 'Master the principles of James Clear\'s Atomic Habits for identity-based change.',
    emoji: '⚛️',
    color: '#8B5CF6',
    habits: [
      { title: 'The 2-Minute Rule', description: 'Start any new habit for just 2 minutes today', category: 'Personal', kind: 'build', icon: 'timer', targetValue: 2, targetMetric: 'minutes' },
      { title: 'Habit Stacking', description: 'Pair a new habit with an existing ritual', category: 'Personal', kind: 'build', icon: 'layers' },
      { title: 'Environment Design', description: 'Prepare your space to make good habits obvious', category: 'Personal', kind: 'build', icon: 'design_services' },
      { title: 'Never Miss Twice', description: 'If you miss a day, prioritize today at all costs', category: 'Personal', kind: 'build', icon: 'check_circle' }
    ],
  },
  {
    id: 'biohacker-blueprint',
    name: 'Biohacker Blueprint',
    description: 'Advanced physiological optimization based on Huberman & Sinclair.',
    emoji: '🧬',
    color: '#10B981',
    habits: [
      { title: 'Delay Caffeine', description: 'Wait 90-120 mins after waking to avoid crashes', category: 'Wellness', kind: 'build', icon: 'timer' },
      { title: 'Cold Exposure', description: '2-min cold shower or ice bath for dopamine', category: 'Wellness', kind: 'build', icon: 'ac_unit', targetValue: 2, targetMetric: 'minutes' },
      { title: 'Zone 2 Cardio', description: '45 mins of steady-state aerobic work', category: 'Fitness', kind: 'build', icon: 'favorite', targetValue: 45, targetMetric: 'minutes' },
      { title: 'No Screens (1 Hr PM)', description: 'Block blue light 60 mins before sleep', category: 'Wellness', kind: 'quit', icon: 'phonelink_off', targetValue: 60, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'sleep-sanctuary',
    name: 'Sleep Sanctuary',
    description: 'Optimize your recovery and wake up feeling superhuman.',
    emoji: '🌙',
    color: '#4F46E5',
    habits: [
      { title: 'Consistency (Time)', description: 'Go to bed at the exact same time daily', category: 'Wellness', kind: 'build', icon: 'bedtime' },
      { title: 'Cool Room Temp', description: 'Set thermostat to 65°F (18°C) for deep sleep', category: 'Wellness', kind: 'build', icon: 'thermostat' },
      { title: 'Magnesium/Supps', description: 'Take your evening recovery supplements', category: 'Wellness', kind: 'build', icon: 'medication' },
      { title: 'Total Darkness', description: 'Ensure zero light leaks in the bedroom', category: 'Wellness', kind: 'build', icon: 'dark_mode' }
    ],
  },
  {
    id: 'financial-freedom',
    name: 'Financial Freedom',
    description: 'Simple, daily habits to build long-term wealth and awareness.',
    emoji: '💰',
    color: '#059669',
    habits: [
      { title: 'Log All Expenses', description: 'Track every transaction, no matter how small', category: 'Finance', kind: 'build', icon: 'receipt' },
      { title: 'No-Spend Day', description: 'Avoid all non-essential discretionary spending', category: 'Finance', kind: 'build', icon: 'money_off' },
      { title: 'Market/News Review', description: '10 mins of financial literacy or news', category: 'Finance', kind: 'build', icon: 'trending_up', targetValue: 10, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'mental-resilience',
    name: 'Mental Resilience',
    description: 'Stoic and modern psychological tools for a stable mind.',
    emoji: '🏛️',
    color: '#71717A',
    habits: [
      { title: 'Premeditatio Malorum', description: 'Morning prep: Visualize handling obstacles', category: 'Personal', kind: 'build', icon: 'psychology' },
      { title: 'Amor Fati Practice', description: 'Love your fate, reframe a negative', category: 'Personal', kind: 'build', icon: 'favorite' },
      { title: 'Evening Inventory', description: 'Reflect: What did I do well? What can I improve?', category: 'Personal', kind: 'build', icon: 'history_edu' }
    ],
  },
  {
    id: 'fitness-forge',
    name: 'The Fitness Forge',
    description: 'A balanced approach to strength, mobility, and stamina.',
    emoji: '🏋️',
    color: '#EF4444',
    habits: [
      { title: 'Strength Training', description: 'Push, Pull, or Leg session', category: 'Fitness', kind: 'build', icon: 'fitness_center', targetValue: 45, targetMetric: 'minutes' },
      { title: 'Steps (10k)', description: 'Total daily step count target', category: 'Fitness', kind: 'build', icon: 'directions_walk', targetValue: 10000, targetMetric: 'steps' },
      { title: 'Daily Mobility', description: 'Address tight areas (hips, shoulders, spine)', category: 'Fitness', kind: 'build', icon: 'accessibility_new', targetValue: 15, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'creative-catalyst',
    name: 'Creative Catalyst',
    description: 'Build a ritual around your art and creative output.',
    emoji: '🎨',
    color: '#D946EF',
    habits: [
      { title: 'Morning Pages', description: '3 pages of stream-of-consciousness writing', category: 'Creative', kind: 'build', icon: 'auto_stories', targetValue: 3, targetMetric: 'pages' },
      { title: 'Core Creation', description: '1 hour of focused work on your primary art', category: 'Creative', kind: 'build', icon: 'brush', targetValue: 60, targetMetric: 'minutes' },
      { title: 'Consumption Limit', description: 'Consume less social media than you create art', category: 'Personal', kind: 'quit', icon: 'visibility_off' }
    ],
  },
  {
    id: 'social-architect',
    name: 'Social Architect',
    description: 'Nurture your network and build meaningful connections.',
    emoji: '🤝',
    color: '#3B82F6',
    habits: [
      { title: 'Reach Out (1 Person)', description: 'Text or call a friend or professional contact', category: 'Personal', kind: 'build', icon: 'chat' },
      { title: 'Public Gratitude', description: 'Compliment or thank someone publicly/digitally', category: 'Personal', kind: 'build', icon: 'thumb_up' },
      { title: 'Quality Time', description: '30 mins of presence with a loved one', category: 'Personal', kind: 'build', icon: 'diversity_3', targetValue: 30, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'digital-minimalism',
    name: 'Digital Minimalism',
    description: 'Reclaim your attention from the attention economy.',
    emoji: '📵',
    color: '#64748B',
    habits: [
      { title: 'No Screens (First Hour)', description: 'Protect your mind from early information overload', category: 'Personal', kind: 'quit', icon: 'smartphone' },
      { title: 'App Limits', description: 'Stay under your social media time targets', category: 'Personal', kind: 'quit', icon: 'timer', targetValue: 30, targetMetric: 'minutes' },
      { title: 'Manual Search Only', description: 'Avoid clicking on "recommended" or "feeds"', category: 'Personal', kind: 'build', icon: 'search' }
    ],
  },
  {
    id: 'academic-mastery',
    name: 'Academic Mastery',
    description: 'Optimized learning for students and lifelong learners.',
    emoji: '🎓',
    color: '#8B5CF6',
    habits: [
      { title: 'Active Recall Session', description: 'Test yourself on today\'s class material', category: 'Learning', kind: 'build', icon: 'quiz', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Deep Study Block', description: '60 mins of Pomodoro-based study', category: 'Learning', kind: 'build', icon: 'school', targetValue: 60, targetMetric: 'minutes' },
      { title: 'Read (20 Pages)', description: 'Consistent progress through your syllabus', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 20, targetMetric: 'pages' }
    ],
  },
  {
    id: 'polyglot-path',
    name: 'Polyglot Path',
    description: 'The ritual for mastering any language through immersion.',
    emoji: '🌍',
    color: '#0EA5E9',
    habits: [
      { title: 'Spaced Repetition (Anki)', description: 'Review your flashcard deck daily', category: 'Learning', kind: 'build', icon: 'style', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Active Listening', description: 'Podcast or video in your target language', category: 'Learning', kind: 'build', icon: 'hearing', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Shadowing Practice', description: 'Speak aloud alongside native speakers', category: 'Learning', kind: 'build', icon: 'record_voice_over', targetValue: 10, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'clean-fuel',
    name: 'Clean Fuel',
    description: 'Master your nutrition with simple, high-impact rules.',
    emoji: '🥗',
    color: '#84CC16',
    habits: [
      { title: 'Macros Check', description: 'Log your protein and calorie targets', category: 'Wellness', kind: 'build', icon: 'calculate' },
      { title: 'No Refined Sugar', description: 'Avoid sweets and sweetened beverages', category: 'Wellness', kind: 'quit', icon: 'cake' },
      { title: 'Home-Cooked Only', description: 'Eat meals prepared at home today', category: 'Wellness', kind: 'build', icon: 'soup_kitchen' }
    ],
  },
  {
    id: 'code-zen',
    name: 'Code Zen',
    description: 'Fuel your evolution as a software engineer.',
    emoji: '💻',
    color: '#1E293B',
    habits: [
      { title: '#100DaysOfCode Block', description: '1 hour of coding on a personal project', category: 'Career', kind: 'build', icon: 'terminal', targetValue: 60, targetMetric: 'minutes' },
      { title: 'Documentation Read', description: 'Read 1 chapter of official docs or a book', category: 'Learning', kind: 'build', icon: 'article', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Git Commit', description: 'Push a meaningful change to your repository', category: 'Career', kind: 'build', icon: 'commit' }
    ],
  },
  {
    id: 'home-sanctuary',
    name: 'Home Sanctuary',
    description: 'Maintain a space that supports your mental clarity.',
    emoji: '🏠',
    color: '#A855F7',
    habits: [
      { title: 'Make the Bed', description: 'The first win of the day', category: 'Personal', kind: 'build', icon: 'bed' },
      { title: 'Dishes Zero', description: 'Clean the sink before sleeping', category: 'Personal', kind: 'build', icon: 'wash' },
      { title: '15-Min Tidy', description: 'Quick sprint to organize one room', category: 'Personal', kind: 'build', icon: 'cleaning_services', targetValue: 15, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'eco-warrior',
    name: 'Eco-Warrior',
    description: 'Daily rituals to reduce your carbon footprint.',
    emoji: '🌿',
    color: '#16A34A',
    habits: [
      { title: 'No Single-Use Plastic', description: 'Carry your bottle, bag, and cutlery', category: 'Wellness', kind: 'build', icon: 'recycling' },
      { title: 'Plant-Based Day', description: 'Zero animal products for today', category: 'Wellness', kind: 'build', icon: 'eco' },
      { title: 'Energy Audit', description: 'Turn off all unused lights/electronics', category: 'Personal', kind: 'build', icon: 'power' }
    ],
  },
  {
    id: 'the-5am-club',
    name: 'The 5 AM Club',
    description: 'The 20/20/20 formula for extreme productivity.',
    emoji: '🕰️',
    color: '#F59E0B',
    habits: [
      { title: 'Wake at 5:00 AM', description: 'Own the morning before the world wakes', category: 'Personal', kind: 'build', icon: 'alarm' },
      { title: 'Move (Sweat)', description: '20 mins of intense exercise', category: 'Fitness', kind: 'build', icon: 'fitness_center', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Reflect (Journal)', description: '20 mins of solitude and journaling', category: 'Personal', kind: 'build', icon: 'self_improvement', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Grow (Learn)', description: '20 mins of reading or skill-building', category: 'Learning', kind: 'build', icon: 'school', targetValue: 20, targetMetric: 'minutes' }
    ],
  },
  {
    id: 'seventy-five-hard',
    name: '75 Hard Inspired',
    description: 'A mental toughness program for discipline.',
    emoji: '🔥',
    color: '#DC2626',
    habits: [
      { title: 'Follow a Diet', description: 'Zero cheat meals or alcohol', category: 'Wellness', kind: 'build', icon: 'restaurant' },
      { title: 'Two 45-Min Workouts', description: 'One MUST be outdoors', category: 'Fitness', kind: 'build', icon: 'directions_run', targetValue: 90, targetMetric: 'minutes' },
      { title: 'Gallon of Water', description: 'Hydrate to the maximum', category: 'Wellness', kind: 'build', icon: 'local_drink' },
      { title: 'Read (10 Pages)', description: 'Non-fiction only', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 10, targetMetric: 'pages' }
    ],
  },
  {
    id: 'dopamine-detox',
    name: 'Dopamine Detox',
    description: 'Reset your reward system and find joy in the mundane.',
    emoji: '🔌',
    color: '#475569',
    habits: [
      { title: 'No Junk Information', description: 'Zero social media, news, or videos', category: 'Personal', kind: 'quit', icon: 'block' },
      { title: 'No Processed Food', description: 'Whole foods only', category: 'Wellness', kind: 'quit', icon: 'fastfood' },
      { title: 'Boredom Allowance', description: '10 mins of sitting with no input', category: 'Wellness', kind: 'build', icon: 'hourglass_empty', targetValue: 10, targetMetric: 'minutes' }
    ],
  }
];

module.exports = { TEMPLATES };
