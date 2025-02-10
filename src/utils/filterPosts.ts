import type { TagHierarchy, SelectedTags } from './types/tags';
import { tagHierarchy } from '../components/tagHierarchy';

// S'assurer que la hiérarchie est disponible globalement
if (typeof window !== 'undefined') {
  (window as any).tagHierarchy = tagHierarchy;
}

export function initializeFilters() {
  const mainCheckboxes = document.querySelectorAll('.main-tag-checkbox');
  const subtagContainers = document.querySelectorAll('.subtags-container');
  const subtagCheckboxes = document.querySelectorAll('.subtag-checkbox');
  const subsubtagCheckboxes = document.querySelectorAll('.subsubtag-checkbox');
  const posts = document.querySelectorAll('.post');

  function getTagLabel(key: string): string {
    const hierarchy = ((window as any).tagHierarchy || tagHierarchy) as TagHierarchy;
    // Vérifier niveau 1
    if (hierarchy[key]) {
      return hierarchy[key].label;
    }
    // Vérifier niveau 2
    for (const mainKey in hierarchy) {
      if (hierarchy[mainKey].subtags && hierarchy[mainKey].subtags[key]) {
        return hierarchy[mainKey].subtags[key].label;
      }
    }
    // Vérifier niveau 3
    for (const mainKey in hierarchy) {
      const subtags = hierarchy[mainKey].subtags;
      if (subtags) {
        for (const subKey in subtags) {
          if (subtags[subKey].subtags && subtags[subKey].subtags[key]) {
            return subtags[subKey].subtags[key].label;
          }
        }
      }
    }
    return key;
  }

  function getSelectedTags(): SelectedTags {
    const selectedMainTags = Array.from(mainCheckboxes)
      .filter((cb: Element): cb is HTMLInputElement => cb instanceof HTMLInputElement && cb.checked)
      .map(cb => cb.value);

    const selectedSubtags = Array.from(subtagCheckboxes)
      .filter((cb: Element): cb is HTMLInputElement => cb instanceof HTMLInputElement && cb.checked)
      .map(cb => getTagLabel(cb.value));

    const selectedSubsubtags = Array.from(subsubtagCheckboxes)
      .filter((cb: Element): cb is HTMLInputElement => cb instanceof HTMLInputElement && cb.checked)
      .map(cb => getTagLabel(cb.value));

    return { selectedMainTags, selectedSubtags, selectedSubsubtags };
  }

  function shouldShowPost(postTags: string[], selectedMainTags: string[], selectedSubtags: string[], selectedSubsubtags: string[]) {
    // Si aucun filtre n'est sélectionné, afficher le post
    if (selectedMainTags.length === 0 && selectedSubtags.length === 0 && selectedSubsubtags.length === 0) {
      return true;
    }

    const hierarchy = (window as any).tagHierarchy as TagHierarchy;
    const postTagsLower = postTags.map(tag => tag.toLowerCase());
    
    const hasMainTag = selectedMainTags.length === 0 || 
      selectedMainTags.some(mainTag => {
        const mainTagLabel = hierarchy[mainTag]?.label.toLowerCase();
        return postTagsLower.includes(mainTagLabel);
      });

    // Pour les sous-tags et sous-sous-tags, comparer directement les labels
    const hasSubTag = selectedSubtags.length === 0 || 
      selectedSubtags.some(subTag => postTagsLower.includes(subTag.toLowerCase()));

    const hasSubsubTag = selectedSubsubtags.length === 0 || 
      selectedSubsubtags.some(subsubTag => postTagsLower.includes(subsubTag.toLowerCase()));

    return hasMainTag && hasSubTag && hasSubsubTag;
  }

  function filterPosts() {
    const { selectedMainTags, selectedSubtags, selectedSubsubtags } = getSelectedTags();

    posts.forEach(post => {
      const postTags = JSON.parse(post.getAttribute('data-tags') || '[]');
      const shouldShow = shouldShowPost(postTags, selectedMainTags, selectedSubtags, selectedSubsubtags);
      post.classList.toggle('hidden', !shouldShow);
    });
    
    // Appliquer l'infinite scroll après le filtrage
    applyInfiniteScroll();
  }

  // Implémentation de l'infinite scroll
  const postsPerBatch = 15;
  let observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        obs.unobserve(entry.target);
        revealNextBatch();
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '-100px 0px'  // Déclenche 100px plus tard
  });

  function revealNextBatch() {
    const filteredPosts = Array.from(document.querySelectorAll('.post:not(.hidden)'));
    const hiddenPosts = filteredPosts.filter(post => post.classList.contains('infinite-hidden'));
    const postsToReveal = hiddenPosts.slice(0, postsPerBatch);
    postsToReveal.forEach(post => {
      post.classList.remove('infinite-hidden');
      const imgs = post.querySelectorAll('img');
      imgs.forEach(img => img.setAttribute('loading', 'eager'));
    });
    
    // Re-observer le dernier post visible s'il reste des posts masqués
    const newFilteredPosts = Array.from(document.querySelectorAll('.post:not(.hidden)'));
    const visiblePosts = newFilteredPosts.filter(post => !post.classList.contains('infinite-hidden'));
    if (visiblePosts.length < newFilteredPosts.length) {
      const lastVisible = visiblePosts[visiblePosts.length - 1];
      if (lastVisible) observer.observe(lastVisible);
    }
  }

  function applyInfiniteScroll() {
    // Réinitialiser l'observer
    observer.disconnect();
    const filteredPosts = Array.from(document.querySelectorAll('.post:not(.hidden)'));
    // Réinitialiser la classe infinite-hidden
    filteredPosts.forEach(post => post.classList.remove('infinite-hidden'));

    if (filteredPosts.length > postsPerBatch) {
      filteredPosts.forEach((post, index) => {
        if (index >= postsPerBatch) {
          post.classList.add('infinite-hidden');
          const imgs = post.querySelectorAll('img');
          imgs.forEach(img => img.setAttribute('loading', 'lazy'));
        } else {
          const imgs = post.querySelectorAll('img');
          imgs.forEach(img => img.setAttribute('loading', 'eager'));
        }
      });
      const lastVisible = filteredPosts[postsPerBatch - 1];
      if (lastVisible) observer.observe(lastVisible);
    } else {
      filteredPosts.forEach(post => {
        const imgs = post.querySelectorAll('img');
        imgs.forEach(img => img.setAttribute('loading', 'eager'));
      });
    }
  }

  // Gestion des tags principaux
  mainCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const mainTag = target.dataset.category;
      const subtagContainer = document.querySelector(`[data-parent="${mainTag}"]`);
      
      if (subtagContainer) {
        if (target.checked) {
          subtagContainer.classList.remove('hidden');
        } else {
          // Cacher le conteneur de sous-tags
          subtagContainer.classList.add('hidden');
          
          // Décocher tous les sous-tags
          const subtagCheckboxes = subtagContainer.querySelectorAll('input[type="checkbox"]');
          subtagCheckboxes.forEach((cb: Element) => {
            if (cb instanceof HTMLInputElement) {
              cb.checked = false;
            }
          });
          
          // Cacher et décocher tous les sous-sous-tags liés
          const subsubtagContainers = document.querySelectorAll(`.subsubtags-container[data-parent^="${mainTag}-"]`);
          subsubtagContainers.forEach(container => {
            container.classList.add('hidden');
            const subsubtagCheckboxes = container.querySelectorAll('input[type="checkbox"]');
            subsubtagCheckboxes.forEach((cb: Element) => {
              if (cb instanceof HTMLInputElement) {
                cb.checked = false;
              }
            });
          });
        }
      }
      
      filterPosts();
    });
  });

  // Gestion des sous-tags
  subtagCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      filterPosts();
    });
  });

  // Gestion des sous-sous-tags
  subsubtagCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', filterPosts);
  });

  // Initialisation du filtrage
  filterPosts();

  // Appliquer l'infinite scroll après l'initialisation
  applyInfiniteScroll();
} 