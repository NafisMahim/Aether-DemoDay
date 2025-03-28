export interface CategoryMapping {
  traits: string[];
  jobTitles: string[];
  keywords: string[];
}

/**
 * Maps personality traits to career categories, job titles, and keywords
 */
export const personalityToCareerMap: Record<string, CategoryMapping> = {
  "Analytical": {
    traits: ["logical", "detail-oriented", "precise", "methodical", "analytical", "rational"],
    jobTitles: ["Data Analyst", "Financial Analyst", "Business Analyst", "Research Assistant", "Statistician"],
    keywords: ["analysis", "research", "data", "statistics", "finance"]
  },
  "Creative": {
    traits: ["imaginative", "artistic", "innovative", "expressive", "original", "unconventional"],
    jobTitles: ["Graphic Designer", "Content Creator", "Marketing Assistant", "UI/UX Designer", "Social Media Intern"],
    keywords: ["design", "creative", "content", "marketing", "media"]
  },
  "Leadership": {
    traits: ["confident", "decisive", "assertive", "persuasive", "strategic", "ambitious"],
    jobTitles: ["Project Management Intern", "Business Development", "Sales Intern", "Event Coordinator", "Team Lead"],
    keywords: ["management", "leadership", "business", "entrepreneurship", "coordination"]
  },
  "Technical": {
    traits: ["practical", "systematic", "structured", "efficient", "logical", "technical"],
    jobTitles: ["Software Developer", "IT Support", "Web Developer", "QA Tester", "DevOps Intern"],
    keywords: ["programming", "software", "development", "IT", "technology"]
  },
  "Social": {
    traits: ["empathetic", "cooperative", "supportive", "communicative", "friendly", "sociable"],
    jobTitles: ["HR Assistant", "Customer Support", "Community Manager", "Public Relations", "Healthcare Assistant"],
    keywords: ["communication", "customer service", "support", "healthcare", "community"]
  }
};

/**
 * Maps interest areas to recommended job titles for search
 */
export const interestToCareerMap: Record<string, string[]> = {
  "Technology": ["Software Engineer", "Web Developer", "IT Support", "Data Analyst", "QA Engineer"],
  "Business": ["Business Analyst", "Marketing Assistant", "Sales Representative", "Finance Intern", "Project Coordinator"],
  "Finance": ["Financial Analyst", "Accounting Intern", "Investment Banking", "Financial Planning", "Auditor"],
  "Healthcare": ["Medical Assistant", "Healthcare Administrator", "Research Assistant", "Pharmacy Intern", "Lab Assistant"],
  "Education": ["Teaching Assistant", "Education Coordinator", "Tutor", "Curriculum Developer", "Research Assistant"],
  "Marketing": ["Marketing Assistant", "Social Media Intern", "Content Creator", "Market Researcher", "PR Intern"],
  "Design": ["Graphic Designer", "UI/UX Designer", "Product Designer", "Visual Designer", "Web Designer"],
  "Engineering": ["Engineering Intern", "CAD Technician", "Research Assistant", "Quality Engineer", "Technical Support"],
  "Legal": ["Legal Assistant", "Paralegal", "Law Clerk", "Compliance Intern", "Legal Researcher"],
  "Media": ["Content Creator", "Journalism Intern", "Production Assistant", "Social Media Coordinator", "Editorial Assistant"],
  "Environment": ["Environmental Technician", "Sustainability Intern", "Research Assistant", "Conservation Intern", "Field Assistant"],
  "Non-profit": ["Program Assistant", "Development Intern", "Volunteer Coordinator", "Grant Writer", "Outreach Coordinator"],
  "Travel": ["Tourism Intern", "Event Coordinator", "Travel Assistant", "Customer Service", "Hospitality Intern"],
  "Photography": ["Photography Assistant", "Media Intern", "Content Creator", "Social Media Coordinator", "Visual Designer"],
  "Cooking": ["Culinary Intern", "Food Service", "Hospitality", "Restaurant Management", "Food Science Assistant"],
  "Reading": ["Editorial Assistant", "Publishing Intern", "Content Writer", "Research Assistant", "Library Intern"]
};

/**
 * Maps industry sectors to common job search keywords
 */
export const careerKeywordsByIndustry: Record<string, string[]> = {
  "Technology": ["tech", "software", "programming", "development", "engineering", "IT", "computer science"],
  "Business": ["business", "entrepreneurship", "management", "administration", "operations"],
  "Finance": ["finance", "accounting", "investment", "banking", "economics", "financial analysis"],
  "Healthcare": ["healthcare", "medical", "clinical", "patient care", "health sciences"],
  "Education": ["education", "teaching", "instruction", "curriculum", "academic", "school"],
  "Marketing": ["marketing", "advertising", "branding", "public relations", "communications"],
  "Design": ["design", "creative", "user experience", "visual", "multimedia"],
  "Engineering": ["engineering", "mechanical", "electrical", "civil", "chemical", "industrial"],
  "Legal": ["legal", "law", "compliance", "regulations", "contracts", "policy"],
  "Media": ["media", "journalism", "broadcasting", "publishing", "content creation"],
  "Environment": ["environmental", "sustainability", "conservation", "climate", "ecology"],
  "Non-profit": ["non-profit", "NGO", "philanthropy", "social impact", "community service"],
  "Government": ["government", "public sector", "civil service", "policy", "administration"],
  "Hospitality": ["hospitality", "tourism", "hotel", "restaurant", "customer service"]
};

/**
 * Matches quiz results to career categories
 * @param quizResults An object containing personality and interest data
 * @returns Array of matching career categories
 */
export function matchQuizResultsToCategories(quizResults: any): string[] {
  const categories: Set<string> = new Set();
  
  // Match personality traits from quiz results
  if (quizResults && quizResults.personality) {
    const personalityTraits = Object.entries(quizResults.personality)
      .filter(([_, value]) => (value as number) > 60) // Only use traits scoring over 60%
      .map(([trait]) => trait.toLowerCase());
    
    // Match personality traits to categories
    Object.entries(personalityToCareerMap).forEach(([category, mapping]) => {
      const matchingTraits = mapping.traits.filter(trait => 
        personalityTraits.some(pTrait => pTrait.includes(trait) || trait.includes(pTrait))
      );
      
      if (matchingTraits.length > 0) {
        categories.add(category);
      }
    });
  }
  
  // Add categories from interests
  if (quizResults && quizResults.interests) {
    quizResults.interests.forEach((interest: any) => {
      const category = interest.category;
      if (interestToCareerMap[category]) {
        categories.add(category);
      }
      
      // Also check subcategories
      if (interest.subcategories) {
        const subcategories = interest.subcategories.split(',').map((s: string) => s.trim());
        subcategories.forEach((subcat: string) => {
          Object.entries(interestToCareerMap).forEach(([cat, _]) => {
            if (subcat.toLowerCase().includes(cat.toLowerCase()) || 
                cat.toLowerCase().includes(subcat.toLowerCase())) {
              categories.add(cat);
            }
          });
        });
      }
    });
  }
  
  // If no matches found, return some default categories
  if (categories.size === 0) {
    return ["Technology", "Business", "Marketing"];
  }
  
  return Array.from(categories);
}

/**
 * Gets job titles and keywords for search based on provided categories
 * @param categories Array of career categories
 * @returns Object containing jobTitles and keywords arrays
 */
export function getJobSearchTerms(categories: string[]): {jobTitles: string[], keywords: string[]} {
  const jobTitles: Set<string> = new Set();
  const keywords: Set<string> = new Set();
  
  // Get job titles from personality categories
  categories.forEach(category => {
    if (personalityToCareerMap[category]) {
      personalityToCareerMap[category].jobTitles.forEach(title => jobTitles.add(title));
      personalityToCareerMap[category].keywords.forEach(keyword => keywords.add(keyword));
    }
    
    // Also get job titles from interest categories
    if (interestToCareerMap[category]) {
      interestToCareerMap[category].forEach(title => jobTitles.add(title));
    }
    
    // Add industry keywords
    if (careerKeywordsByIndustry[category]) {
      careerKeywordsByIndustry[category].forEach(keyword => keywords.add(keyword));
    }
  });
  
  // Always include "intern" and "internship" in keywords
  keywords.add("intern");
  keywords.add("internship");
  keywords.add("entry level");
  
  // Limit to reasonable number to avoid overwhelming the API
  const limitedJobTitles = Array.from(jobTitles).slice(0, 5);
  const limitedKeywords = Array.from(keywords).slice(0, 10);
  
  return {
    jobTitles: limitedJobTitles,
    keywords: limitedKeywords
  };
}