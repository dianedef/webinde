interface TagHierarchy {
  [key: string]: {
    label: string;
    subtags: {
      [key: string]: {
        label: string;
      }
    }
  }
}

export const tagHierarchy: TagHierarchy = {
  seo: {
    label: 'SEO',
    subtags: {
      'seo-technique': { label: 'Technique' },
      'seo-contenu': { label: 'Contenu' },
      'seo-local': { label: 'Local' },
      'seo-international': { label: 'International' }
    }
  },
  marketing: {
    label: 'Marketing',
    subtags: {
      'marketing-automation': { label: 'Automation' },
      'marketing-social': { label: 'Social Media' },
      'marketing-email': { label: 'Email' },
      'marketing-content': { label: 'Content' }
    }
  },
  tech: {
    label: 'Tech',
    subtags: {
      'tech-dev': { label: 'Développement' },
      'tech-cloud': { label: 'Cloud' },
      'tech-ia': { label: 'Intelligence Artificielle' },
      'tech-data': { label: 'Data' }
    }
  }
}; 