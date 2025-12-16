// Authentication middleware

function requireAuth(req, res, next) {
  if (!req.session.authenticated) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.authenticated || req.session.username !== process.env.ADMIN_USERNAME) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin privileges required' 
    });
  }
  next();
}

// Activity logger
function logActivity(action, entityType = null) {
  return async (req, res, next) => {
    const db = require('../db');

    try {
      await db.insert('activity_log', {
        actor: req.session.username || 'system',
        action,
        entity_type: entityType,
        entity_id: req.params.id || null,
        payload: JSON.stringify(req.body || {}),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent')
      });
    } catch (error) {
      console.error('Activity log error:', error);
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  logActivity
};
