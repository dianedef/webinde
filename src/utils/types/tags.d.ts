export interface TagCategory {
  label: string;
  subtags?: {
    [key: string]: TagCategory;
  }
}

export interface TagHierarchy {
  [key: string]: TagCategory;
}

export interface SelectedTags {
  selectedMainTags: string[];
  selectedSubtags: string[];
  selectedSubsubtags: string[];
} 