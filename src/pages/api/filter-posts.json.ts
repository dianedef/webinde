/**
 * Endpoint dynamique pour filtrer les posts par tags.
 * Le fichier a l'extension .json.ts car :
 * 1. .ts permet à Astro de traiter le fichier comme du TypeScript
 * 2. .json dans le nom génère une route qui renvoie du JSON
 * Donc /api/filter-posts.json.ts devient /api/filter-posts.json dans le build final
 */

import type { APIRoute } from 'astro';
import { getFilteredPosts, isCommonCombination } from '../../utils/static-responses';
import { commonCombinations, cacheConfig } from '../../config/tags';

/**
 * Pré-génère les routes statiques pour les combinaisons de tags courantes
 * Ces routes seront construites au build et serviront plus rapidement
 * @returns {Array} Un tableau des chemins à pré-générer avec leurs props
 */
export async function getStaticPaths() {
    return commonCombinations.map(combo => ({
        params: { tags: combo.join(',') },
        props: { isCommonCombo: true }
    }));
}

/**
 * Gestionnaire de requête GET pour le filtrage des posts
 * Accepte les paramètres suivants :
 * @param {string[]} tags - Liste des tags à filtrer (peut inclure tags principaux et sous-tags)
 * @param {number} page - Numéro de la page (défaut: 1)
 * @param {number} perPage - Nombre de posts par page (défaut: 15)
 * @returns {Response} Réponse JSON avec les posts filtrés et les métadonnées
 */
export const GET: APIRoute = async ({ url, props }) => {
    try {
        // Récupérer les paramètres de l'URL
        const searchParams = url.searchParams;
        const tags = searchParams.getAll('tags').map(tag => tag.toLowerCase());
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('perPage') || '15');

        // Récupérer les posts filtrés
        const posts = await getFilteredPosts(tags, page);
        
        // Vérifier si c'est une combinaison pré-générée
        const isStatic = props?.isCommonCombo || isCommonCombination(tags);

        // Message si aucun résultat
        const message = posts.length === 0 ? 'Aucun résultat trouvé pour cette combinaison de tags' : undefined;

        return new Response(JSON.stringify({
            tags,
            posts,
            page,
            perPage,
            isStatic,
            message
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': isStatic ? cacheConfig.staticCacheControl : cacheConfig.dynamicCacheControl
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des posts filtrés:', error);
        return new Response(JSON.stringify({
            error: 'Erreur serveur'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}; 