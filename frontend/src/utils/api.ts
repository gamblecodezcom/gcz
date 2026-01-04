export interface WheelEligibility {
  // Core eligibility flags
  loggedIn: boolean;
  profileComplete: boolean;
  newsletter: boolean;

  // Optional backend-driven fields
  canSpin?: boolean;
  spinsRemaining?: number;
  lastSpinAt?: string | null;

  // Optional user metadata
  userId?: string;
  username?: string;

  // Future-proofing: backend can add fields without breaking builds
  [key: string]: any;
}
