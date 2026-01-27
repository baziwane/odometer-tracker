-- Enable Row Level Security on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE odometer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Cars policies
-- Users can only see their own cars
CREATE POLICY "Users can view their own cars"
  ON cars FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cars
CREATE POLICY "Users can insert their own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cars
CREATE POLICY "Users can update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cars
CREATE POLICY "Users can delete their own cars"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- Odometer readings policies
-- Users can view readings for their own cars
CREATE POLICY "Users can view readings for their own cars"
  ON odometer_readings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert readings for their own cars
CREATE POLICY "Users can insert readings for their own cars"
  ON odometer_readings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = odometer_readings.car_id
      AND cars.user_id = auth.uid()
    )
  );

-- Users can update their own readings
CREATE POLICY "Users can update their own readings"
  ON odometer_readings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own readings
CREATE POLICY "Users can delete their own readings"
  ON odometer_readings FOR DELETE
  USING (auth.uid() = user_id);

-- User settings policies
-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);
