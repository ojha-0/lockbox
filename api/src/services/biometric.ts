/**
 * Biometric Face Matching Simulation
 * Returns a simulated confidence score between 94-99.9%
 * In a real system, this would integrate with a face recognition API
 */

export const simulateFaceMatch = (): number => {
  // Generate a score between 94 and 99.9
  const baseScore = 94
  const range = 5.9
  const randomValue = Math.random() * range
  const score = baseScore + randomValue
  
  return Math.round(score * 10) / 10 // Round to 1 decimal place
}

export const isBiometricValid = (score: number): boolean => {
  // Consider biometric valid if score >= 90%
  return score >= 90
}

export const getBiometricConfidenceLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score < 90) return 'low'
  if (score < 95) return 'medium'
  return 'high'
}
