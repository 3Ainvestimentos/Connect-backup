// Mock de lucide-react para testes
const React = require('react');

const MockIcon = (props) => React.createElement('svg', Object.assign({
  'data-testid': 'mock-icon',
}, props));

// Lista dos icons usados no projeto
const icons = [
  'Wrench', 'FileText', 'Calendar', 'Camera', 'Clipboard', 'Cloud', 'Code',
  'Compass', 'CreditCard', 'Database', 'GitBranch', 'Globe', 'Heart', 'Home',
  'Image', 'Lightbulb', 'Link', 'List', 'Lock', 'Mail', 'Map', 'Menu',
  'MessageSquare', 'Monitor', 'Moon', 'Music', 'Package', 'Palette', 'Pen',
  'Phone', 'PieChart', 'Plane', 'Play', 'Plus', 'Power', 'Printer', 'Radio',
  'RefreshCw', 'Save', 'Search', 'Send', 'Server', 'Settings', 'Share',
  'Share2', 'Shield', 'ShoppingBag', 'Smartphone', 'Smile', 'Star', 'Sun',
  'Table', 'Tag', 'Target', 'Terminal', 'ThumbsUp', 'Tool', 'Trash', 'Truck',
  'Tv', 'Type', 'Unlock', 'Upload', 'User', 'Users', 'Video', 'Wifi',
  'X', 'Check', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
  'ArrowLeft', 'ArrowRight', 'AlertCircle', 'AlertTriangle', 'CheckCircle',
  'Info', 'Loader2', 'ExternalLink', 'Download', 'Filter', 'MoreVertical',
  'Edit', 'Eye', 'EyeOff', 'Clock', 'Folder', 'FolderOpen', 'Bell',
  'BookOpen', 'Bookmark', 'Briefcase', 'Building', 'Calculator', 'Car',
  'CaretDown', 'CaretUp', 'CaretLeft', 'CaretRight',
];

const mockIcons = {};
icons.forEach(icon => {
  mockIcons[icon] = MockIcon;
});

module.exports = mockIcons;
