
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElementId: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  action?: 'click' | 'hover' | 'focus' | 'none';
  waitForElement?: boolean;
  delay?: number;
  optional?: boolean;
  validation?: () => boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  steps: TutorialStep[];
  isActive: boolean;
  tags: string[];
}

export interface TutorialProgress {
  tutorialId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  currentStep: number;
  totalSteps: number;
  startedAt?: Date;
  completedAt?: Date;
  lastActiveAt?: Date;
  timeSpent?: number;
  progressData?: Record<string, any>;
}

export interface TutorialState {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  currentStepIndex: number;
  isLoading: boolean;
  showSelection: boolean;
  highlightedElement: string | null;
  tutorials: Tutorial[];
  userProgress: Record<string, TutorialProgress>;
}

export interface TutorialAction {
  type: 'START_TUTORIAL' | 'NEXT_STEP' | 'PREVIOUS_STEP' | 'SKIP_STEP' | 
        'COMPLETE_TUTORIAL' | 'EXIT_TUTORIAL' | 'SHOW_SELECTION' | 
        'HIDE_SELECTION' | 'UPDATE_PROGRESS' | 'LOAD_TUTORIALS' | 
        'RESET_PROGRESS' | 'SET_HIGHLIGHTED_ELEMENT';
  payload?: any;
}

export interface TutorialContextType {
  state: TutorialState;
  dispatch: React.Dispatch<TutorialAction>;
  startTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  skipTutorial: () => void;
  exitTutorial: () => void;
  showTutorialSelection: () => void;
  hideTutorialSelection: () => void;
  resetProgress: (tutorialId?: string) => void;
  getTutorialProgress: (tutorialId: string) => TutorialProgress | null;
  isStepCompleted: (tutorialId: string, stepIndex: number) => boolean;
}

export interface TutorialProviderProps {
  children: React.ReactNode;
}

export interface TutorialSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TutorialStepPopoverProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onExit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface TutorialHighlightProps {
  targetElementId: string;
  padding?: number;
  isVisible: boolean;
}
