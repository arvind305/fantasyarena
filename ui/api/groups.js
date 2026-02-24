const { verifyGoogleToken, createServiceClient, unauthorized, badRequest } = require('./_lib/auth');
const { CURRENT_TOURNAMENT } = require('./_lib/tournament');

/**
 * POST /api/groups
 *
 * Authenticated group operations: create or join.
 * Action specified via request body: { action: "create" | "join", ... }
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyGoogleToken(req);
  if (!user) return unauthorized(res, 'Invalid or expired token');

  const { action } = req.body;
  const sb = createServiceClient();

  try {
    if (action === 'create') {
      const { name, displayName } = req.body;
      if (!name) return badRequest(res, 'Group name is required');

      const groupId = 'g' + Date.now();
      const joinCode = name.slice(0, 3).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const now = new Date().toISOString();

      const { data: group, error: groupError } = await sb
        .from('groups')
        .insert({
          group_id: groupId,
          name,
          join_code: joinCode,
          created_by: user.userId,
          event_id: CURRENT_TOURNAMENT.id,
          created_at: now,
        })
        .select()
        .single();
      if (groupError) throw new Error(groupError.message);

      const { error: memberError } = await sb
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.userId,
          display_name: displayName || user.name,
          score: 0,
          joined_at: now,
        });
      if (memberError) throw new Error(memberError.message);

      return res.status(200).json({
        success: true,
        group: {
          groupId,
          name: group.name,
          joinCode: group.join_code,
          createdBy: group.created_by,
          createdAt: group.created_at,
          memberIds: [user.userId],
          members: [{ userId: user.userId, displayName: displayName || user.name, score: 0 }],
        },
      });
    }

    if (action === 'join') {
      const { joinCode, displayName } = req.body;
      if (!joinCode) return badRequest(res, 'Join code is required');

      const { data: group, error: findError } = await sb
        .from('groups')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();
      if (findError) return badRequest(res, 'INVALID_GROUP_CODE');

      const { data: existingMember } = await sb
        .from('group_members')
        .select('id')
        .eq('group_id', group.group_id)
        .eq('user_id', user.userId)
        .maybeSingle();
      if (existingMember) return badRequest(res, 'ALREADY_A_MEMBER');

      const { error: joinError } = await sb
        .from('group_members')
        .insert({
          group_id: group.group_id,
          user_id: user.userId,
          display_name: displayName || user.name,
          score: 0,
          joined_at: new Date().toISOString(),
        });
      if (joinError) throw new Error(joinError.message);

      const { data: members } = await sb
        .from('group_members')
        .select('user_id, display_name, score')
        .eq('group_id', group.group_id);

      return res.status(200).json({
        success: true,
        group: {
          groupId: group.group_id,
          name: group.name,
          joinCode: group.join_code,
          createdBy: group.created_by,
          createdAt: group.created_at,
          memberIds: members.map(m => m.user_id),
          members: members.map(m => ({ userId: m.user_id, displayName: m.display_name, score: m.score })),
        },
      });
    }

    return badRequest(res, 'Invalid action. Use "create" or "join".');
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
