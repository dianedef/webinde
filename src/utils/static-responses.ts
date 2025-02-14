/**
 * Utilitaires pour la gestion des réponses statiques et dynamiques des posts
 */

import { getCollection } from 'astro:content';
import type { Post } from './types/content';
import { commonCombinations, paginationConfig } from '../config/tags';
import { tagHierarchy } from '../components/tagHierarchy';

/**
 * Normalise une chaîne en retirant les accents et en mettant en minuscules
 */
function normalizeString(str: string): string {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Groupe les tags par leur tag parent, en ignorant les parents qui ont des sous-tags sélectionnés
 * @param {string[]} tags - Liste des tags à grouper
 * @returns {Object} Un objet avec les tags principaux (sans ceux qui ont des sous-tags) et leurs sous-tags associés
 */
function groupTagsByParent(tags: string[]): { mainTags: string[], subTagsByParent: { [key: string]: string[] } } {
    console.log('=== Début groupTagsByParent ===');
    console.log('Tags reçus:', tags);
    
    const mainTags: string[] = [];
    const subTagsByParent: { [key: string]: string[] } = {};
    const parentsToIgnore = new Set<string>();

    // D'abord, identifier tous les sous-tags et marquer leurs parents comme à ignorer
    tags.forEach(tag => {
        const normalizedTag = normalizeString(tag);
        console.log(`\nAnalyse du tag "${tag}" (normalisé: "${normalizedTag}")`);
        
        for (const [parentTag, data] of Object.entries(tagHierarchy)) {
            const normalizedParentTag = normalizeString(parentTag);
            console.log(`- Vérification avec le parent "${parentTag}" (normalisé: "${normalizedParentTag}")`);
            
            if (data.subtags) {
                const subtags = Object.keys(data.subtags);
                console.log(`  Sous-tags disponibles:`, subtags);
                const normalizedSubtags = subtags.map(t => normalizeString(t));
                console.log(`  Sous-tags normalisés:`, normalizedSubtags);
                
                if (normalizedSubtags.includes(normalizedTag)) {
                    console.log(`  ✓ Le tag "${tag}" est un sous-tag de "${parentTag}"`);
                    if (!subTagsByParent[parentTag]) {
                        subTagsByParent[parentTag] = [];
                    }
                    subTagsByParent[parentTag].push(tag);
                    parentsToIgnore.add(normalizedParentTag);
                }
            }
        }
    });

    console.log('\nParents à ignorer:', Array.from(parentsToIgnore));

    // Ensuite, ajouter uniquement les tags principaux qui n'ont pas de sous-tags sélectionnés
    tags.forEach(tag => {
        const normalizedTag = normalizeString(tag);
        console.log(`\nVérification si "${tag}" est un tag principal`);
        if (Object.keys(tagHierarchy).some(t => normalizeString(t) === normalizedTag)) {
            if (!parentsToIgnore.has(normalizedTag)) {
                console.log(`✓ "${tag}" est un tag principal et n'a pas de sous-tags sélectionnés`);
                mainTags.push(tag);
            } else {
                console.log(`✗ "${tag}" est ignoré car il a des sous-tags sélectionnés`);
            }
        } else {
            console.log(`- "${tag}" n'est pas un tag principal`);
        }
    });

    console.log('\nRésultat final:');
    console.log('Tags principaux:', mainTags);
    console.log('Sous-tags par parent:', subTagsByParent);
    console.log('=== Fin groupTagsByParent ===\n');

    return { mainTags, subTagsByParent };
}

/**
 * Récupère les posts pour un tag principal spécifique
 * @param {string} tag - Le tag principal à filtrer
 * @param {number} page - Numéro de la page (défaut: 1)
 * @returns {Promise<Post[]>} Les posts filtrés et paginés
 */
export async function getTagPosts(tag: string, page: number = 1): Promise<Post[]> {
    const allPosts = await getCollection('posts');
    const normalizedSearchTag = normalizeString(tag);
    const filteredPosts = allPosts
        .filter(post => 
            post.data.tags.some(t => normalizeString(t) === normalizedSearchTag)
        )
        .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

    const start = (page - 1) * paginationConfig.defaultPerPage;
    const end = start + paginationConfig.defaultPerPage;
    
    return filteredPosts.slice(start, end);
}

/**
 * Récupère les posts filtrés par une combinaison de tags
 * La fonction applique les règles suivantes :
 * 1. Les tags principaux sont COMPLÈTEMENT ignorés si un de leurs sous-tags est sélectionné
 * 2. Les sous-tags fonctionnent tous en mode "OU" global
 * 3. Les tags principaux sans sous-tags sélectionnés fonctionnent en mode "ET"
 * @param {string[]} tags - Liste des tags à filtrer (tags principaux et sous-tags)
 * @param {number} page - Numéro de la page (défaut: 1)
 * @returns {Promise<Post[]>} Les posts filtrés et paginés, ou un tableau vide si aucun résultat
 */
export async function getFilteredPosts(tags: string[], page: number = 1): Promise<Post[]> {
    console.log('\n=== Début getFilteredPosts ===');
    
    // Si aucun tag, retourner un tableau vide
    if (tags.length === 0) {
        console.log('Aucun tag fourni, retour tableau vide');
        return [];
    }

    console.log('Tags reçus:', tags);

    // Grouper les tags par leur parent pour déterminer quels tags utiliser
    const { mainTags, subTagsByParent } = groupTagsByParent(tags);
    console.log('\nTags groupés:');
    console.log('- Tags principaux:', mainTags);
    console.log('- Sous-tags par parent:', subTagsByParent);

    // Récupérer tous les tags à rechercher (sous-tags + tags principaux sans sous-tags)
    const tagsToSearch = [
        ...mainTags,
        ...Object.values(subTagsByParent).flat()
    ];
    console.log('\nTags à rechercher:', tagsToSearch);

    // Normaliser les tags à rechercher
    const normalizedTagsToSearch = tagsToSearch.map(tag => normalizeString(tag));
    console.log('Tags à rechercher (normalisés):', normalizedTagsToSearch);

    const allPosts = await getCollection('posts');
    console.log(`\nNombre total de posts: ${allPosts.length}`);

    const filteredPosts = allPosts
        .filter(post => {
            console.log(`\nAnalyse du post "${post.data.title}"`);
            // Normaliser tous les tags du post
            const normalizedPostTags = post.data.tags.map(t => normalizeString(t));
            console.log('Tags du post (normalisés):', normalizedPostTags);
            
            // Vérifier que le post contient tous les tags recherchés
            const hasAllTags = normalizedTagsToSearch.every(searchTag => {
                const hasTag = normalizedPostTags.includes(searchTag);
                if (hasTag) {
                    console.log(`✓ Tag trouvé: "${searchTag}"`);
                } else {
                    console.log(`✗ Tag manquant: "${searchTag}"`);
                }
                return hasTag;
            });
            
            console.log('Post a tous les tags?', hasAllTags ? '✓ Oui' : '✗ Non');
            return hasAllTags;
        })
        .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

    console.log(`\nNombre de posts filtrés: ${filteredPosts.length}`);
    if (filteredPosts.length > 0) {
        console.log('Posts trouvés:', filteredPosts.map(p => p.data.title));
    }

    const start = (page - 1) * paginationConfig.defaultPerPage;
    const end = start + paginationConfig.defaultPerPage;
    
    console.log('=== Fin getFilteredPosts ===\n');
    return filteredPosts.slice(start, end);
}

/**
 * Vérifie si un tag est un tag principal
 * @param {string} tag - Le tag à vérifier
 * @returns {boolean} True si c'est un tag principal
 */
export function isMainTag(tag: string): boolean {
    const normalizedTag = normalizeString(tag);
    const mainTagsSet = new Set(Object.keys(tagHierarchy).map(key => normalizeString(key as string)));
    return mainTagsSet.has(normalizedTag);
}

/**
 * Vérifie si une combinaison de tags est une combinaison courante pré-générée
 * @param {string[]} tags - Liste des tags à vérifier
 * @returns {boolean} True si la combinaison est pré-générée
 */
export function isCommonCombination(tags: string[]): boolean {
    const normalizedTags = tags.map(t => normalizeString(t)).sort();
    return commonCombinations.some(combo => 
        JSON.stringify(combo.map(t => normalizeString(t)).sort()) === JSON.stringify(normalizedTags)
    );
}

/**
 * Génère le chemin statique pour une combinaison de tags
 * @param {string[]} tags - Liste des tags
 * @returns {string} Le chemin de l'API pour cette combinaison
 */
export function generateStaticPath(tags: string[]): string {
    return tags.length === 1 
        ? `/api/tags/${tags[0]}.json`
        : `/api/combinations/${tags.sort().join('-')}.json`;
} 