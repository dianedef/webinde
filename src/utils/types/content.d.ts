import type { CollectionEntry } from "astro:content";

export interface PostGridProps {
  posts: CollectionEntry<"posts">[];
  showLoadingSpinner?: boolean;
  currentPage?: number;
  totalPages?: number;
  onLoadMore?: () => void;
}

export interface PostListProps {
  posts: CollectionEntry<"posts">[];
}

export interface RecentPostsProps {
  count?: number;
}

export interface FilterTagsProps {
  mainTags: string[];
}

export interface PostMetadata {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  draft?: boolean;
}

export interface PostData extends PostMetadata {
  id: string;
  slug: string;
  collection: string;
} 