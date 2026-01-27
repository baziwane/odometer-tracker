-- Create function to validate odometer reading sequence
-- Ensures readings are in chronological order (non-decreasing by date)
CREATE OR REPLACE FUNCTION validate_reading_sequence()
RETURNS TRIGGER AS $$
DECLARE
  prev_reading INTEGER;
  next_reading INTEGER;
BEGIN
  -- Get the reading immediately before the new/updated date
  SELECT reading INTO prev_reading
  FROM odometer_readings
  WHERE car_id = NEW.car_id
    AND date < NEW.date
    AND id != NEW.id  -- Exclude current record for updates
  ORDER BY date DESC
  LIMIT 1;

  -- Get the reading immediately after the new/updated date
  SELECT reading INTO next_reading
  FROM odometer_readings
  WHERE car_id = NEW.car_id
    AND date > NEW.date
    AND id != NEW.id  -- Exclude current record for updates
  ORDER BY date ASC
  LIMIT 1;

  -- Validate against previous reading (if exists)
  IF prev_reading IS NOT NULL AND NEW.reading < prev_reading THEN
    RAISE EXCEPTION 'Reading % on % is less than previous reading % (must be >= %)',
      NEW.reading,
      NEW.date,
      prev_reading,
      prev_reading
    USING ERRCODE = '23514'; -- check_violation
  END IF;

  -- Validate against next reading (if exists)
  IF next_reading IS NOT NULL AND NEW.reading > next_reading THEN
    RAISE EXCEPTION 'Reading % on % is greater than next reading % (must be <= %)',
      NEW.reading,
      NEW.date,
      next_reading,
      next_reading
    USING ERRCODE = '23514'; -- check_violation
  END IF;

  -- If validation passes, check against car's initial odometer (if set)
  IF prev_reading IS NULL THEN
    -- This is the first reading for this car
    DECLARE
      car_initial_odometer INTEGER;
    BEGIN
      SELECT initial_odometer INTO car_initial_odometer
      FROM cars
      WHERE id = NEW.car_id;

      IF car_initial_odometer IS NOT NULL AND NEW.reading < car_initial_odometer THEN
        RAISE EXCEPTION 'Reading % on % is less than car initial odometer % (must be >= %)',
          NEW.reading,
          NEW.date,
          car_initial_odometer,
          car_initial_odometer
        USING ERRCODE = '23514'; -- check_violation
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate readings before insert or update
CREATE TRIGGER validate_odometer_reading_sequence
  BEFORE INSERT OR UPDATE ON odometer_readings
  FOR EACH ROW
  EXECUTE FUNCTION validate_reading_sequence();
