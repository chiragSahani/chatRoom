/*
  # Chat Application Schema

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for room access and message creation
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policies for messages
CREATE POLICY "Users can view messages in rooms they have access to"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
    )
  );

CREATE POLICY "Users can create messages in rooms"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
    )
  );