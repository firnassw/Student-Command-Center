const bgColors = ['bg-accent-sage', 'bg-accent-mint', 'bg-accent-sand-track', 'bg-[#F7EACA]', 'bg-[#EED4BA]'];
const icons = ['menu_book', 'code', 'science', 'dataset', 'architecture', 'terminal'];

export const getCourseTheme = (courseName: string = '') => {
  // Use Java's String hashCode algorithm for excellent distribution
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = Math.imul(31, hash) + courseName.charCodeAt(i) | 0;
  }
  
  // Ensure positive hash
  hash = Math.abs(hash);

  const bgColor = bgColors[hash % bgColors.length];
  const icon = icons[hash % icons.length];

  return { bgColor, icon };
};
