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
      { title: 'Daily Workout', description: '30 min workout session', category: 'Fitness', kind: 'build', icon: 'fitness_center', targetValue: 30, targetMetric: 'minutes' },
      { title: 'Hydration Goal', description: 'Drink 8 glasses of water', category: 'Wellness', kind: 'build', icon: 'local_drink', targetValue: 8, targetMetric: 'glasses' },
      { title: 'Stretching', description: '10 min morning stretch', category: 'Fitness', kind: 'build', icon: 'accessibility', targetValue: 10, targetMetric: 'minutes' },
    ],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness & Calm',
    description: 'Reduce stress and find inner peace.',
    emoji: '🧘',
    color: '#14B8A6',
    habits: [
      { title: 'Meditation', description: '15 minutes of guided meditation', category: 'Wellness', kind: 'build', icon: 'self_improvement', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', category: 'Personal', kind: 'build', icon: 'menu_book', targetValue: 3, targetMetric: 'items' },
      { title: 'Digital Detox', description: 'No screens 1 hour before bed', category: 'Personal', kind: 'quit', icon: 'phonelink_off', targetValue: 60, targetMetric: 'minutes' },
    ],
  },
  {
    id: 'atomic-habits',
    name: 'Atomic Habits Starter',
    description: 'Based on James Clear\'s best practices.',
    emoji: '⚛️',
    color: '#8B5CF6',
    habits: [
      { title: '2-Minute Rule', description: 'Start any habit for just 2 minutes', category: 'Personal', kind: 'build', icon: 'timer', targetValue: 2, targetMetric: 'minutes' },
      { title: 'Habit Stacking', description: 'Pair a new habit with an existing one', category: 'Personal', kind: 'build', icon: 'layers' },
      { title: 'Environment Design', description: 'Make good habits obvious', category: 'Personal', kind: 'build', icon: 'design_services' },
    ],
  },
  {
    id: 'academic-excellence',
    name: 'Academic Excellence',
    description: 'Stay on top of studies and self-care.',
    emoji: '📚',
    color: '#3B82F6',
    habits: [
      { title: 'Study Session', description: '1 hour of focused study', category: 'Learning', kind: 'build', icon: 'school', targetValue: 60, targetMetric: 'minutes' },
      { title: 'Reading', description: 'Read 20 pages daily', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 20, targetMetric: 'pages' },
      { title: 'Review Notes', description: 'Revise today\'s class notes', category: 'Learning', kind: 'build', icon: 'note', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Sleep by 11 PM', description: 'Consistent sleep schedule', category: 'Wellness', kind: 'build', icon: 'bedtime' },
    ],
  },
  {
    id: 'digital-minimalism',
    name: 'Digital Minimalism',
    description: 'Reclaim your attention and time from screens.',
    emoji: '📵',
    color: '#EC4899',
    habits: [
      { title: 'No Social Media', description: 'Avoid scrolling social feeds', category: 'Personal', kind: 'quit', icon: 'phonelink_off', targetValue: 1, targetMetric: 'session' },
      { title: 'Read a Book Instead', description: 'Replace screen time with reading', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 15, targetMetric: 'pages' },
      { title: 'Outdoor Walk', description: '20 min walk without phone', category: 'Wellness', kind: 'build', icon: 'directions_walk', targetValue: 20, targetMetric: 'minutes' },
    ],
  },
  {
    id: 'seventy-five-hard',
    name: '75 Hard Inspired',
    description: 'Mental toughness and discipline challenge.',
    emoji: '🔥',
    color: '#DC2626',
    habits: [
      { title: 'Diet Compliance', description: 'Follow your diet, zero cheat meals', category: 'Wellness', kind: 'build', icon: 'restaurant' },
      { title: 'Workout 1 (Outdoor)', description: '45 mins outdoor training', category: 'Fitness', kind: 'build', icon: 'directions_run', targetValue: 45, targetMetric: 'minutes' },
      { title: 'Workout 2', description: '45 mins second training session', category: 'Fitness', kind: 'build', icon: 'fitness_center', targetValue: 45, targetMetric: 'minutes' },
      { title: 'Gallon of Water', description: 'Drink 1 gallon of water today', category: 'Wellness', kind: 'build', icon: 'local_drink' },
      { title: 'Read 10 Pages', description: 'Non-fiction self-development', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 10, targetMetric: 'pages' },
      { title: 'Progress Pic', description: 'Take a daily progress photo', category: 'Personal', kind: 'build', icon: 'photo_camera' }
    ]
  },
  {
    id: 'deep-work',
    name: 'Deep Work Protocol',
    description: 'Cal Newport inspired focus routines.',
    emoji: '🧠',
    color: '#6366F1',
    habits: [
      { title: 'Deep Work Block', description: '90 mins of uninterrupted work', category: 'Career', kind: 'build', icon: 'psychology', targetValue: 90, targetMetric: 'minutes' },
      { title: 'Inbox Zero', description: 'Process emails to zero at end of day', category: 'Career', kind: 'build', icon: 'mail' },
      { title: 'Shutdown Ritual', description: 'Formally close out the workday', category: 'Career', kind: 'build', icon: 'power_settings_new' }
    ]
  },
  {
    id: 'five-am-club',
    name: 'The 5 AM Club',
    description: 'Own your morning, elevate your life (20/20/20 formula).',
    emoji: '🕰️',
    color: '#F59E0B',
    habits: [
      { title: 'Wake at 5 AM', description: 'Rise immediately, no snooze', category: 'Personal', kind: 'build', icon: 'alarm' },
      { title: 'Move (20 min)', description: 'Intense exercise to sweat', category: 'Fitness', kind: 'build', icon: 'fitness_center', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Reflect (20 min)', description: 'Journal, meditate, or pray', category: 'Wellness', kind: 'build', icon: 'self_improvement', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Grow (20 min)', description: 'Read or listen to a podcast', category: 'Learning', kind: 'build', icon: 'headphones', targetValue: 20, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'sleep-hygiene',
    name: 'Sleep Sanctuary',
    description: 'Optimize your rest and recovery.',
    emoji: '🌙',
    color: '#4F46E5',
    habits: [
      { title: 'No Caffeine After 2 PM', description: 'Avoid afternoon stimulants', category: 'Wellness', kind: 'quit', icon: 'local_cafe' },
      { title: 'Dim Lights', description: 'Lower lights 2 hours before bed', category: 'Wellness', kind: 'build', icon: 'lightbulb' },
      { title: 'Cool Room', description: 'Set temperature to ~65°F/18°C', category: 'Wellness', kind: 'build', icon: 'ac_unit' },
      { title: '8 Hours in Bed', description: 'Dedicate 8 hours to rest', category: 'Wellness', kind: 'build', icon: 'bed', targetValue: 8, targetMetric: 'hours' }
    ]
  },
  {
    id: 'financial-fitness',
    name: 'Financial Fitness',
    description: 'Take control of your wealth and spending.',
    emoji: '💰',
    color: '#10B981',
    habits: [
      { title: 'Log Expenses', description: 'Track every dollar spent today', category: 'Finance', kind: 'build', icon: 'receipt' },
      { title: 'No Spend Day', description: 'Zero non-essential purchases', category: 'Finance', kind: 'build', icon: 'money_off' },
      { title: 'Review Budget', description: '5 min daily budget check-in', category: 'Finance', kind: 'build', icon: 'account_balance_wallet', targetValue: 5, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'stoic-daily',
    name: 'Daily Stoic',
    description: 'Ancient philosophy for modern resilience.',
    emoji: '🏛️',
    color: '#71717A',
    habits: [
      { title: 'Morning Preparation', description: 'Anticipate the day\'s challenges', category: 'Personal', kind: 'build', icon: 'wb_sunny' },
      { title: 'Amor Fati', description: 'Love your fate, reframe a negative', category: 'Personal', kind: 'build', icon: 'favorite' },
      { title: 'Evening Reflection', description: 'Review your actions honestly', category: 'Personal', kind: 'build', icon: 'nights_stay' }
    ]
  },
  {
    id: 'developer-100-days',
    name: '#100DaysOfCode',
    description: 'Consistency challenge for software developers.',
    emoji: '💻',
    color: '#0EA5E9',
    habits: [
      { title: 'Code for 1 Hour', description: 'Write code for at least an hour', category: 'Career', kind: 'build', icon: 'code', targetValue: 60, targetMetric: 'minutes' },
      { title: 'Commit to GitHub', description: 'Push progress to a repository', category: 'Career', kind: 'build', icon: 'publish' },
      { title: 'Share Progress', description: 'Post your daily update publicly', category: 'Career', kind: 'build', icon: 'share' }
    ]
  },
  {
    id: 'huberman-protocol',
    name: 'Biohacker Blueprint',
    description: 'Science-based protocols for optimization.',
    emoji: '🧬',
    color: '#059669',
    habits: [
      { title: 'Morning Sunlight', description: '10-30 mins of sun in eyes early', category: 'Wellness', kind: 'build', icon: 'wb_twilight', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Delay Caffeine', description: 'Wait 90-120 mins after waking', category: 'Wellness', kind: 'build', icon: 'timer' },
      { title: 'Zone 2 Cardio', description: 'Steady state cardiovascular work', category: 'Fitness', kind: 'build', icon: 'favorite_border', targetValue: 45, targetMetric: 'minutes' },
      { title: 'Cold Exposure', description: '1-3 min cold shower or plunge', category: 'Wellness', kind: 'build', icon: 'ac_unit', targetValue: 2, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'writers-block',
    name: 'The Writer\'s Way',
    description: 'Break through creative resistance.',
    emoji: '✍️',
    color: '#D946EF',
    habits: [
      { title: 'Morning Pages', description: '3 pages of stream of consciousness', category: 'Creative', kind: 'build', icon: 'auto_stories', targetValue: 3, targetMetric: 'pages' },
      { title: 'Write 500 Words', description: 'Drafting your core project', category: 'Creative', kind: 'build', icon: 'edit', targetValue: 500, targetMetric: 'words' },
      { title: 'Read Poetry/Prose', description: '15 mins of high-quality reading', category: 'Learning', kind: 'build', icon: 'menu_book', targetValue: 15, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'language-immersion',
    name: 'Language Immersion',
    description: 'Master a new tongue through daily practice.',
    emoji: '🌍',
    color: '#14B8A6',
    habits: [
      { title: 'Vocab Flashcards', description: 'Review Anki or Duolingo', category: 'Learning', kind: 'build', icon: 'style', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Listen to Target Language', description: 'Podcast or music in target language', category: 'Learning', kind: 'build', icon: 'hearing', targetValue: 20, targetMetric: 'minutes' },
      { title: 'Speak Aloud', description: 'Practice speaking or shadowing', category: 'Learning', kind: 'build', icon: 'record_voice_over', targetValue: 10, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'home-sanctuary',
    name: 'Home Sanctuary',
    description: 'Keep your living space clean and peaceful.',
    emoji: '🧹',
    color: '#8B5CF6',
    habits: [
      { title: 'Make the Bed', description: 'Immediately upon waking', category: 'Personal', kind: 'build', icon: 'bed' },
      { title: '15-Min Tidy', description: 'Quick decluttering session', category: 'Personal', kind: 'build', icon: 'cleaning_services', targetValue: 15, targetMetric: 'minutes' },
      { title: 'Dishes Zero', description: 'No dishes left in the sink overnight', category: 'Personal', kind: 'build', icon: 'wash' }
    ]
  },
  {
    id: 'eat-the-frog',
    name: 'Eat The Frog',
    description: 'Tackle the hardest things first.',
    emoji: '🐸',
    color: '#84CC16',
    habits: [
      { title: 'Identify The Frog', description: 'Pick the #1 most impactful task', category: 'Career', kind: 'build', icon: 'ads_click' },
      { title: 'Tackle It First', description: 'Work on it before checking email', category: 'Career', kind: 'build', icon: 'done_all' },
      { title: 'Time Block (Pomodoro)', description: 'Use a 25-min timer for focus', category: 'Career', kind: 'build', icon: 'timer', targetValue: 25, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'dopamine-reset',
    name: 'Dopamine Reset',
    description: 'Recalibrate your brain\'s reward system.',
    emoji: '🔌',
    color: '#64748B',
    habits: [
      { title: 'No Sugar/Junk Food', description: 'Eat only whole foods today', category: 'Wellness', kind: 'quit', icon: 'fastfood' },
      { title: 'No Porn/Adult Content', description: 'Avoid highly stimulating media', category: 'Personal', kind: 'quit', icon: 'block' },
      { title: 'No Video Games', description: 'Replace gaming with creation', category: 'Personal', kind: 'quit', icon: 'videogame_asset_off' },
      { title: 'Boredom Allowance', description: 'Sit and do nothing for 10 mins', category: 'Wellness', kind: 'build', icon: 'hourglass_empty', targetValue: 10, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'relationship-builder',
    name: 'Relationship Builder',
    description: 'Nurture your connections and empathy.',
    emoji: '🤝',
    color: '#F43F5E',
    habits: [
      { title: 'Reach Out', description: 'Text or call a friend/family member', category: 'Personal', kind: 'build', icon: 'contact_phone' },
      { title: 'Compliment Someone', description: 'Give a genuine compliment', category: 'Personal', kind: 'build', icon: 'thumb_up' },
      { title: 'Quality Time', description: 'Undivided attention with loved one', category: 'Personal', kind: 'build', icon: 'diversity_1', targetValue: 30, targetMetric: 'minutes' }
    ]
  },
  {
    id: 'clean-eating',
    name: 'Clean Eating Protocol',
    description: 'Fuel your body with whole foods.',
    emoji: '🥗',
    color: '#22C55E',
    habits: [
      { title: 'Eat 5 Veggies/Fruits', description: 'Hit your daily micronutrients', category: 'Wellness', kind: 'build', icon: 'eco', targetValue: 5, targetMetric: 'servings' },
      { title: 'No Added Sugar', description: 'Avoid refined sugars', category: 'Wellness', kind: 'quit', icon: 'cake' },
      { title: 'Home Cooked Meal', description: 'Prepare at least one meal yourself', category: 'Wellness', kind: 'build', icon: 'soup_kitchen' }
    ]
  }
];

module.exports = { TEMPLATES };
