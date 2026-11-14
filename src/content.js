export const onboarding = [
  { title: 'See both sides', text: 'Explore how the same situation can feel different to two people. Use guided prompts to understand each perspective and prepare for a constructive conversation.', image: 'onboarding-1.png', alt: 'Two people sitting together, each holding a phone.' },
  { title: 'Share your perspective', text: 'Choose a scenario and read what happened from your point of view. Focus on what the character needed and felt in that moment.', image: 'onboarding-2.png', alt: 'A person imagining a shared road trip while looking at their phone.' },
  { title: 'Compare and reflect', text: 'Review both perspectives side by side. Notice where your experiences were different, where they overlapped, and what may need more discussion.', image: 'onboarding-3.png', alt: 'Two people talking and listening to each other.' },
  { title: 'Plan for next time', text: 'Choose a small action or agreement you can both try in the future. You can also pause the conversation and return to it later.', image: 'onboarding-4.png', alt: 'Two people leaning toward each other with a shared understanding.' },
];

export const reflectionPaths = [
  { id: 'repair', label: 'Repair', title: 'Repair', description: 'Make a small gesture to reconnect.', image: 'repair.png', questions: ['What part of your perspective could you acknowledge?', 'Is there something you would like to apologize for or clarify?', 'What small gesture could help rebuild connection in this situation?', 'What do you think would help the other person feel heard?'] },
  { id: 'pause', label: 'Pause', title: 'Take a break', description: 'Take a deep breath before another discussion.', image: 'pause.png', questions: ['Are you too upset to listen right now?', 'What would help you feel ready to continue?', 'What do you need to say before taking a break?', 'When can you return to the conversation?'] },
  { id: 'agree', label: 'Agreement', title: 'Find common ground', description: 'Find something you can both work with.', image: 'agree.png', questions: ['What matters most to each of you?', 'What do you already agree about?', 'What change could address both people’s needs?', 'What can you both try next time?'] },
  { id: 'set-aside', label: 'Leave unresolved', title: 'Set it aside', description: 'Let the different views exist for now.', image: 'set-aside.png', questions: ['What does not need to be decided today?', 'What difference can you accept for now?', 'What still needs to be understood later?', 'How can you pause without blaming each other?'] },
  { id: 'later', label: 'Later', title: 'Come back later', description: 'Come back later with a little more space and clarity.', image: 'later.png', questions: ['What do you need time to think about?', 'When would be a good time to continue?', 'What do you want to understand before then?', 'What is the main point you want to discuss when you return?'] },
];

export const scenarioImages = {
  playlist: ['playlist-perspective-1.png', 'playlist-perspective-2.png'],
  project: ['project-perspective-1.png', 'project-perspective-2.png'],
  cafe: ['cafe-perspective-1.png', 'cafe-perspective-2.png'],
  studio: ['studio-perspective-1.png', 'studio-perspective-2.png'],
};
