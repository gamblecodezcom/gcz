-- ============================================================
-- ENABLE ENDLESS RAFFLE — Migration
-- Creates the first endless raffle and links it to wheel_config
-- ============================================================

-- Step 1: Create the first endless raffle (idempotent - only if it doesn't exist)
-- An endless raffle is identified by being linked via wheel_config.target_raffle_id
-- and having a NULL end_date (or very far future end_time)
DO $$
DECLARE
  endless_raffle_id INTEGER;
  existing_linked_id INTEGER;
BEGIN
  -- Check if wheel_config already has a target_raffle_id
  SELECT target_raffle_id INTO existing_linked_id
  FROM wheel_config
  WHERE id = 1 AND target_raffle_id IS NOT NULL;

  -- If there's already a linked raffle, check if it's suitable as endless
  IF existing_linked_id IS NOT NULL THEN
    SELECT id INTO endless_raffle_id
    FROM raffles
    WHERE id = existing_linked_id AND active = true;
    
    IF endless_raffle_id IS NOT NULL THEN
      RAISE NOTICE 'Endless raffle already linked with ID: %', endless_raffle_id;
      -- Update the raffle to ensure it's marked as endless (NULL end_date)
      UPDATE raffles
      SET end_date = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = endless_raffle_id;
    END IF;
  END IF;

  -- If no suitable endless raffle exists, create one
  IF endless_raffle_id IS NULL THEN
    INSERT INTO raffles (
      title,
      description,
      prize_value,
      secret_code,
      start_date,
      end_date,
      active,
      secret,
      hidden,
      prize_type,
      raffle_type,
      entry_sources,
      entries_per_source
    ) VALUES (
      'Never-Ending Raffle',
      'Spin the wheel daily to earn entries! This raffle never ends and winners are drawn periodically.',
      'Mystery Crypto Box',
      NULL,  -- No secret code needed
      CURRENT_TIMESTAMP,
      NULL,  -- NULL end_date indicates endless
      true,
      false,
      false,
      'crypto_box',
      'daily',  -- Use 'daily' type for endless raffles
      '["wheel","wheel_spin"]'::jsonb,
      '{"wheel":5,"wheel_spin":5}'::jsonb
    ) RETURNING id INTO endless_raffle_id;

    RAISE NOTICE 'Created endless raffle with ID: %', endless_raffle_id;
  END IF;

  -- Step 2: Link the endless raffle to wheel_config
  UPDATE wheel_config
  SET target_raffle_id = endless_raffle_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
    AND (target_raffle_id IS NULL OR target_raffle_id != endless_raffle_id);

  IF FOUND THEN
    RAISE NOTICE 'Linked wheel_config to endless raffle ID: %', endless_raffle_id;
  ELSE
    RAISE NOTICE 'wheel_config already linked to endless raffle ID: %', endless_raffle_id;
  END IF;
END $$;

-- Verify the setup
SELECT 
  r.id as raffle_id,
  r.title as raffle_name,
  r.active,
  r.end_date,
  wc.target_raffle_id,
  CASE 
    WHEN wc.target_raffle_id = r.id THEN '✓ LINKED'
    ELSE '✗ NOT LINKED'
  END as link_status
FROM raffles r
CROSS JOIN wheel_config wc
WHERE r.id = (SELECT target_raffle_id FROM wheel_config WHERE id = 1)
  AND wc.id = 1;
