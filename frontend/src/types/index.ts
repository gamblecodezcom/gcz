export interface WheelEligibility {
  // Core eligibility flags
  loggedIn: boolean;
  profileComplete: boolean;
  newsletter: boolean;

  // Whether user can spin right now
  eligible: boolean;

  // Cooldown info
  nextSpin?: string;
  hoursUntilNext?: number;

  // Optional backend-driven fields
  spinsRemaining?: number;
  lastSpinAt?: string | null;

  // Optional user metadata
  userId?: string;
  username?: string;

  // Future-proofing
  [key: string]: any;
}
