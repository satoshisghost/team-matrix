import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AppleStrategy from 'passport-apple';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ===== GOOGLE STRATEGY =====
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BASE_URL}/api/oauth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const avatar = profile.photos?.[0]?.value || '';

      // Try to find by googleId first, then by email
      let user = await User.findOne({ googleId: profile.id });
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          // Link existing account to Google
          user.googleId = profile.id;
          user.authProvider = 'google';
          if (!user.avatar && avatar) user.avatar = avatar;
          await user.save();
        }
      }
      if (!user) {
        user = await User.create({
          googleId:     profile.id,
          email:        email || `${profile.id}@google.oauth`,
          name:         profile.displayName || 'Google User',
          avatar,
          authProvider: 'google',
          role:         'player'
        });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// ===== APPLE STRATEGY =====
if (process.env.APPLE_CLIENT_ID) {
  passport.use(new AppleStrategy({
    clientID:         process.env.APPLE_CLIENT_ID,
    teamID:           process.env.APPLE_TEAM_ID,
    keyID:            process.env.APPLE_KEY_ID,
    privateKeyString: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    callbackURL:      `${BASE_URL}/api/oauth/apple/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, idToken, profile, done) => {
    try {
      const appleId = idToken?.sub;
      const email = idToken?.email;

      // Apple only sends name on the very first sign-in
      let fullName = 'Apple User';
      if (req.body?.user) {
        try {
          const appleUser = JSON.parse(req.body.user);
          if (appleUser.name) {
            fullName = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim() || fullName;
          }
        } catch (_) {}
      }

      let user = await User.findOne({ appleId });
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          user.appleId = appleId;
          user.authProvider = 'apple';
          await user.save();
        }
      }
      if (!user) {
        user = await User.create({
          appleId,
          email:        email || `${appleId}@privaterelay.appleid.com`,
          name:         fullName,
          authProvider: 'apple',
          role:         'player'
        });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// Helper: create JWT and redirect to app
const finishOAuth = (req, res, user) => {
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.redirect(`/?token=${token}`);
};

// ===== GOOGLE ROUTES =====
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/?error=google_failed' }),
  (req, res) => finishOAuth(req, res, req.user)
);

// ===== APPLE ROUTES =====
router.get('/apple',
  (req, res, next) => {
    if (!process.env.APPLE_CLIENT_ID) return res.redirect('/?error=apple_not_configured');
    next();
  },
  passport.authenticate('apple', { session: false })
);

// Apple sends a POST to the callback
router.post('/apple/callback',
  (req, res, next) => {
    if (!process.env.APPLE_CLIENT_ID) return res.redirect('/?error=apple_not_configured');
    next();
  },
  passport.authenticate('apple', { session: false, failureRedirect: '/?error=apple_failed' }),
  (req, res) => finishOAuth(req, res, req.user)
);

export default router;
