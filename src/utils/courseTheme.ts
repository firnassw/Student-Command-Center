const bgColors = ['bg-accent-sage', 'bg-accent-mint', 'bg-accent-sand-track'];
const icons = ['menu_book', 'code', 'science', 'dataset', 'architecture', 'terminal'];

export const getCourseTheme = (courseName: string = '') => {
  // Simple hash function for string
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Ensure positive hash
  hash = Math.abs(hash);

  const bgColor = bgColors[hash % bgColors.length];
  const icon = icons[hash % icons.length];

  return { bgColor, icon };
};
