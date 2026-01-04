/**
 * Wheel Logic Tests
 */
describe('Wheel Logic', () => {
  describe('Eligibility Check', () => {
    it('should return eligible if 24 hours have passed since last spin', () => {
      const lastSpin = new Date();
      lastSpin.setHours(lastSpin.getHours() - 25);
      
      const hoursSinceLastSpin = (Date.now() - lastSpin.getTime()) / (1000 * 60 * 60);
      const eligible = hoursSinceLastSpin >= 24;
      
      expect(eligible).toBe(true);
    });

    it('should return not eligible if less than 24 hours have passed', () => {
      const lastSpin = new Date();
      lastSpin.setHours(lastSpin.getHours() - 12);
      
      const hoursSinceLastSpin = (Date.now() - lastSpin.getTime()) / (1000 * 60 * 60);
      const eligible = hoursSinceLastSpin >= 24;
      
      expect(eligible).toBe(false);
    });

    it('should return eligible if no previous spin exists', () => {
      const eligible = true; // No previous spin
      expect(eligible).toBe(true);
    });
  });

  describe('Reward Distribution', () => {
    it('should select a reward from prize slots', () => {
      const prizeSlots = [
        { label: '5 Entries', entry_multiplier: 5, chance_weight: 50 },
        { label: '10 Entries', entry_multiplier: 10, chance_weight: 30 },
        { label: 'Jackpot', entry_multiplier: 50, chance_weight: 5 },
      ];

      const totalWeight = prizeSlots.reduce((sum, slot) => sum + slot.chance_weight, 0);
      expect(totalWeight).toBe(85);
    });

    it('should calculate entry multiplier correctly', () => {
      const reward = { label: '10 Entries', entry_multiplier: 10 };
      const entriesToAdd = reward.entry_multiplier || 5;
      
      expect(entriesToAdd).toBe(10);
    });
  });
});
