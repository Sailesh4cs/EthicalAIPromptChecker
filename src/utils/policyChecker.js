// Policy checking utilities
import { sensitiveDataPatterns } from './patterns/sensitiveData.js';
import { proprietaryPatterns } from './patterns/proprietaryInfo.js';
import { promptInjectionPatterns } from './patterns/promptInjection.js';
import { ethicalConcernPatterns } from './patterns/ethicalConcerns.js';

/**
 * Checks if a prompt violates any of the defined policies
 * @param {string} prompt - The prompt text to check
 * @param {Object} rules - The rules configuration
 * @returns {Object} - Result with violations array
 */
export async function checkPolicy(prompt, rules) {
  const violations = [];
  const promptLower = prompt.toLowerCase();
  
  // Check for sensitive data patterns if rule is enabled
  if (rules.sensitiveData && rules.sensitiveData.enabled) {
    const sensitiveMatches = checkPatterns(promptLower, sensitiveDataPatterns);
    if (sensitiveMatches.length > 0) {
      violations.push({
        rule: 'sensitiveData',
        matches: sensitiveMatches,
        description: 'Prompt contains potential sensitive data'
      });
    }
  }
  
  // Check for proprietary information if rule is enabled
  if (rules.proprietaryInfo && rules.proprietaryInfo.enabled) {
    const proprietaryMatches = checkPatterns(promptLower, proprietaryPatterns);
    if (proprietaryMatches.length > 0) {
      violations.push({
        rule: 'proprietaryInfo',
        matches: proprietaryMatches,
        description: 'Prompt contains potential proprietary information'
      });
    }
  }
  
  // Check for prompt injection attempts if rule is enabled
  if (rules.promptInjection && rules.promptInjection.enabled) {
    const injectionMatches = checkPatterns(promptLower, promptInjectionPatterns);
    if (injectionMatches.length > 0) {
      violations.push({
        rule: 'promptInjection',
        matches: injectionMatches,
        description: 'Prompt may contain injection attempts'
      });
    }
  }
  
  // Check for ethical concerns if rule is enabled
  if (rules.ethicalConcerns && rules.ethicalConcerns.enabled) {
    const ethicalMatches = checkPatterns(promptLower, ethicalConcernPatterns);
    if (ethicalMatches.length > 0) {
      violations.push({
        rule: 'ethicalConcerns',
        matches: ethicalMatches,
        description: 'Prompt raises potential ethical concerns'
      });
    }
  }
  
  return { violations };
}

/**
 * Checks text against an array of patterns
 * @param {string} text - The text to check
 * @param {Array} patterns - Array of patterns to check against
 * @returns {Array} - Matching patterns found
 */
function checkPatterns(text, patterns) {
  return patterns.filter(pattern => {
    if (pattern.type === 'regex') {
      return new RegExp(pattern.pattern, 'i').test(text);
    } else if (pattern.type === 'keyword') {
      return text.includes(pattern.pattern.toLowerCase());
    }
    return false;
  }).map(pattern => pattern.name);
}