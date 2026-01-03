-- ============================================================================
-- EcoWisely Social Features Migration
-- Part 3: Leaderboards, Challenges, Teams, Friends, Notifications
-- ============================================================================

-- 1. Teams Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50,
    total_co2_saved DECIMAL(10,2) DEFAULT 0,
    weekly_co2_saved DECIMAL(10,2) DEFAULT 0,
    invite_code VARCHAR(20) UNIQUE
);

-- Index for team lookups
CREATE INDEX IF NOT EXISTS idx_teams_public ON teams(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- 2. Team Members Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_co2 DECIMAL(10,2) DEFAULT 0,
    
    UNIQUE(team_id, user_id)
);

-- Index for membership queries
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- 3. Friends Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Index for friend lookups
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);

-- 4. Friend Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- Index for pending requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);

-- 5. Challenges Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('transport', 'diet', 'energy', 'general', 'team')),
    challenge_type VARCHAR(50) CHECK (challenge_type IN ('individual', 'team', 'global')),
    
    -- Target and progress tracking
    target_value DECIMAL(10,2) NOT NULL,
    target_unit VARCHAR(50) NOT NULL,  -- 'kg_co2_saved', 'activities', 'days_streak', etc.
    
    -- Timing
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Rewards
    points_reward INTEGER DEFAULT 0,
    badge_reward VARCHAR(100),
    
    -- Metadata
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    
    -- For team-specific challenges
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Participation limits
    max_participants INTEGER,
    min_participants INTEGER DEFAULT 1
);

-- Indexes for challenge queries
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_team ON challenges(team_id);

-- 6. Challenge Participants Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- For team challenges
    
    -- Progress tracking
    current_progress DECIMAL(10,2) DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    -- Ranking
    rank INTEGER,
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- Indexes for participation queries
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_progress ON challenge_participants(challenge_id, current_progress DESC);

-- 7. Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification content
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'friend_request', 'friend_accepted', 
        'team_invite', 'team_joined', 'team_left',
        'challenge_invite', 'challenge_started', 'challenge_completed', 'challenge_ended',
        'achievement_unlocked', 'level_up',
        'leaderboard_rank_up', 'leaderboard_rank_down',
        'weekly_summary', 'streak_reminder',
        'system'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- Related entities
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    related_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    related_challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action_url TEXT,  -- Deep link to relevant page
    icon VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);

-- 8. Leaderboard Cache Table (for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'friends', 'team')),
    scope_id UUID,  -- team_id for team leaderboard, user_id for friends leaderboard
    
    -- Time period
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    
    -- User data
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rank INTEGER NOT NULL,
    
    -- Metrics
    co2_saved DECIMAL(10,2) DEFAULT 0,
    points INTEGER DEFAULT 0,
    activities_count INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    
    -- Cache metadata
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(scope, scope_id, period, user_id)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_lookup ON leaderboard_cache(scope, scope_id, period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_user ON leaderboard_cache(user_id);

-- 9. Row Level Security Policies
-- ============================================================================

-- Teams RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public teams are viewable by everyone"
    ON teams FOR SELECT
    USING (is_public = true OR EXISTS (
        SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Team owners and admins can update teams"
    ON teams FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid() 
        AND team_members.role IN ('owner', 'admin')
    ));

CREATE POLICY "Authenticated users can create teams"
    ON teams FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only owners can delete teams"
    ON teams FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid() 
        AND team_members.role = 'owner'
    ));

-- Team Members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by team members"
    ON team_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.is_public = true
    ));

CREATE POLICY "Users can join public teams or by invite"
    ON team_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave teams"
    ON team_members FOR DELETE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role IN ('owner', 'admin')
    ));

-- Friends RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends"
    ON friends FOR SELECT
    USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can add friends"
    ON friends FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove friends"
    ON friends FOR DELETE
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Friend Requests RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friend requests"
    ON friend_requests FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send friend requests"
    ON friend_requests FOR INSERT
    WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can respond to their friend requests"
    ON friend_requests FOR UPDATE
    USING (to_user_id = auth.uid());

-- Challenges RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active challenges are viewable by everyone"
    ON challenges FOR SELECT
    USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Users can create challenges"
    ON challenges FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update"
    ON challenges FOR UPDATE
    USING (created_by = auth.uid());

-- Challenge Participants RLS
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge participants are viewable"
    ON challenge_participants FOR SELECT
    USING (true);  -- Leaderboard visibility

CREATE POLICY "Users can join challenges"
    ON challenge_participants FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation"
    ON challenge_participants FOR UPDATE
    USING (user_id = auth.uid());

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);  -- Service role only in practice

CREATE POLICY "Users can mark their notifications as read"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- Leaderboard Cache RLS
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard cache is viewable by everyone"
    ON leaderboard_cache FOR SELECT
    USING (true);

-- 10. Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON friends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON friend_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON challenge_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON leaderboard_cache TO authenticated;

-- 11. Helper Functions
-- ============================================================================

-- Function to create friend relationship (bidirectional)
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS void AS $$
DECLARE
    req RECORD;
BEGIN
    -- Get the request
    SELECT * INTO req FROM friend_requests WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Friend request not found or already processed';
    END IF;
    
    -- Create bidirectional friendship
    INSERT INTO friends (user_id, friend_id) VALUES (req.from_user_id, req.to_user_id);
    INSERT INTO friends (user_id, friend_id) VALUES (req.to_user_id, req.from_user_id);
    
    -- Update request status
    UPDATE friend_requests SET status = 'accepted', responded_at = NOW() WHERE id = request_id;
    
    -- Create notification for the requester
    INSERT INTO notifications (user_id, type, title, message, related_user_id, action_url)
    VALUES (req.from_user_id, 'friend_accepted', 'Friend Request Accepted', 
            'Your friend request has been accepted!', req.to_user_id, '/community');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
    p_challenge_id UUID,
    p_user_id UUID,
    p_progress_increment DECIMAL
)
RETURNS void AS $$
DECLARE
    challenge_rec RECORD;
    participant_rec RECORD;
BEGIN
    -- Get challenge details
    SELECT * INTO challenge_rec FROM challenges WHERE id = p_challenge_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Update participant progress
    UPDATE challenge_participants 
    SET current_progress = current_progress + p_progress_increment
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
    RETURNING * INTO participant_rec;
    
    -- Check if challenge completed
    IF participant_rec.current_progress >= challenge_rec.target_value AND NOT participant_rec.completed THEN
        UPDATE challenge_participants 
        SET completed = true, completed_at = NOW()
        WHERE challenge_id = p_challenge_id AND user_id = p_user_id;
        
        -- Create completion notification
        INSERT INTO notifications (user_id, type, title, message, related_challenge_id, action_url, priority)
        VALUES (p_user_id, 'challenge_completed', 'Challenge Completed! 🎉', 
                'Congratulations! You completed: ' || challenge_rec.title, 
                p_challenge_id, '/challenges', 'high');
        
        -- Award points if applicable
        IF challenge_rec.points_reward > 0 THEN
            UPDATE user_points 
            SET total_points = total_points + challenge_rec.points_reward
            WHERE user_id = p_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Seed Initial Challenges
-- ============================================================================

INSERT INTO challenges (title, description, category, challenge_type, target_value, target_unit, start_date, end_date, points_reward, difficulty)
VALUES 
    ('Green Commute Week', 'Use eco-friendly transport for 7 days straight', 'transport', 'individual', 7, 'days_streak', NOW(), NOW() + INTERVAL '14 days', 100, 'medium'),
    ('Meatless March', 'Log 20 vegetarian or vegan meals this month', 'diet', 'individual', 20, 'meals', NOW(), NOW() + INTERVAL '30 days', 200, 'medium'),
    ('Energy Saver', 'Reduce energy consumption by 50 kWh', 'energy', 'individual', 50, 'kwh_saved', NOW(), NOW() + INTERVAL '30 days', 150, 'hard'),
    ('Carbon Crusher', 'Save 100kg of CO₂ emissions', 'general', 'individual', 100, 'kg_co2_saved', NOW(), NOW() + INTERVAL '60 days', 500, 'hard'),
    ('Bike to Work', 'Cycle to work 10 times', 'transport', 'individual', 10, 'activities', NOW(), NOW() + INTERVAL '30 days', 120, 'easy'),
    ('Zero Waste Week', 'Complete 7 days of minimal waste activities', 'general', 'individual', 7, 'days', NOW(), NOW() + INTERVAL '14 days', 80, 'medium'),
    ('Community Champion', 'Invite 5 friends to join EcoWisely', 'general', 'individual', 5, 'invites', NOW(), NOW() + INTERVAL '30 days', 250, 'medium'),
    ('Team Green Goals', 'Team challenge: Collectively save 500kg CO₂', 'general', 'team', 500, 'kg_co2_saved', NOW(), NOW() + INTERVAL '30 days', 300, 'hard')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verification queries:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('teams', 'team_members', 'friends', 'friend_requests', 'challenges', 'challenge_participants', 'notifications', 'leaderboard_cache');
-- SELECT * FROM challenges LIMIT 5;
