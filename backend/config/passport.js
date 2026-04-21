import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import User from "../models/User.js";
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: `${process.env.CLIENT_URL}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    let user = await User.findOne({
      $or: [
        { googleId: profile.id },
        { email: email }
      ]
    });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email
      });
    }
    return done(null, user);
  } catch (error) {
    console.error("❌ ERROR:", error);
    return done(error, null);
  }
}));

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: `${process.env.CLIENT_URL}/auth/linkedin/callback`,
  scope: ["r_emailaddress", "r_liteprofile"]
},
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔵 LinkedIn profile:", profile);

    const email = profile.emails?.[0]?.value || `linkedin_${profile.id}@dummy.com`;

    let user = await User.findOne({
      $or: [
        { linkedinId: profile.id },
        { email }
      ]
    });

    if (!user) {
      user = await User.create({
        linkedinId: profile.id,
        name: profile.displayName,
        email
      });
    }

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));