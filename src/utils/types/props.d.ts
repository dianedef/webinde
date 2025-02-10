import type { ImageMetadata } from "astro";
import type { Heading } from "./heading";
import type { CollectionEntry } from "astro:content";

export interface BaseProps {
	title: string;
	description: string;
	classList?: string;
	pageTitle?: string;
	ogImage?: string;
}

export interface PostProps {
	author: string;
	pubDate: Date;
	headings: Heading[];
	description: string;
	title: string;
	id: string;
	imgUrl: ImageMetadata;
}

export interface PostCardProps {
	post: CollectionEntry<"posts">;
	index?: number;
}

export interface PostSideBarProps {
	headings: Heading[];
}

export interface PostContentProps {
	pubDate: Date;
	author: string;
} 