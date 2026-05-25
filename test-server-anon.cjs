const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);

async function authServer() {
  try {
    const user = await signInAnonymously(auth);
    console.log("Logged in anonymous server!", user.user.uid);
  } catch (e) {
    console.log("Error:", e);
  }
}
authServer();
